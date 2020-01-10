# chat/routing.py
from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path(r'admin/getWorkerData/<slug:experiment_id>/<slug:worker_id>/', consumers.DataConsumer),
]