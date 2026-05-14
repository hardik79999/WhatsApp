import asyncio
from typing import Dict, Optional, Set
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # user_id (str) → set[WebSocket]
        # Supports multiple tabs/devices per user.
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Lock prevents concurrent dict mutation during connect/broadcast
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, user_id: str) -> bool:
        """
        Register a websocket connection for a user.
        Returns True iff the user became online (first active connection).
        """
        await websocket.accept()
        became_online = False
        async with self._lock:
            existing = self.active_connections.get(user_id)
            if not existing:
                became_online = True
                self.active_connections[user_id] = set()
            self.active_connections[user_id].add(websocket)

        logger.info(
            "User %s connected. Sessions=%s UsersOnline=%s",
            user_id,
            len(self.active_connections.get(user_id, set())),
            len(self.active_connections),
        )

        if became_online:
            await self.broadcast({"type": "online_status", "user_id": user_id, "status": "online"})
        return became_online

    async def disconnect(self, user_id: str, websocket: Optional[WebSocket] = None) -> bool:
        """
        Unregister a websocket connection for a user.
        Returns True iff the user went offline (last active connection closed).
        """
        went_offline = False
        to_close: list[WebSocket] = []

        async with self._lock:
            if websocket is None:
                # Remove all sessions for the user
                conns = self.active_connections.pop(user_id, None)
                if conns:
                    to_close = list(conns)
                    went_offline = True
            else:
                conns = self.active_connections.get(user_id)
                if conns and websocket in conns:
                    conns.remove(websocket)
                if conns is not None and len(conns) == 0:
                    del self.active_connections[user_id]
                    went_offline = True

        for ws in to_close:
            try:
                await ws.close()
            except Exception:
                pass

        logger.info(
            "User %s disconnected. Sessions=%s UsersOnline=%s",
            user_id,
            len(self.active_connections.get(user_id, set())),
            len(self.active_connections),
        )

        if went_offline:
            await self.broadcast({"type": "online_status", "user_id": user_id, "status": "offline"})
        return went_offline

    async def send_personal_message(self, message: dict, user_id: str) -> bool:
        """Send to one specific user. Returns True if delivered."""
        async with self._lock:
            targets = list(self.active_connections.get(user_id, set()))

        if not targets:
            return False

        delivered_any = False
        stale: list[WebSocket] = []

        for ws in targets:
            try:
                await ws.send_json(message)
                delivered_any = True
            except Exception as e:
                logger.error("Error sending to %s: %s", user_id, e)
                stale.append(ws)

        # Clean up stale sockets
        for ws in stale:
            await self.disconnect(user_id, ws)

        return delivered_any

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
            tasks.append(self.send_personal_message(message, uid))
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def broadcast(self, message: dict):
        """
        Send to ALL connected users.
        Only used for online_status events — NOT for chat messages.
        """
        async with self._lock:
            targets = [(user_id, list(sockets)) for user_id, sockets in self.active_connections.items()]

        stale: list[tuple[str, WebSocket]] = []
        for user_id, sockets in targets:
            for ws in sockets:
                try:
                    await ws.send_json(message)
                except Exception as e:
                    logger.error("Broadcast error for %s: %s", user_id, e)
                    stale.append((user_id, ws))

        for user_id, ws in stale:
            await self.disconnect(user_id, ws)

    async def is_online(self, user_id: str) -> bool:
        async with self._lock:
            return bool(self.active_connections.get(user_id))


manager = ConnectionManager()
