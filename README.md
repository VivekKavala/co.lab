# Co.Lab - Real-Time Pair Programming Environment

Co.Lab is a collaborative code editor that allows two or more users to edit code in real-time in the same "room". It features a VS Code-like interface with mock AI autocomplete.

## 🌐 Live Demo
- **App:** [https://colab.iamvivek.cloud/](https://colab.iamvivek.cloud/)
- **API:** [https://api-colab.iamvivek.cloud/](https://api-colab.iamvivek.cloud/)

## 🚀 How to Run

### Prerequisites
- Docker & Docker Compose
- Node.js (v16+) & npm

### 1. Start Backend & Database
The backend (FastAPI) and Database (PostgreSQL) are containerized.

```bash
# From the project root
docker-compose up --build
```
*   **Backend API:** http://localhost:8000
*   **API Docs:** http://localhost:8000/docs
*   **Database:** Port 5433 (mapped to host to avoid conflicts)

### 2. Start Frontend
The frontend is a React application.

```bash
cd frontend
npm install
npm run dev
```
*   **App URL:** http://localhost:5173

---

## 🏗️ Architecture & Design Choices

### Tech Stack
*   **Backend:** Python (FastAPI) - Chosen for high performance and easy WebSocket support.
*   **Database:** PostgreSQL - Robust relational database for storing room metadata.
*   **Frontend:** React + TypeScript - Modern, type-safe UI library.
*   **State Management:** Redux Toolkit - Predictable state container for managing room connection status and code.
*   **Editor:** Monaco Editor - The power of VS Code in the browser.

### Key Design Decisions

#### 1. Real-Time Sync Strategy: Last-Write-Wins (LWW)
For this prototype, we used a simple broadcasting approach. When a user types, the full code (or change) is sent to the server, which updates its in-memory state and broadcasts it to all other clients in the room.
*   **Pros:** Simple to implement, low latency for small files.
*   **Cons:** Race conditions can occur if two users type exactly at the same time (one will overwrite the other).

#### 2. In-Memory Code State
The current code content for a room is stored in a Python dictionary in the backend memory.
*   **Reason:** Extremely fast read/write access for real-time syncing.
*   **Trade-off:** If the server restarts, the code in active rooms is lost (Room IDs persist in DB).

#### 3. Mock AI Autocomplete (Ghost Text)
We implemented a "Ghost Text" experience similar to GitHub Copilot using Monaco's `InlineCompletionsProvider`.
*   **Logic:** If you type `def`, the system waits 600ms (debounce) and suggests `my_function(): pass`.
*   **UX:** Press `Tab` to accept the suggestion.

---

## 🔮 Future Improvements

With more time, here is how I would elevate this project:

1.  **Conflict Resolution (OT/CRDTs):** Implement Operational Transformation or CRDTs (e.g., Yjs) to handle concurrent edits gracefully without overwriting work.
2.  **Code Persistence:** Periodically save the code to the database (Redis or Postgres) so work isn't lost on server restart.
3.  **Authentication:** Add User Auth (OAuth/JWT) so users can have persistent identities and private rooms.
4.  **Real AI Integration:** Connect the `/autocomplete` endpoint to an LLM (like Gemini or OpenAI) for intelligent code suggestions.
5.  **Multiple File Support:** Allow a file tree structure for multi-file projects.
6.  **Production Infrastructure:** Add Nginx as a reverse proxy and set up CI/CD pipelines.

---

## ⚠️ Limitations

*   **Data Loss:** Code is currently ephemeral (in-memory only).
*   **Concurrency:** Heavy concurrent editing on the same line may cause cursor jumps or overwritten characters due to the LWW strategy.
*   **Security:** Rooms are public to anyone who has the UUID.
