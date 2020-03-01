from django.shortcuts import render
from .models import Experiment,DataPoint,Worker
from django.http import HttpResponse, HttpResponseForbidden,JsonResponse
import json
import math
import csv
import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db import close_old_connections
from django.db import connection
from django.utils.crypto import get_random_string

logger = logging.getLogger('testlogger')

# Create your views here.
def MOA(request):
    context = {
    'exper':request.GET.get('exper', '1'),
    'assignmentId':request.GET.get('assignmentId', 'NULL'),
    'prac':request.GET.get('prac', '0'),
    'agents':request.GET.get('agents', '5'),
    'hitId':request.GET.get('hitId', 'NULL'),
    'worker':request.GET.get('workerId','NULL')}
    return render(request,'MOAT/MOA.html',context)

def MOAM(request):
    context = {
    'exper':request.GET.get('exper', '1'),
    'assignmentId':request.GET.get('assignmentId', 'NULL'),
    'prac':request.GET.get('prac', '0'),
    'agents':request.GET.get('agents', '5')}
    return render(request,'MOAT/MOAM.html',context)

def ThreeDMOA(request):
    return render(request,'MOAT/3DMOA.html',{})

def data_submit(request):
    close_old_connections()
    if request.method == 'PUT':
        body_unicode = request.body.decode('utf-8')
        logger.info(body_unicode)
        body = json.loads(body_unicode)

        logger.info(body['experimentID'])
        experiment = Experiment.objects.get_or_create(id = body['experimentID'])[0]

        if experiment.is_protected:
            if 'key' not in body or body['key'] != experiment.key:
                return HttpResponseForbidden()

        click_array = list(map(int,body['clicks'].split(',')))
        pre_agent_array = list(map(float,body['agents'].split(',')))
        agent_array = []
        for x,y in zip(pre_agent_array[0::2], pre_agent_array[1::2]):
            agent_array.append((float("{0:.3f}".format(float(x))),float("{0:.3f}".format(float(y)))))

        agents = json.dumps(agent_array)

        clicks = json.dumps(click_array)
        nclicks = len(click_array)
        target = click_array[-1]

        type = int(body['type'])
        question = int(body['question'])
        testpoint = bool(body['testpoint'])
        worker,made = Worker.objects.get_or_create(name=body['worker'])
        if made:
            worker.experiments.add(experiment)
        pos = json.dumps(body['pos'])

        distances = []
        for click in click_array:
            distances.append(str(math.sqrt(math.pow(agent_array[click][0] - agent_array[target][0],2) + math.pow(agent_array[click][1] - agent_array[target][1],2))))
        distances = ",".join(distances)

        point = DataPoint.objects.create(experiment=experiment,worker=worker,question=question,nclicks=nclicks,pos=pos,clicks=clicks,agents=agents,target=target,dists=distances,type=type,isTestPoint=testpoint)

        layer = get_channel_layer()
        async_to_sync(layer.group_send)(str(experiment.id), {
            'type': 'update',
            'question': question,
            'worker': str(worker.pk),
            'nclicks': nclicks,
            'target': target,
            'agents': agents,
            'pos':pos,
            'distances':distances,
            'clicks':clicks,
            'q_type':type
        })
        connection.close()
        close_old_connections()
        return HttpResponse(status=204)
    else:
        return HttpResponseForbidden()

def data_get(request,experiment_id):
    if request.method == 'GET':
        experiment = Experiment.objects.get(id=experiment_id)
        points = experiment.datapoint_set.all()

        try:
            agents = points[0].nagents
        except:
            return None

        response = HttpResponse(content_type='text/csv')
        fieldnames = ['WorkerID', 'nItems','Height','Width','DPI','Experimental','Question','Target','nClicks','Clicks','Distances']
        fieldnames.extend(["Agent {} Location".format(x) for x in range(0,agents)])
        response['Content-Disposition'] = 'attachment; filename="{}.csv"'.format(experiment_id.replace(' ','_'))

        writer = csv.writer(response)
        writer.writerow(fieldnames)

        for point in points:
            data = [point.worker,point.nagents,point.height,point.width,point.dpi,point.type,point.question,point.target,point.nclicks,point.clicks,point.dists]
            data.extend(json.loads(point.agents))
            print(data)
            writer.writerow(data)
        return response

def experiment_connect(request, experiment_id,key):
    if request.method == 'GET':

        experiment = Experiment.objects.get(id=experiment_id)

        if experiment.is_protected:
            if key != experiment.key:
                return HttpResponseForbidden()

        data = {
            "agents":experiment.agents,
            "questions":experiment.questions,
            "min_time":experiment.min_time,
            "max_time":experiment.max_time,
        }

        return JsonResponse(data)

    else:
        return HttpResponseForbidden()