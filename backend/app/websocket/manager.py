import asyncio
from typing import Dict
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # user_id (str) → WebSocket
        self.active_connections: Dict[str, WebSocket] = {}
        # Lock prevents concurrent dict mutation during broadcast
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        async with self._lock:
            # Close any stale connection for the same user (e.g. tab refresh)
            if user_id in self.active_connections:
                try:
                    await self.active_connections[user_id].close()
                except Exception:
                    pass
            self.active_connections[user_id] = websocket
        logger.info(f"User {user_id} connected. Total: {len(self.active_connections)}")
        await self.broadcast({"type": "online_status", "user_id": user_id, "status": "online"})

    async def disconnect(self, user_id: str):
        async with self._lock:
            if user_id in self.active_connections:
                try:
                    await self.active_connections[user_id].close()
                except Exception as e:
                    logger.error(f"Error closing ws for {user_id}: {e}")
                finally:
                    del self.active_connections[user_id]
        logger.info(f"User {user_id} disconnected. Total: {len(self.active_connections)}")
        await self.broadcast({"type": "online_status", "user_id": user_id, "status": "offline"})

    async def send_personal_message(self, message: dict, user_id: str) -> bool:
        """Send to one specific user. Returns True if delivered."""
        ws = self.active_connections.get(user_id)
        if not ws:
            return False
        try:
            await ws.send_json(message)
            return True
        except Exception as e:
            logger.error(f"Error sending to {user_id}: {e}")
            # Remove stale connection without holding the lock (disconnect acquires it)
            await self.disconnect(user_id)
            return False

    async def broadcast_to_chat(
        self,
        message: dict,
        participant_ids: list[str],
        exclude_user_id: str = None,
    ):
        """
        Send to all ONLINE members of a specific chat.
        Uses participant_ids from DB — guarantees no message leaks to
        non-members even if they happen to be connected.
        """
        tasks = []
        for uid in participant_ids:
            if uid == exclude_user_id:
                continue
            if uid in self.active_connections:
                tasks.append(self.send_personal_message(message, uid))
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def broadcast(self, message: dict):
        """
        Send to ALL connected users.
        Only used for online_status events — NOT for chat messages.
        """
        async with self._lock:
            targets = list(self.active_connections.items())

        stale = []
        for user_id, ws in targets:
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Broadcast error for {user_id}: {e}")
                stale.append(user_id)

        for user_id in stale:
            async with self._lock:
                self.active_connections.pop(user_id, None)


manager = ConnectionManager()
