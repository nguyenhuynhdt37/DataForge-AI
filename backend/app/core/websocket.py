import json
import asyncio
from typing import Dict, List
from fastapi import WebSocket
from loguru import logger
from app.core.database import redis_client

class ConnectionManager:
    def __init__(self):
        # Lưu các kết nối WS cục bộ trên server này: { "user_id": [WebSocket1, WebSocket2] }
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Task lắng nghe pubsub cho mỗi user
        self.pubsub_tasks: Dict[str, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
            # Khởi tạo một Redis Pub/Sub channel cho User này
            self.pubsub_tasks[user_id] = asyncio.create_task(self.listen_to_redis(user_id))
        self.active_connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected to WS. Total connections for user: {len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if len(self.active_connections[user_id]) == 0:
                del self.active_connections[user_id]
                # Hủy task pubsub nếu không còn thiết bị nào
                if user_id in self.pubsub_tasks:
                    self.pubsub_tasks[user_id].cancel()
                    del self.pubsub_tasks[user_id]

    async def listen_to_redis(self, user_id: str):
        """Lắng nghe sự kiện từ Redis Pub/Sub cho một User cụ thể"""
        channel_name = f"user_events:{user_id}"
        pubsub = redis_client.pubsub()
        await pubsub.subscribe(channel_name)
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    logger.info(f"Received pubsub msg on {channel_name}: {data}")
                    # Phát Broadcast tới tất cả WebSocket cục bộ của user này
                    await self.send_to_user_local(user_id, data)
        except asyncio.CancelledError:
            await pubsub.unsubscribe(channel_name)
        except Exception as e:
            logger.error(f"Error in pubsub listener for {user_id}: {str(e)}")

    async def send_to_user_local(self, user_id: str, message: dict):
        """Gửi message tới tất cả các connection của user trên server node này"""
        if user_id in self.active_connections:
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_json(message)
                    # Nếu là sự kiện kickout, đóng socket luôn
                    if message.get("event") == "SESSION_KICKED":
                        await ws.close(code=1008)
                except Exception as e:
                    logger.error(f"Failed to send WS message to {user_id}: {e}")

    async def broadcast_kickout_across_cluster(self, user_id: str, new_session_id: str):
        """Hàm dùng ở Router Login: Bắn tín hiệu vào Redis để đá mọi thiết bị cũ"""
        channel_name = f"user_events:{user_id}"
        message = {
            "event": "SESSION_KICKED",
            "reason": "Tài khoản của bạn vừa đăng nhập ở một thiết bị khác.",
            "exclude_session_id": new_session_id
        }
        await redis_client.publish(channel_name, json.dumps(message))

ws_manager = ConnectionManager()
