from django.contrib import admin
from django.urls import path,include
from .views import MOA, MOAM, ThreeDMOA

urlpatterns = [
    path('MOA',MOA,name="MOA"),
    path('MOAM',MOAM,name="MOAM"),
    path('3DMOA',ThreeDMOA,name='ThreeDMOA')
]
