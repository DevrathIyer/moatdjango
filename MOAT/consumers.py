from channels.generic.websocket import WebsocketConsumer
import json

class DataConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()

    def disconnect(self, close_code):
        pass

    def receive(self):

        self.send(text_data=json.dumps({
            'message': "Hello"
        }))