🌍 PackMate: AI-Powered Travel Assistant

PackMate is a full-stack, AI-driven travel assistant that helps users plan trips, manage itineraries, and generate intelligent packing lists using real-time weather and Generative AI.

It combines a React frontend, Node.js backend, and a Python FastAPI microservice to deliver a scalable and modular system.

✨ Features
🔐 User Authentication — Secure login/signup using JWT & bcrypt
🗺️ Trip Management — Store destination, dates, budget, travelers, notes
🤖 AI Packing Assistant — Generates smart packing lists using LLM
🌦️ Weather Integration — Uses real-time weather for better recommendations
📄 Export to DOCX — Download packing list as a Word file
📸 Cloud Photo Storage — Upload trip images using Cloudinary
📝 Trip Notes — Personal journaling and notes
✅ Interactive Packing List — Check off items while packing
📱 Responsive UI — Works across devices
🏗️ System Architecture

PackMate follows a microservices-inspired architecture:

🔹 Components
Frontend (React - Vercel)
UI rendering
State management
API communication
Backend API (Node.js - Render)
Authentication (JWT)
Trip CRUD operations
Database interaction (MongoDB)
Image upload handling (Cloudinary)
GenAI Microservice (Python FastAPI - Render)
Weather fetching
Prompt engineering
AI interaction (Groq - Llama 3)
Packing list generation
DOCX export
🔄 System Design Diagram
![System Design](./frontend/src/assets/system-design.png)
🔁 Data Flow (Key Feature: AI Packing List)
User enters trip details
Frontend sends request to FastAPI
FastAPI:
Fetches weather (OpenCage)
Builds prompt
Calls Groq (Llama 3)
AI generates packing list
Response returned to frontend
User can save it → Node backend → MongoDB
🧠 Key Technical Decisions
🔹 Microservices Architecture
Node.js → Fast API handling
Python → AI processing
Improves scalability and separation of concerns
🔹 Cloudinary for Image Storage
Avoids ephemeral storage issues
Stores only image URLs in DB
Production-ready approach
🔹 Rate Limiting
Protects APIs from abuse
Prevents excessive AI requests
🔹 Embedded MongoDB Schema
Faster reads
Single query for full trip data
⚡ Performance & Scalability
⚠️ AI latency due to external API calls
✅ Fallback if weather API fails
🔮 Future improvements:
Redis caching
CDN integration
S3 storage
🔐 Security
JWT-based authentication
Password hashing (bcrypt)
Rate limiting (Node + FastAPI)
Input validation
🚀 Live Demo
Frontend: https://packmatefrontend.vercel.app
Backend: https://packmate-backend.onrender.com
AI Service: https://packmate69.onrender.com

⚠️ Note: Render free tier may take ~30 seconds to wake up

🛠️ Tech Stack
Frontend
React.js
Axios
React Router
Backend
Node.js
Express.js
MongoDB + Mongoose
AI Microservice
Python
FastAPI
Groq (Llama 3)
OpenCage API
python-docx
Deployment
Vercel
Render
🧪 Local Setup
Backend
cd backend
npm install
npm start
GenAI Service
cd genai
python -m venv venv
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
Frontend
cd frontend
npm install
npm start
📂 Project Structure
PackMate/
 ┣ backend/
 ┣ frontend/
 ┣ genai/
🚧 Future Improvements
AWS S3 migration
Real-time collaboration
Redis caching
PDF export
Mobile app
🎯 Key Highlights
Full-stack + AI integration
Microservices architecture
Real-world problem solving
Production-ready improvements
Clean UX + scalable design
🛡️ License

MIT License
