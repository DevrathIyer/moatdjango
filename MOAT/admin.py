from django.contrib import admin
from .models import Experiment, DataPoint, Worker
# Register your models here.


admin.site.register(Experiment)
admin.site.register(DataPoint)
admin.site.register(Worker)
