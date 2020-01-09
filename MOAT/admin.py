from django.contrib import admin
from django.contrib.admin import sites
from .models import Experiment, DataPoint, Worker
from django.shortcuts import render
import logging
from django.http import JsonResponse
logger = logging.getLogger('testlogger')

class MyAdminSite(admin.AdminSite):
    site_header = "Visual Attention Lab"

    def workerExperiment(self,request,experiment_id,worker_id):
        return render(request,'Admin/workerExperiment.html')

    def getWorkerData(self,request,experiment_id,worker_id):
        worker = Worker.objects.get(pk=worker_id)
        exp = Experiment.objects.get(pk=experiment_id)

        context = {}
        context['DataPoints'] = DataPoint.objects.get(worker=worker,experiment=exp)

        return JsonResponse(context)

class ExperimentAdmin(admin.ModelAdmin):
    change_view_template = 'Admin/experiment/change_form.html'
    def change_view(self, request, object_id, form_url='', extra_context=None):
        logger.info(object_id)
        exp = Experiment.objects.get(pk=object_id)

        extra_context = extra_context or {}

        extra_context['workers'] = exp.worker_set.all()
        extra_context['object_id'] = object_id

        return super(ExperimentAdmin, self).change_view(request,object_id, form_url='', extra_context=extra_context)
mysite = MyAdminSite()
admin.site = mysite
sites.site = mysite
admin.site.register(Experiment,ExperimentAdmin)
admin.site.register(Worker)