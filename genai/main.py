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
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
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
from datetime import datetime

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

# ==========================================
# ### APP INITIALIZATION & MIDDLEWARE ###
# ==========================================

# Initialize the FastAPI application
app = FastAPI(title="Smart Packing Assistant API")

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

# Add CORS middleware to allow the React frontend to communicate with this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, change this in production for security.
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
    location: str
    days: int
    trip_type: str
    purpose: str
    activities: str
    stay_type: str
    budget: str
    food: str
    luggage: str
    travel_type: str
    people: str  # A flat string describing all travelers (e.g. "John, 25 years, Male")


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
    
    # If the item ends with an emoji or non-ascii char
    if not item[-1].isascii():
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
    doc.add_heading("Smart Packing Assistant", level=1)
    
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
    Fetches the current average temperature for the provided destination using OpenWeather API.
    
    Args:
        location (str): The name of the city or destination.
        
    Returns:
        float | None: The temperature in Celsius if successful, or None if the request fails.
    """
    try:
        url = f"https://api.weatherapi.com/v1/current.json?key={WEATHERAPI_API_KEY}&q={location}"
        res = requests.get(url, timeout=5)
        data = res.json()
        
        # Check if request succeeded and "main" block (which contains temp) is returned
        if res.status_code == 200 and "current" in data:
            temp = data["current"]["temp_c"]
            return temp
        else:
            return None
    except Exception as e:
        print("Weather API error:", e)
        return None

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

    # Gather temperature to provide environmental context to the AI
    temp = get_avg_temperature(data['location'])
    temp_info = f"Average temperature: {temp}°C" if temp is not None else "Temperature unknown"

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
- Include **backup and emergency items**: extra socks, chargers, first-aid, medications.
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
        result = json.loads(content)
        
        # Ensure packing_list items are clean from stray bullet points or numbering if the AI still added them
        clean_list = []
        for line in result.get("packing_list", []):
            if not isinstance(line, str):
                continue
            # Regex to remove bullets or numbering at the start of a response item
            clean_line = re.sub(r"^[•\-*\d.]+\s*", "", line).strip()
            if clean_line:
                clean_list.append(clean_line)
                
        return {"packing_list": clean_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate packing list: {str(e)}")

# ==========================================
# ### API ENDPOINTS ###
# ==========================================

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
    ai_result = generate_packing_data(data)
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
        port=int(os.environ.get("PORT", 5000)),
        reload=True
    )

