"""
Smart Packing Assistant API - FastAPI Backend

This Python fastAPI service acts as the GenAI backend for the Smart Packing Assistant application. 
It receives trip details from the frontend, queries an LLM (Groq API) for a customized packing list 
in JSON format, and returns the list. It also provides functionality to save trips to a separate Node.js 
MongoDB backend and generate downloadable DOCX files.
"""

# ==========================================
# ### IMPORTS & CONFIGURATION ###
# ==========================================
import os
import json
import time
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from io import BytesIO
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from docx import Document
import re
import requests
from groq import Groq
from pathlib import Path
from datetime import datetime, timedelta
import random
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Resolve base directory to locate the .env file containing API keys
BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"

# Load environment variables from the .env file into the os.environ dictionary
load_dotenv(dotenv_path=ENV_PATH, override=True)

# Retrieve API keys from environment variables
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
WEATHERAPI_API_KEY = os.getenv("WEATHERAPI_API_KEY")

# Ensure the Groq API key is present before starting the app.
if not GROQ_API_KEY:
    raise Exception("GROQ_API_KEY not loaded!")

# Optimize requests globally with a session
http_session = requests.Session()

# ==========================================
# ### APP INITIALIZATION & MIDDLEWARE ###
# ==========================================

# Simple in-memory cache for generated packing lists to prevent AI spam attacks
generation_cache = {}

# Initialize the FastAPI application
app = FastAPI(title="🎒Smart Packing Assistant API")

# Setup rate limiting to prevent abuse. get_remote_address uses the client's IP.
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# Register a custom exception handler to gracefully return an error when limits are exceeded.
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Health-check root endpoint
@app.get("/")
def root():
    """
    Root endpoint to verify the API is running successfully.
    Returns: A simple JSON message indicating live status.
    """
    return {"message": "Smart Packing Assistant API is live ✅"}

# Allow frontend origins defined in .env, falling back to locals for development
frontend_env = os.getenv("FRONTEND_URLS", "http://localhost:3000,https://packmatefrontend.vercel.app")
FRONTEND_URLS = [url.strip() for url in frontend_env.split(",") if url.strip()]

# Add CORS middleware to allow the React frontend to communicate with this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_URLS,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# ==========================================
# ### PYDANTIC DATA MODELS ###
# ==========================================
# These models define the expected shape of the incoming JSON requests.
# FastAPI validates incoming requests automatically based on these definitions.

class TripRequestGenerate(BaseModel):
    """
    Expected input format for generating a packing list or downloading it.
    """
    location: str = Field(..., max_length=150)
    days: int = Field(..., ge=1, le=120)
    trip_type: str = Field(..., max_length=50)
    purpose: str = Field(..., max_length=50)
    activities: str = Field(..., max_length=300)
    stay_type: str = Field(..., max_length=50)
    budget: str = Field(..., max_length=50)
    food: str = Field(..., max_length=100)
    luggage: str = Field(..., max_length=100)
    travel_type: str = Field(..., max_length=100)
    people: str = Field(..., max_length=1000)  # A flat string describing all travelers (e.g. "John, 25 years, Male")
    temperature: Optional[float] = None
    start_date: Optional[str] = Field(None, max_length=20)
    end_date: Optional[str] = Field(None, max_length=20)

class PrefetchWeatherRequest(BaseModel):
    """
    Payload for fetching weather and correcting city names
    """
    location: str = Field(..., max_length=150)


class DownloadRequest(BaseModel):
    """
    Expected input format for downloading a generated packing list.
    """
    packing_list: list

# ==========================================
# ### HELPER FUNCTIONS ###
# ==========================================

def is_section_heading(item: str) -> bool:
    item = item.strip()
    if not item:
        return False
    if item.isupper():
        return True
        
    return False

def create_docx(packing_list: list):
    """
    Creates an in-memory Microsoft Word document (.docx) containing the packing list.
    
    Args:
        packing_list (list): The list of packing items including category headers.
        
    Returns:
        BytesIO: A byte buffer containing the Word document data, ready for streaming.
    """
    buffer = BytesIO()
    doc = Document()
    
    # Add title and current date
    doc.add_heading("🎒 Smart Packing Assistant", level=1)
    
    current_date = datetime.now().strftime("%Y-%m-%d")
    doc.add_paragraph(f"Generated on: {current_date}")
            
    # Add packing list items
    for item in packing_list:
        item_stripped = item.strip()
        if not item_stripped:
            continue
        
        if is_section_heading(item_stripped):
            doc.add_heading(item_stripped, level=2)
        else:
            doc.add_paragraph(item_stripped, style="List Bullet")
        
    doc.save(buffer)
    buffer.seek(0) # Reset buffer position to the start for reading
    return buffer

def get_avg_temperature(location: str):
    """
    Fetches the current average temperature for the provided destination using WeatherAPI API.
    
    Args:
        location (str): The name of the city or destination.
        
    Returns:
        float | None: The temperature in Celsius if successful, or None if the request fails.
    """
    try:
        url = f"https://api.weatherapi.com/v1/current.json?key={WEATHERAPI_API_KEY}&q={location}"
        res = http_session.get(url, timeout=5)
        
        if res.status_code == 200:
            data = res.json()
            if "current" in data:
                return data["current"]["temp_c"]
        else:
            logger.error(f"Weather API /current returned status {res.status_code}")
        return None
    except Exception as e:
        logger.error(f"Weather API error: {e}")
        return None

def get_day_wise_weather(data: dict) -> str:
    location = data.get("location", "").lower().strip()
    start_date_str = data.get("start_date")
    end_date_str = data.get("end_date")
    
    # Improved fallback: Use given temperature or a default value (20-30 C)
    fallback_temp = data.get('temperature')
    if fallback_temp is None:
        fallback_temp = random.randint(20, 30)
        logger.info(f"No temp provided, using random fallback: {fallback_temp}°C")

    if not start_date_str or not end_date_str:
        logger.info(f"Dates missing for {location}, returning uniform temp {fallback_temp}°C")
        return f"Average temperature: {fallback_temp}°C"

    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
        
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        total_days = (end_date - start_date).days + 1
        if total_days <= 0: total_days = 1
        
        date_list = [start_date + timedelta(days=i) for i in range(total_days)]
        
        # 1. Fetch 10-day API forecast
        api_temps = {}
        last_api_temp = fallback_temp
        
        url = f"https://api.weatherapi.com/v1/forecast.json?key={WEATHERAPI_API_KEY}&q={location}&days=10"
        try:
            res = http_session.get(url, timeout=5)
            if res.status_code == 200:
                forecast_data = res.json()
                if "forecast" in forecast_data and "forecastday" in forecast_data["forecast"]:
                    for fday in forecast_data["forecast"]["forecastday"]:
                        dt_key = fday["date"]
                        t = fday["day"]["avgtemp_c"]
                        api_temps[dt_key] = t
                        last_api_temp = t
            else:
                logger.error(f"Weather API /forecast returned status {res.status_code}")
        except Exception as e:
            logger.error(f"Weather API forecast error: {e}")
            
        if not api_temps:
            logger.info("API fetched no valid forecast temps. Falling back to default.")

        forecast_lines = []
        current_temp = last_api_temp

        for dt in date_list:
            dt_str = dt.strftime("%Y-%m-%d")
            # Calculate day_diff inside loop
            day_diff = (dt - today).days

            if dt_str in api_temps and day_diff <= 10:
                current_temp = api_temps[dt_str]
                forecast_lines.append(f"{dt_str} → {current_temp}°C")
            else:
                # Smooth trend-based generation based on last known temp
                if day_diff > 10:
                   # Limit extreme jumps by replacing randint with smaller trend-bounded drifts
                    drift = random.choice([-1, 0, 1])
                    max_variation = 5
                else: 
                    drift = random.choice([-1, 0, 0, 1])
                    max_variation = 3

                new_temp = current_temp + drift

                # Constrain drifting temperatures
                if abs(new_temp - last_api_temp) > max_variation:
                    new_temp = current_temp # Deny the drift if it exceeds variation

                current_temp = new_temp
                forecast_lines.append(f"{dt_str} → {current_temp}°C")
        
        logger.info(f"Generated {len(forecast_lines)} days forecast for {location}")
        return "Day-wise temperature forecast:\n" + "\n".join(forecast_lines)

    except Exception as e:
        logger.error(f"Error generating day wise weather: {e}")
        return f"Average temperature: {fallback_temp}°C"

def generate_packing_data(data: dict):
    """
    The core logic integrating with the Groq Large Language Model.
    Sends environmental and traveler data to generate a complete packing list.
    
    Args:
        data (dict): The dictionary representation of the TripRequestGenerate model.
        
    Returns:
        dict: A parsed JSON response matching the required structure:
            { "packing_list": ["header", "item", ...] }
    """
    # Initialize the Groq client to call the LLM
    client = Groq(api_key=GROQ_API_KEY)

    # Gather dynamic day-wise temperature array
    temp_info = get_day_wise_weather(data)
    
    # Define the system prompt guiding the AI's behavior, establishing rules, and restricting the output format
    system_prompt = """
========================
SMART PACKING ASSISTANT - DETAILED AI-GENERATED PACKING LIST
========================

You are a senior professional travel planner and packing consultant. Your task is to generate a complete, structured, and practical packing list for any traveler or group based entirely on the provided trip and traveler information. 
⚠️ IMPORTANT:
- Always include **all 12 mandatory sections** listed below in the exact order, even if minimal items are needed.
- Quantities, emojis, and items must be **dynamically decided** based on input data.
- Use **standardized emojis per section** consistently.
- Consider **traveler-specific details**: age, gender, medical notes, dietary restrictions, chronic conditions.
- Consider **trip details**: location, climate, temperature, activities, duration, accommodation, budget, luggage style.
- Include optional, backup, and emergency items for all travelers.
- Adjust items for **weather conditions** (cold, hot, rainy, humid) and trip duration.
- Ensure **practicality**: only include items travelers can realistically carry.
- Output **only the packing list in a flat JSON list**, do not include greetings, explanations, or nested arrays.


========================
MANDATORY SECTIONS (ALL CAPS)
========================
1. DOCUMENTS
2. CLOTHING
3. FOOTWEAR
4. TOILETRIES & PERSONAL CARE
5. ELECTRONICS & GADGETS
6. MEDICAL & HEALTH
7. ACCESSORIES
8. FOOD & SNACKS
9. ACTIVITY-SPECIFIC ITEMS
10. MISCELLANEOUS
11. WEATHER-SPECIFIC ITEMS
12. SAFETY & EMERGENCY ITEMS

========================
GENERAL INSTRUCTIONS
========================
- Include **quantities appropriate** for number of days, travelers, and laundry availability.
- Include **all traveler-specific adjustments**: age, gender, medical notes, dietary restrictions.
- Include **weather-appropriate items** based on destination temperature and season.
- Include **electronics and accessories** according to traveler details (phones, laptops, cameras, chargers).
- Include **food, snacks, and hydration** as per traveler type (solo, kids, elders, family).
- Include **backup and emergency items**: extra socks, ch+argers, first-aid, medications.
- For multi-person trips, include items for **each traveler individually**.
- **Do not use placeholders** like "stuff" or "if needed".
- Always use **consistent emojis per section**.
- Output must be a **flat JSON list**, not nested arrays.
- Ensure all items are **practical, ready-to-go, and realistic**.
- **Every section MUST have at least one item.** If no specific activities are provided, add general exploration items (e.g. "Daypack 🎒", "Comfortable walking wear 👕") to ACTIVITY-SPECIFIC ITEMS so it is never empty.

========================
OUTPUT FORMAT
========================
Respond ONLY with **JSON object** in this exact format:

{
  "packing_list": [
    "DOCUMENTS",
    "Passport 📄 (1 per traveler)",
    "Visa 🛂 (if required)",
    "Flight tickets 🎟️",
    "Hotel booking confirmation 🏨",
    "Travel insurance card 🏥",
    ...
    "CLOTHING",
    "T-shirts 👕 (N)",
    "Jeans / Pants 👖 (N)",
    "Shorts 🩳 (N)",
    "Sleepwear 😴 (N)",
    ...
    "FOOTWEAR",
    "Walking shoes 👟",
    "Sandals 🩴",
    ...
    "TOILETRIES & PERSONAL CARE",
    "Toothbrush 🪥",
    "Toothpaste 🪥",
    "Soap / Body wash 🧼",
    ...
    "MEDICAL & HEALTH",
    "First aid kit 🩹",
    "Prescription medication 💊",
    "Fever medication 💊",
    ...
    "ACCESSORIES",
    "Sunglasses 🕶️",
    "Backpack 🎒",
    "Umbrella ☔️",
    ...
    "ELECTRONICS & GADGETS",
    "Smartphone & charger 📱",
    "Laptop & charger 💻",
    "Camera 📷",
    ...
    "FOOD & SNACKS",
    "Non-perishable snacks 🍫",
    "Energy bars 🍿",
    "Reusable water bottle 💧",
    ...
    "ACTIVITY-SPECIFIC ITEMS",
    "Gym clothes 🏋️",
    "Swimwear 🏊",
    "Trekking shoes 🥾",
    ...
    "MISCELLANEOUS",
    "Notebook 📝",
    "Guidebook 📘",
    ...
    "WEATHER-SPECIFIC ITEMS",
    "Thermal wear 🧥 (cold weather)",
    "Sunscreen 🌞 (hot weather)",
    "Raincoat ☔️ (rainy weather)",
    ...
    "SAFETY & EMERGENCY ITEMS",
    "Travel locks 🔒",
    "Power bank 🔋",
    "Flashlight 🔦",
    "Emergency contact info 📇"
  ]
}
- Do not use nested arrays. Use a **flat list**.
- Each **section header is ALL CAPS, max 30 characters, no emojis**.
- Each **item under a section must include emoji** and quantity if relevant.
- Generate **all items dynamically**. Do not use placeholders like "if needed" or "stuff".
"""

    # Populate the dynamic data for the current request
    user_prompt = f"""
Location: {data['location']}
Duration: {data['days']} days
Trip Type: {data['trip_type']}
Purpose: {data['purpose']}
Activities: {data['activities']}
Stay Type: {data['stay_type']}
Budget: {data['budget']}
Food Preference: {data['food']}
Luggage Style: {data['luggage']}
Travel Mode: {data['travel_type']}
Travelers details: {data['people']}


Include all packing items dynamically based on:
- Traveler-specific medical notes, age, gender
- Weather conditions and temperature
- Trip duration, activities, and accommodation
- Budget and luggage style
- Ensure all 12 mandatory sections are included
- Use consistent emojis and realistic quantities

Environmental Context:
{temp_info}. Use this to determine weather-appropriate items.

Generate the JSON packing list now.
"""

    # Make the call to the Groq API model
    # We specify response_format={"type": "json_object"} to strictly enforce a JSON response structure.
    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.4,
        max_completion_tokens=2000,
        response_format={"type": "json_object"}
    )
    
    try:
        content = res.choices[0].message.content
        
        try:
            result = json.loads(content)
        except json.JSONDecodeError as exc:
            logger.error(f"JSON decode error from Groq: {exc}\nRaw Content: {content[:200]}")
            raise HTTPException(status_code=500, detail="Invalid JSON response from AI")
        
        # Ensure packing_list items are clean from stray bullet points or numbering if the AI still added them
        clean_list = []
        for line in result.get("packing_list", []):
            if not isinstance(line, str):
                continue
            # Regex to remove bullets or numbering at the start of a response item
            clean_line = re.sub(r"^[•\-*\d.]+\s*", "", line).strip()
            if clean_line:
                clean_list.append(clean_line)
                
        logger.info(f"Successfully generated packing list containing {len(clean_list)} items")
        return {"packing_list": clean_list}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed processing AI response: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate packing list: {str(e)}")

# ==========================================
# ### API ENDPOINTS ###
# ==========================================

@app.post("/prefetch-weather")
def api_prefetch_weather(req: PrefetchWeatherRequest):
    """
    Endpoint to correct the city name using Groq, then prefetch the temperature.
    """
    client = Groq(api_key=GROQ_API_KEY)
    
    # 1. Correct city with Groq (Fastest model for simple NLP extraction)
    prompt = f"""
You are a strict location corrector.

Task:
Fix the spelling of the given city or country name.

Input:
{req.location}

Rules:
1. Return ONLY the corrected name.
2. Do NOT add any extra words, punctuation, or explanation.
3. Output must be a single valid city or country name.
4. If input is already correct, return it unchanged.
5. If the input is invalid or cannot be corrected, return exactly: INVALID
""" 
    try:
        res = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=20
        )
        raw_response = res.choices[0].message.content.strip()
        
        # Fallback if Groq ignored instructions and wrote a conversational apology
        if len(raw_response.split()) > 4:
            corrected_city = req.location
        else:
            corrected_city = raw_response.strip(".,'\"")
            
    except Exception as e:
        logger.error(f"Groq city correction error: {e}")
        corrected_city = req.location # Fallback to original
        
    # 2. Fetch weather for the corrected city
    temp = get_avg_temperature(corrected_city)
    
    return {"original": req.location, "location": corrected_city, "temperature": temp}


@app.post("/generate-packing-list")
@limiter.limit("5/minute") # Rate limiting endpoint to 5 requests per minute per IP
def api_generate_packing_list(request: Request, trip: TripRequestGenerate):
    """
    Primary API Endpoint to generate an AI-driven packing list.
    
    Expected Body (TripRequestGenerate format): 
      JSON with location, days, trip_type, budget, food, luggage, people, etc.
      
    Returns: 
      JSON response containing:
      {
         "packing_list": ["SECTION", "Item", "Item", ...]
      }
    """
    data = trip.dict()
    
    cache_key = json.dumps(data, sort_keys=True)
    current_time = time.time()
    
    # Check cache first to save AI calls
    if cache_key in generation_cache:
        cached_data, timestamp = generation_cache[cache_key]
        if current_time - timestamp < 300: # 5 minute TTL
            logger.info("Serving generated list from cache.")
            return cached_data
        else:
            del generation_cache[cache_key]

    ai_result = generate_packing_data(data)
    generation_cache[cache_key] = (ai_result, current_time)
    
    return ai_result

@app.post("/download-packing-list")
def api_download_packing_list(req: DownloadRequest):
    """
    Endpoint that packages the provided packing list directly into a downloadable .docx file.
    
    Expected Body: 
      JSON with packing_list.
      
    Returns:
      StreamingResponse serving a Word Document file as an attachment.
    """
    # Create DOCX and stream it back
    doc = create_docx(req.packing_list)
    return StreamingResponse(
        doc,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": "attachment; filename=Smart_Packing_List.docx"}
    )


# ==========================================
# ### APPLICATION ENTRY POINT ###
# ==========================================
if __name__ == "__main__":
    import uvicorn
    # Start the server using Uvicorn. Enables hot-reload during active development.
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5001)), # Changed to 5001 to prevent Node port collision
        reload=True
    )
