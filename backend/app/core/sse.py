import asyncio
from typing import AsyncGenerator
import json

class SseManager:
    """Quản lý kết nối Server-Sent Events (SSE) để đẩy trạng thái task xuống Frontend"""
    def __init__(self):
        self.listeners: list[asyncio.Queue] = []

    async def add_listener(self) -> asyncio.Queue:
        q = asyncio.Queue()
        self.listeners.append(q)
        return q

    def remove_listener(self, q: asyncio.Queue):
        if q in self.listeners:
            self.listeners.remove(q)

    async def broadcast(self, event_name: str, data: dict):
        """Bắn sự kiện đến tất cả Frontend đang kết nối"""
        message = f"event: {event_name}\ndata: {json.dumps(data)}\n\n"
        for q in self.listeners:
            await q.put(message)

sse_manager = SseManager()
