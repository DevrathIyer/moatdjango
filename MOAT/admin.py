from django.contrib import admin
from django.contrib.admin import sites
from .models import Experiment, DataPoint, Worker
from django.shortcuts import render
import logging
from django.http import JsonResponse
import json
from django.db import close_old_connections
from django.utils.crypto import get_random_string

logger = logging.getLogger('testlogger')

class MyAdminSite(admin.AdminSite):
    site_header = "Visual Attention Lab"

    def workerExperiment(self,request,experiment_id,worker_id):
        close_old_connections()
        worker = Worker.objects.get(pk=worker_id)
        experiment = Experiment.objects.get(pk=experiment_id)

        context = {}
        points = DataPoint.objects.filter(worker=worker,experiment=experiment,isTestPoint = False).order_by('question')
        context['points'] = points
        context['worker'] = worker_id
        context["questions"] = []
        context["types"] = []
        context["targets"] = []
        context['nclicks'] = []
        context['agents'] = []
        context['clicks'] = []
        context['dists'] = []
        context['pos'] = []
        for point in points:
            context['questions'].append(point.question)
            context['types'].append(point.type)
            context['targets'].append(point.target)
            context['nclicks'].append(point.nclicks)
            context['agents'].append(json.loads(point.agents))
            context['clicks'].append(json.loads(point.clicks))
            context['dists'].append(point.dists.split(','))
            context['pos'].append(point.pos)
        close_old_connections()
        return render(request,'Admin/workerExperiment.html',context)

    def getWorkerData(self,request,experiment_id,worker_id):
        close_old_connections()
        worker = Worker.objects.get(pk=worker_id)
        exp = Experiment.objects.get(pk=experiment_id)

        context = {}
        context['DataPoints'] = DataPoint.objects.get(worker=worker,experiment=exp,isTestPoint=False)

        return JsonResponse(context)

class ExperimentAdmin(admin.ModelAdmin):

    def get_form(self, request, obj=None, **kwargs):
        close_old_connections()
        form = super(ExperimentAdmin, self).get_form(request, obj, **kwargs)
        form.base_fields['key'].initial = get_random_string(length=10)
        return form

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
admin.site.register(DataPoint)