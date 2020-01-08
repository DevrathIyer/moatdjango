"""
from django.contrib import admin
from django.shortcuts import render
from django.contrib.auth.models import Group,User
from django.contrib.admin import AdminSite
from django.views.decorators.cache import never_cache

from .models import Experiment, DataPoint, Worker

class CustomAdmin(AdminSite):
    @never_cache
    def index(request, extra_context=None):
        return render(request, 'Admin/Index.html',extra_context)

admin_site = CustomAdmin()
admin_site.register(DataPoint)
admin_site.register(Worker)
#admin_site.unregister(User)
#admin_site.unregister(Group)

admin_site.register(Experiment)
"""