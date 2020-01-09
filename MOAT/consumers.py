from channels.generic.websocket import AsyncWebsocketConsumer
import json
from .models import Worker
class DataConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = "room"
        self.room_group_name = 'data_%s' % self.room_name

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from room group
    async def update(self):

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': "Hello"
        }))