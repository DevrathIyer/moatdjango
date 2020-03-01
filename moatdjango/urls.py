"""moatdjango URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from MOAT.admin import mysite
from django.contrib import admin
from django.urls import path,include
from MOAT import views

urlpatterns = [
    #path('admin/', CustomAdmin.index, name ="AdminIndex"),
    path('admin/', admin.site.urls),
    path('admin/experiment/<slug:experiment_id>/<slug:worker_id>',mysite.workerExperiment, name="workerExperiment"),
    #path('admin/getWorkerData/<slug:experiment_id>/<slug:worker_id>',mysite.getWorkerData, name="getWorkerData"),
    path('experiments/',include('MOAT.urls')),
    path('data/submit',views.data_submit,name='submit'),
    path('data/get/<slug:experiment_id>',views.data_get,name='get'),
    path('experiment/<slug:experiment_id>/<slug:key>/connect', views.experiment_connect,name='connect')
]
