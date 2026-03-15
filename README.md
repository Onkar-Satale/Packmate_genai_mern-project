# 🌍 PackMate: AI-Powered Travel Assistant

PackMate is a full-stack, AI-driven web application designed to help travelers effortlessly plan trips, manage itineraries, and automatically generate highly optimized packing lists using Generative AI based on their destination's live weather, trip duration, and planned activities.


## ✨ Features

- **🔐 User Authentication:** Secure signup and login using JWT and bcrypt.
- **🗺️ Comprehensive Trip Management:** Store trip details including destination, dates, travel mode, accommodation, budget, travelers, and medical/dietary notes.
- **🤖 GenAI Packing Assistant:** Leverages Groq API (Llama 3) to analyze trip parameters and generate a categorized, intelligent packing list.
- **📄 Export to DOCX:** Instantly download the AI-generated packing list as a formatted Microsoft Word document.
- **📸 Photo Gallery:** Upload and manage memories (photos) for each trip directly to the cloud.
- **📝 Trip Notes:** Add, edit, and safely store personal learnings, journaling, or quick notes for every trip.
- **📱 Responsive UI:** A modern, mobile-friendly interface built with React.

---

## 🏗️ Architecture & Tech Stack

PackMate utilizes a microservices-inspired architecture with three distinct environments working together:

### 1. Frontend (Client)
- **Framework:** React.js
- **Styling:** Custom CSS
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Deployment:** Vercel

### 2. Backend (Main API & Database)
- **Runtime:** Node.js server
- **Framework:** Express.js
- **Database:** MongoDB (Atlas M0 Cluster)
- **ODM:** Mongoose
- **Storage:** Multer (Local/Ephemeral Cloud Storage)
- **Deployment:** Render

### 3. GenAI Microservice (Packing List Engine)
- **Language:** Python 3
- **Framework:** FastAPI
- **AI Integration:** Groq API (Prompt Engineering)
- **Document Generation:** `python-docx`
- **Geolocation API:** OpenCage
- **Deployment:** Render

---

## 🚀 Live Demo

- **Frontend Homepage:** [https://packmatefrontend.vercel.app](https://packmatefrontend.vercel.app)
- **Backend API Base URL:** `https://packmate-backend.onrender.com`
- **GenAI Service API:** `https://packmate69.onrender.com`

*(Note: Free-tier Render services spin down after 15 minutes of inactivity. Initial login or AI generation may take ~30 seconds to wake the server).*

---

## 🛠️ Local Development Setup

To run PackMate locally, you need to spin up all three services.

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MongoDB Atlas Account (or local MongoDB)
- Groq API Key
- OpenCage API Key

### 1. Set up the Node.js Backend
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder:
```ini
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
```
Run the server:
```bash
npm start
```
*(Runs on `http://localhost:5000`)*

### 2. Set up the Python GenAI Service
```bash
cd genai
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```
Create a `.env` file in the `genai` folder:
```ini
GROQ_API_KEY=your_groq_api_key
OPENCAGE_API_KEY=your_opencage_api_key
```
Run the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```
*(Runs on `http://localhost:8000`)*

### 3. Set up the React Frontend
```bash
cd frontend
npm install
```
*(Note: If testing locally, you must temporarily update the Axios Base URLs in the React code to point to `localhost:5000` and `localhost:8000` instead of the live Render URLs.)*
Run the development server:
```bash
npm start
```
*(Runs on `http://localhost:3000`)*

---

## 📂 Project Structure

```text
📦 PackMate
 ┣ 📂 backend          # Node.js + Express + MongoDB User/Trip API
 ┃ ┣ 📂 middleware     # JWT Authentication
 ┃ ┣ 📂 models         # Mongoose Schemas (User, Trip)
 ┃ ┣ 📂 routes         # Auth & Trip API Endpoints
 ┃ ┗ 📜 server.js      # Express Connection & Config
 ┣ 📂 frontend         # React Web App
 ┃ ┣ 📂 public
 ┃ ┣ 📂 src
 ┃ ┃ ┣ 📂 components   # Navbar, Footer
 ┃ ┃ ┣ 📂 pages        # Dashboard, Login, PackingAssistant, UI views
 ┃ ┃ ┗ 📜 App.js       # React Router setup
 ┃ ┗ 📜 vercel.json    # Routing config for Vercel deployment
 ┗ 📂 genai            # Python AI Microservice
   ┣ 📜 main.py        # FastAPI endpoints for LLM & DOCX generation
   ┗ 📜 requirements.txt
```

---

## 🛡️ License
This project is open-source and available under the MIT License.
