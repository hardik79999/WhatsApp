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
        logger.info(f"User {user_id} connected. Total: {len(self.active_connections)}")
        await self.broadcast({"type": "online_status", "user_id": user_id, "status": "online"})

    async def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].close()
            except Exception as e:
                logger.error(f"Error closing ws for {user_id}: {e}")
            finally:
                del self.active_connections[user_id]
                logger.info(f"User {user_id} disconnected. Total: {len(self.active_connections)}")
                await self.broadcast({"type": "online_status", "user_id": user_id, "status": "offline"})

    async def send_personal_message(self, message: dict, user_id: str):
        """Send to one specific user."""
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending to {user_id}: {e}")
                await self.disconnect(user_id)

    async def broadcast_to_chat(self, message: dict, participant_ids: list[str], exclude_user_id: str = None):
        """
        Send to all ONLINE members of a specific chat.
        This is the correct way to push group messages — not broadcast().
        """
        for uid in participant_ids:
            if uid == exclude_user_id:
                continue
            await self.send_personal_message(message, uid)

    async def broadcast(self, message: dict):
        """Send to ALL connected users (online_status events only)."""
        disconnected = []
        for user_id, connection in self.active_connections.items():
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Broadcast error for {user_id}: {e}")
                disconnected.append(user_id)

        for user_id in disconnected:
            if user_id in self.active_connections:
                del self.active_connections[user_id]


manager = ConnectionManager()