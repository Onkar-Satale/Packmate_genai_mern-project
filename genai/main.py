import os
from dotenv import load_dotenv  # <-- add this
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
from dotenv import load_dotenv, find_dotenv
from pathlib import Path



BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH, override=True)

# ---------------- ENV ----------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENCAGE_API_KEY = os.getenv("OPENCAGE_API_KEY")  # Use for weather API key

print("GROQ_API_KEY is:", GROQ_API_KEY)
if not GROQ_API_KEY:
    raise Exception("GROQ_API_KEY not loaded!")

# ---------------- FASTAPI APP ----------------
app = FastAPI(title="Smart Packing Assistant API")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/")
def root():
    return {"message": "Smart Packing Assistant API is live ✅"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Pydantic Models ----------------
class TripRequestGenerate(BaseModel):
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
    people: str  # string for packing list

class TripRequestSave(BaseModel):
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
    people: list  # array of objects for MERN save

# ---------------- ICON MAP (optional for React UI) ----------------
ICON_MAP = {
# ---------------- DOCUMENTS ----------------
#     "document": "🧾",
#     "documents": "🧾",
#     "passport": "📄",
#     "visa": "🛂",
#     "id": "💳",
#     "identity": "💳",
#     "license": "🪪",
#     "tickets": "🎟️",
#     "boarding": "✈️",
#     "insurance": "📑",
#     "hotel": "🏨",
#     "reservation": "📆",

#     # ---------------- CLOTHING ----------------
#     "clothing": "👕",
#     "shirt": "👕",
#     "t-shirt": "👕",
#     "top": "👕",
#     "pants": "👖",
#     "trousers": "👖",
#     "jeans": "👖",
#     "shorts": "🩳",
#     "jacket": "🧥",
#     "coat": "🧥",
#     "sweater": "🧶",
#     "hoodie": "🧥",
#     "dress": "👗",
#     "skirt": "👗",
#     "sleepwear": "😴",
#     "pajamas": "😴",
#     "underwear": "🩲",
#     "undergarments": "🩲",
#     "socks": "🧦",
#     "scarf": "🧣",
#     "cap": "🧢",
#     "hat": "👒",
#     "belt": "🧷",

#     # ---------------- FOOTWEAR ----------------
#     "shoes": "👟",
#     "footwear": "👟",
#     "sneakers": "👟",
#     "sandals": "🩴",
#     "slippers": "🩴",
#     "boots": "🥾",
#     "flip flops": "🩴",

#     # ---------------- TOILETRIES ----------------
#     "toiletry": "🧴",
#     "toiletries": "🧴",
#     "toothbrush": "🪥",
#     "toothpaste": "🪥",
#     "shampoo": "🧴",
#     "conditioner": "🧴",
#     "soap": "🧼",
#     "body wash": "🧼",
#     "face wash": "🧴",
#     "razor": "🪒",
#     "shaving": "🪒",
#     "deodorant": "🧴",
#     "perfume": "🌸",
#     "sunscreen": "🌞",
#     "moisturizer": "🧴",
#     "lip balm": "💄",
#     "towel": "🧻",
#     "tissues": "🧻",
#     "wet wipes": "🧻",

#     # ---------------- ELECTRONICS ----------------
#     "electronics": "📱",
#     "phone": "📱",
#     "mobile": "📱",
#     "laptop": "💻",
#     "tablet": "📱",
#     "camera": "📷",
#     "charger": "🔌",
#     "charging": "🔌",
#     "power bank": "🔋",
#     "headphones": "🎧",
#     "earphones": "🎧",
#     "adapter": "🔌",
#     "extension": "🔌",

#     # ---------------- MEDICAL ----------------
#     "medicine": "💊",
#     "medication": "💊",
#     "medicines": "💊",
#     "first aid": "🩹",
#     "bandage": "🩹",
#     "painkiller": "💊",
#     "prescription": "📄",
#     "sanitizer": "🧴",
#     "mask": "😷",
#     "thermometer": "🌡️",

#     # ---------------- ACCESSORIES ----------------
#     "wallet": "👛",
#     "money": "💵",
#     "cash": "💵",
#     "credit card": "💳",
#     "sunglasses": "🕶️",
#     "watch": "⌚",
#     "jewelry": "💍",
#     "ring": "💍",
#     "necklace": "📿",
#     "earrings": "💍",
#     "key": "🔑",
#     "lock": "🔒",
#     "umbrella": "☂️",

#     # ---------------- FOOD ----------------
#     "snacks": "🍫",
#     "food": "🍱",
#     "biscuits": "🍪",
#     "chips": "🍟",
#     "dry fruits": "🥜",
#     "water bottle": "🚰",
#     "bottle": "🚰",

#     # ---------------- ACTIVITY ----------------
#     "swim": "🏊",
#     "swimming": "🏊",
#     "beach": "🏖️",
#     "trek": "🥾",
#     "hiking": "🥾",
#     "gym": "🏋️",
#     "workout": "🏋️",
#     "yoga": "🧘",
#     "business": "💼",
#     "formal": "👔",
#     "meeting": "💼",

#     # ---------------- BAGS ----------------
#     "bag": "🎒",
#     "backpack": "🎒",
#     "suitcase": "🧳",
#     "luggage": "🧳",
#     "handbag": "👜",
#     "pouch": "👝",

#     # ---------------- MISC ----------------
#     "book": "📘",
#     "notebook": "📓",
#     "pen": "🖊️",
#     "map": "🗺️",
#     "guide": "📘",
#     "sleep": "😴",
#     "ear plugs": "😴"
}

def get_icon(text: str) -> str:
    text = text.lower()
    for key, icon in ICON_MAP.items():
        if key in text:
            return icon
    return "🎒"

# ---------------- UTILS ----------------
def extract_items(text: str):
    lines = text.split("\n")
    clean = []
    for line in lines:
        line = re.sub(r"^[•\-*\d.]+", "", line).strip()
        if line:
            clean.append(line)
    return clean

def create_docx(summary: str, packing_list: list):
    """Create DOCX including emojis (do NOT strip them)"""
    buffer = BytesIO()
    doc = Document()
    doc.add_heading("🎒 Smart Packing Assistant", level=1)
    for line in summary.split("\n"):
        if line.strip():
            doc.add_paragraph(line)
    doc.add_heading("Packing List", level=2)
    for item in packing_list:
        doc.add_paragraph(item, style="List Bullet")
    doc.save(buffer)
    buffer.seek(0)
    return buffer

# ---------------- WEATHER ----------------
def get_avg_temperature(location: str):
    """
    Returns the current temperature (Celsius) for the destination.
    Can be replaced with a multi-day forecast if needed.
    """
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather?q={location}&units=metric&appid={OPENCAGE_API_KEY}"
        res = requests.get(url, timeout=5)
        data = res.json()
        if res.status_code == 200 and "main" in data:
            temp = data["main"]["temp"]
            return temp
        else:
            return None
    except Exception as e:
        print("Weather API error:", e)
        return None

# ---------------- POST-PROCESSING ----------------
def add_medical_items(packing_list: list, people_str: str):
    """Add medical items based on traveler info"""
    for line in people_str.split("\n"):
        if "fever" in line.lower():
            if "Fever medication 💊" not in packing_list:
                packing_list.append("Fever medication 💊")
        if "allergy" in line.lower():
            if "Antihistamines 💊" not in packing_list:
                packing_list.append("Antihistamines 💊")
    return packing_list

def add_weather_items(packing_list: list, temp: float):
    """Include items based on temperature"""
    if temp is None:
        return packing_list
    if temp <= 10:  # cold
        for item in ["Jacket 🧥", "Warm socks 🧦", "Gloves 🧤"]:
            if item not in packing_list:
                packing_list.append(item)
    elif temp >= 30:  # hot
        for item in ["Sunscreen 🌞", "Hat 🧢", "Sunglasses 🕶️"]:
            if item not in packing_list:
                packing_list.append(item)
    return packing_list

# ---------------- AI ENGINE ----------------
def generate_packing_list(data: dict):
    
    client = Groq(api_key=GROQ_API_KEY)

    # Get temperature
    temp = get_avg_temperature(data['location'])
    temp_info = f"Average temperature: {temp}°C" if temp is not None else "Temperature unknown"

    system_prompt = """
========================
SMART PACKING ASSISTANT - DETAILED PACKING LIST
========================

You are a **senior professional travel planner and packing consultant**. 
Your task is to generate a **full, practical, and detailed packing list** for any traveler or group, 
based on their trip information, preferences, health, and destination conditions.

⚠️ IMPORTANT: Always generate a **complete packing list** covering all relevant items. 
All sections listed must appear in the output, even if only minimal items are needed.

========================
MANDATORY SECTIONS
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
10. MISCELLANEOUS / OTHER ESSENTIALS
11. WEATHER-SPECIFIC ITEMS
12. SAFETY & EMERGENCY ITEMS

========================
GENERAL INSTRUCTIONS
========================
- Generate a **full, exhaustive, and practical packing list**.
- Include optional, backup, and emergency items (extra socks, chargers, first-aid, medications).
- Tailor **quantities and variety** based on total days, number of travelers, and laundry availability.
- Include **all traveler-specific adjustments**: age, gender, medical conditions, preferences.
- Use **weather and destination info** to adjust clothing, footwear, accessories, and emergency items.
- Consider **trip type** (solo, family, business, adventure, honeymoon) for safety and special items.
- Include activity-specific items for workouts, beach, trekking, photography, work, or shopping.
- Include electronics and gadgets according to traveler info (phones, laptops, cameras, chargers).
- Include food, snacks, and hydration items (especially for families, kids, or long trips).
- Avoid vague words like "stuff" or "things" and brand names.
- Always ensure the list is **practical, realistic, and ready-to-go**.
- Use **emojis** for better readability.

========================
OBSERVE THESE FIELDS
========================
Trip Basics:
- Destination (climate, temperature, culture)
- Start Date / End Date / Total Days (adjust clothing quantities)
- Trip Type (Solo, Family, Business, Adventure, Honeymoon)
- Travel Mode (Flight, Train, Bus, Car)
- Accommodation Type (Hotel, Hostel, Resort, Homestay, Private Room)
- Room Type and Laundry availability
- Budget Level (affects optional gadgets and accessories)
- Lifestyle & Comfort Preferences (Weather Sensitivity, Activity Level)
- Shopping Plan (include shopping-related items)
- Photography / Video Gear (add accessories)
- Work Laptop / Devices (include electronics)

Food & Health:
- Food Preference (Vegetarian, Vegan, Non-Veg)
- Dietary Notes (Allergies, restrictions)
- Medical Notes (Chronic conditions, medications, special requirements)
- Emergency medications (fever, antihistamines, painkillers, first-aid)

Travelers Information:
- Number of Kids / Elders
- Each Traveler: Name, Age, Gender, Medical Notes

Environmental Info:
- Use temperature, season, and weather of destination to add clothing, footwear, and accessories.
- Include cold-weather items (jackets, gloves, scarves, thermal wear) if destination is cold.
- Include hot-weather items (hats, sunscreen, light clothing) if destination is hot.

Traveler- and Duration-Aware Adjustments:
- Adjust item quantities based on TOTAL DAYS (e.g., 7 T-shirts for 7 days without laundry, fewer if laundry available).
- Include items for each traveler according to age and medical needs.
- Solo travelers: provide minimal but complete essentials.
- Multi-person/family trips: include full list for all travelers.
- Emergency items based on traveler medical info or potential weather risks.

========================
OUTPUT FORMAT
========================
- Divide output into **ALL CAPS sections** as listed above.
- Each item **one bullet per line**.
- Include **emojis** for visual clarity.
- Quantities should be included implicitly where relevant.
- Include optional and backup items.
- Include items for each traveler if multi-person/family trip.
- Include weather-appropriate items (jackets, sunscreen, raincoat, gloves, etc.).
- Include safety and emergency items: first-aid kit, medications, power bank, travel locks, etc.
- Only include **relevant sections**. If a section is optional, keep it minimal but present.
- Do NOT include greetings, instructions, or summaries. Only the packing list.

========================
EXAMPLE OUTPUT
========================

DOCUMENTS
Passport 📄
Visa 🛂
Government ID 💳
Flight tickets 🎟️
Hotel booking confirmation 🏨
Travel insurance card 🏥
ID proofs for all travelers 📝

CLOTHING
T-shirts 👕 (quantity based on days)
Jeans / Pants 👖
Shorts 🩳
Jacket 🧥 (weather-dependent)
Sleepwear 😴
Undergarments 🩲
Socks 🧦
Hat 🧢 / Gloves 🧤 / Scarf 🧣 (weather-dependent)
Raincoat / Umbrella ☔️ (if needed)
Thermal wear 🧥 (cold destinations)
Warm socks 🧦

FOOTWEAR
Comfortable walking shoes 👟
Sandals 🩴
Slippers 🛋️
Boots 🥾 (cold / hiking)

TOILETRIES & PERSONAL CARE
Toothbrush 🪥
Toothpaste 🪥
Soap / Body wash 🧼
Shampoo & Conditioner 🧴
Deodorant 🧴
Razor 🪒
Lip balm 💄 (cold weather)
Moisturizer 🧴 (cold weather)
Towel 🧻
Sunscreen 🌞 (hot weather)

ELECTRONICS & GADGETS
Smartphone & charger 📱
Laptop & charger 💻
Power bank 🔋
Camera & accessories 📷
Headphones 🎧
Travel adapter 🔌

MEDICAL & HEALTH
First aid kit 🩹
Prescription medication 💊
Fever medication 💊
Cold medication 💊
Pain relievers 🤕
Antihistamines 💊
Water bottle 💧
Thermometer 🌡️

ACCESSORIES
Sunglasses 🕶️
Backpack / Daypack 🎒
Travel wallet 💵
Watch ⌚
Umbrella ☔️
Earplugs & eye mask 😴
Hat 🧢

FOOD & SNACKS
Non-perishable snacks 🍫
Energy bars 🍿
Reusable water bottle 💧
Baby food / formula if applicable 🍼

ACTIVITY-SPECIFIC ITEMS
Gym clothes 🏋️
Swimwear 🏊
Hiking shoes 🥾
Camera gear 📷
Travel journal 📝

MISCELLANEOUS / OTHER ESSENTIALS
Notebook 📝
Pen 🖊️
Guidebook 📘
Map 🗺️
Laundry bag 🧺

WEATHER-SPECIFIC ITEMS
Cold-weather: thermal wear 🧥, gloves 🧤, hat 🧢
Hot-weather: sunscreen 🌞, hat 🧢, light clothing 🩳
Rainy: umbrella ☔️, waterproof jacket 🧥

SAFETY & EMERGENCY ITEMS
First-aid kit 🩹
Travel locks 🔒
Power bank 🔋
Emergency contact info 📇
Flashlight 🔦

========================
IMPORTANT
========================
- Always tailor to travelers’ medical info, temperature, number of days, and activities.
- Include items for each traveler if multi-person/family trip.
- Ensure practicality: travelers can realistically carry and use all items.
- Provide **only the packing list** in the above structured format with emojis.

"""

    user_prompt = f"""
Location: {data['location']}
Duration: {data['days']} days
Trip Type: {data['trip_type']}
Purpose: {data['purpose']}
Activities: {data['activities']}
Stay Type: {data['stay_type']}
Budget: {data['budget']}
Food: {data['food']}
Luggage: {data['luggage']}
Travel Type: {data['travel_type']}
Travelers: {data['people']}

{temp_info}

Include items based on temperature and travelers' medical info.
"""

    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.4,
        max_completion_tokens=500
    )

    packing_list = extract_items(res.choices[0].message.content)
    packing_list = add_medical_items(packing_list, data['people'])
    packing_list = add_weather_items(packing_list, temp)

    return packing_list

# ---------------- ENDPOINTS ----------------
@app.post("/generate-packing-list")
@limiter.limit("5/minute")
def api_generate_packing_list(request: Request, trip: TripRequestGenerate):
    data = trip.dict()
    packing_list = generate_packing_list(data)
    summary = f"Location: {data['location']}\nDuration: {data['days']} days\nTrip Type: {data['trip_type']}"
    return {"summary": summary, "packing_list": packing_list}

@app.post("/download-packing-list")
def api_download_packing_list(trip: TripRequestGenerate):
    data = trip.dict()
    packing_list = generate_packing_list(data)
    summary = f"Location: {data['location']}\nDuration: {data['days']} days\nTrip Type: {data['trip_type']}"
    doc = create_docx(summary, packing_list)
    return StreamingResponse(
        doc,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": "attachment; filename=Smart_Packing_List.docx"}
    )

@app.post("/save-trip")
def api_save_trip(trip: TripRequestSave):
    trip_data = trip.dict()
    MERN_API_URL = os.environ.get("MERN_API_URL", "http://localhost:5000/api/trips")
    try:
        response = requests.post(MERN_API_URL, json=trip_data, timeout=10)
        if response.status_code in (200, 201):
            return {"message": "Trip saved to MERN backend!", "mern_response": response.json()}
        else:
            raise HTTPException(status_code=500, detail=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",  # your filename without .py : app instance
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        reload=True
    )