# chat/routing.py
from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/admin/getWorkerData/<slug:experiment_id>/<slug:worker_id>', consumers.DataConsumer),
]