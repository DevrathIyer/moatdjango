from django.contrib import admin
from .models import Experiment, DataPoint, Worker
# Register your models here.
from django.contrib.auth.models import Group,User



admin.site.register(DataPoint)
admin.site.register(Worker)
admin.site.unregister(User)
admin.site.unregister(Group)

class ExperimentAdmin(admin.ModelAdmin):
    fields = ['id']
    #list_display = ('get_workers')

    def get_workers(self, obj):
        return "\n".join([p.workers for p in obj.workers.all()])

admin.site.register(Experiment,ExperimentAdmin)