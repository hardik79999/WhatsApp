from typing import Dict
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        logger.info(f"User {user_id} connected. Total connections: {len(self.active_connections)}")
        # Jaise hi user connect ho, sabko batao ki wo Online aa gaya hai
        await self.broadcast({"type": "online_status", "user_id": user_id, "status": "online"})

    async def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            try:
                # Close the websocket connection gracefully
                websocket = self.active_connections[user_id]
                await websocket.close()
            except Exception as e:
                logger.error(f"Error closing websocket for user {user_id}: {e}")
            finally:
                # Always remove from active connections
                del self.active_connections[user_id]
                logger.info(f"User {user_id} disconnected. Total connections: {len(self.active_connections)}")
                # Disconnect hote hi sabko batao ki wo Offline ho gaya
                await self.broadcast({"type": "online_status", "user_id": user_id, "status": "offline"})

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
                # If sending fails, disconnect the user
                await self.disconnect(user_id)

    # Naya function jo saare active users ko ek sath data bhejega
    async def broadcast(self, message: dict):
        # Create a list of users to disconnect if sending fails
        disconnected_users = []
        
        for user_id, connection in self.active_connections.items():
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to user {user_id}: {e}")
                disconnected_users.append(user_id)
        
        # Clean up failed connections
        for user_id in disconnected_users:
            if user_id in self.active_connections:
                del self.active_connections[user_id]

manager = ConnectionManager()