from django.contrib import admin
from django.urls import path,include
from .views import MOA, MOAM
from .admin import CustomAdmin

urlpatterns = [
    path('MOA',MOA,name="MOA"),
    path('MOAM',MOAM,name="MOAM"),
]
