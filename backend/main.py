from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict
import asyncio
import json

from database import engine, Base, get_db
from models import Room

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Connection Manager ---
class ConnectionManager:
    def __init__(self):
        # roomId -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # roomId -> current_code (In-memory state)
        self.room_code: Dict[str, str] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
            self.room_code[room_id] = "" # Initialize empty code
        self.active_connections[room_id].append(websocket)
        
        # Send current code to the new user
        await websocket.send_text(json.dumps({"type": "init", "code": self.room_code[room_id]}))

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
                # Optional: Clean up code memory if room is empty? 
                # For now, keep it so if they reconnect it's there.
                # But if we want to save memory: del self.room_code[room_id]

    async def broadcast(self, message: str, room_id: str, sender: WebSocket):
        # Update in-memory state
        try:
            data = json.loads(message)
            if data.get("type") == "code_update":
                self.room_code[room_id] = data.get("code", "")
        except:
            pass

        # Broadcast to others
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                if connection != sender:
                    try:
                        await connection.send_text(message)
                    except RuntimeError:
                        # Connection might be closed
                        pass
                    except Exception as e:
                        print(f"Error broadcasting: {e}")

manager = ConnectionManager()

# --- Schemas ---
class RoomCreate(BaseModel):
    pass

class RoomResponse(BaseModel):
    roomId: str

class AutocompleteRequest(BaseModel):
    code: str
    cursorPosition: int
    language: str

# --- Routes ---

@app.post("/rooms", response_model=RoomResponse)
def create_room(db: Session = Depends(get_db)):
    room = Room()
    db.add(room)
    db.commit()
    db.refresh(room)
    return {"roomId": room.id}

@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, db: Session = Depends(get_db)):
    # Validate room exists
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        await websocket.close()
        return

    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(data, room_id, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)

@app.post("/autocomplete")
async def autocomplete(request: AutocompleteRequest):
    # Mock AI Logic
    # If user types "def", return "def my_function(): pass"
    # We'll look at the word before the cursor or just simple substring check for prototype
    
    # Simple rule: if the code ends with "def" (ignoring whitespace) or "def "
    # But the prompt says: "if the user types 'def', return 'def my_function(): pass'"
    
    # Let's try to be a bit smart.
    # We'll check the text immediately preceding the cursor.
    
    code = request.code
    cursor = request.cursorPosition
    
    # Get text before cursor
    text_before = code[:cursor]
    
    suggestion = None
    
    if text_before.strip().endswith("def"):
        suggestion = " my_function():\n    pass"
    elif text_before.strip().endswith("class"):
        suggestion = " MyClass:\n    def __init__(self):\n        pass"
    elif text_before.strip().endswith("import"):
        suggestion = " os"
    elif text_before.strip().endswith("print"):
        suggestion = "('Hello World')"
    elif text_before.strip().endswith("if"):
        suggestion = " __name__ == \"__main__\":\n    pass"
    elif text_before.strip().endswith("for"):
        suggestion = " i in range(10):\n    print(i)"
    elif text_before.strip().endswith("try"):
        suggestion = ":\n    pass\nexcept Exception as e:\n    print(e)"
    elif text_before.strip().endswith("return"):
        suggestion = " True"
        
    if suggestion:
        return {"suggestion": suggestion}
    
    return {"suggestion": None}
