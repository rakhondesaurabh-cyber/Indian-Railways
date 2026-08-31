# RailOpt AI Engine - Railway Block Planning & Optimization

RailOpt AI Engine is a comprehensive solution designed to optimize railway maintenance schedules while minimizing disruption to train operations. It features a React + TypeScript frontend for real-time visualization and a FastAPI Python backend powered by an AI optimization engine.

## Project Structure

The project is divided into two main components:
- **`frontend/`**: The presentation layer built with React and TypeScript.
- **`backend/`**: The API layer and AI Optimization Engine built with FastAPI and Python.

## Installation and Setup

### Prerequisites
- Node.js (v16 or higher)
- Python (3.8 or higher)
- npm or yarn

### Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI backend server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend API will be available at `http://localhost:8000`.

### Frontend Setup (React)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173` (default Vite port).

## Architecture Overview
For a detailed breakdown of the system architecture, component interactions, and the optimization engine workflow, please refer to the [ARCHITECTURE.md](./ARCHITECTURE.md) file.
