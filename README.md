# LeetCode AI Enhancer

A Chrome extension and backend service that brings AI-powered hints, explanations, and chat to your LeetCode workflow.

## Features
- **AI Hints:** Get progressive, context-aware hints for any LeetCode problem.
- **AI Chat:** Ask questions about the problem, your code, or general concepts—get answers in natural language.
- **Markdown & Code Rendering:** AI responses are formatted for readability, including code blocks.
- **Per-Problem Persistence:** Hints and chat history are saved per problem for seamless revisiting.
- **Modern UI:** Glassmorphism, dropdowns, and a clean, responsive popup interface.
- **Backend API:** FastAPI server with LangChain, Gemini, and Groq model support, robust error handling, and prompt engineering.

## Tech Stack
- **Frontend:** React, Vite, Chrome Extension APIs, react-markdown
- **Backend:** FastAPI, LangChain, Gemini, Groq, Pydantic
- **Containerization:** Docker

## Getting Started

### Prerequisites
- Node.js (for frontend)
- Python 3.12+ (for backend)
- Docker (optional, for containerized backend)

### 1. Clone the Repository
```sh
git clone https://github.com/harshil3134/leetcode-ai-enhancer.git
cd leetcode-ai-enhancer
```

### 2. Backend Setup
#### a. Local (Python)
```sh
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd app
uvicorn main:app --reload
```
- Configure your `.env` file in `backend/app/.env` for API keys (Gemini, Groq, etc).

#### b. Docker
```sh
docker build -f Dockerfile.backend -t leetcode-backend .
docker run -p 8000:8000 --env-file backend/app/.env leetcode-backend
```

### 3. Frontend Setup
```sh
cd frontend
npm install
npm run build
```
- Load the `frontend/dist` folder as an unpacked extension in Chrome.
- Set your backend API URL in `.env` as `VITE_API_URL`.

## Usage
- Open a LeetCode problem.
- Click the extension icon to open the popup.
- Get hints, chat with the AI, and ask for explanations.
- Your chat and hints are saved per problem.

## Development
- Frontend: Edit files in `frontend/src` and use `npm run dev` for hot reload.
- Backend: Edit files in `backend/app` and use `uvicorn main:app --reload`.

---
**Made with ❤️ by harshil3134**
