from django.contrib import admin
from django.contrib.admin import sites
from .models import Experiment, DataPoint, Worker
from django.shortcuts import render
import logging
from django.http import JsonResponse
import json
logger = logging.getLogger('testlogger')

class MyAdminSite(admin.AdminSite):
    site_header = "Visual Attention Lab"

    def workerExperiment(self,request,experiment_id,worker_id):
        worker = Worker.objects.get(pk=worker_id)
        experiment = Experiment.objects.get(pk=experiment_id)

        points = DataPoint.objects.get(worker=worker,experiment=experiment)

        context = {}
        context["points"] = []
        for point in points:
            mini_context = {}

            mini_context['question'] = point.question
            mini_context['type'] = point.type
            mini_context['target'] = point.target
            mini_context['nclicks'] = point.nclicks
            mini_context['agents'] = json.loads(point.agents)
            mini_context['clicks'] = json.loads(point.clicks)
            mini_context['dists'] = json.loads(point.dists)
            mini_context['pos'] = point.pos

            context['points'].append(mini_context)

        return render(request,'Admin/workerExperiment.html',context)

    def getWorkerData(self,request,experiment_id,worker_id):
        worker = Worker.objects.get(pk=worker_id)
        exp = Experiment.objects.get(pk=experiment_id)

        context = {}
        context['DataPoints'] = DataPoint.objects.get(worker=worker,experiment=exp)

        return JsonResponse(context)

class ExperimentAdmin(admin.ModelAdmin):
    def change_view(self, request, object_id, form_url='', extra_context=None):
        self.change_form_template = 'Admin/MOAT/experiment/change_form.html'
        logger.info(object_id)
        exp = Experiment.objects.get(pk=object_id)

        extra_context = extra_context or {}

        extra_context['workers'] = exp.worker_set.all()
        extra_context['object_id'] = object_id

        return super(ExperimentAdmin, self).change_view(request,object_id, form_url='', extra_context=extra_context)
        #return render(request,'Admin/MOAT/experiment/change_form.html',extra_context)
mysite = MyAdminSite()
admin.site = mysite
sites.site = mysite
admin.site.register(Experiment,ExperimentAdmin)
admin.site.register(Worker)