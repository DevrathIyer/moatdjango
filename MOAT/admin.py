from django.contrib import admin
from .models import Experiment, DataPoint, Worker
# Register your models here.


admin.site.register(Experiment)
admin.site.register(DataPoint)
admin.site.register(Worker)

class ExperimentAdmin(admin.ModelAdmin):
    fields = ['id', 'workers']
    list_display = ('get_workers', 'vendor')

    def get_workers(self, obj):
        return "\n".join([p.workers for p in obj.workers.all()])