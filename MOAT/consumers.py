from channels.generic.websocket import AsyncWebsocketConsumer
import json
import logging
from .models import Worker

logger = logging.getLogger('testlogger')

class DataConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["worker_id"]
        self.room_group_name = self.scope["url_route"]["kwargs"]["experiment_id"]

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
    async def update(self,event):
        logger.info(json.dumps({
            'question': event['question'],
            'nclicks': event['nclicks'],
            'target': event['target'],
            'agents': event['agents'],
            'pos':event['pos'],
            'distances':event['distances'],
            'clicks':event['clicks'],
            'type':event['q_type']
        }))
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'question': event['question'],
            'nclicks': event['nclicks'],
            'target': event['target'],
            'agents': event['agents'],
            'pos':event['pos'],
            'distances':event['distances'],
            'clicks':event['clicks'],
            'type':event['q_type']
        }))