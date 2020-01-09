from django.shortcuts import render
from .models import Experiment,DataPoint
from django.http import HttpResponse
import json
import math
import csv
from channels.layers import get_channel_layer

from asgiref.sync import async_to_sync
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

def data_submit(request):
    if request.method == 'POST':
        body_unicode = request.body.decode('utf-8')
        print(body_unicode)
        body = json.loads(body_unicode)

        experiment = Experiment.objects.get_or_create(id = body['hitId'])[0]

        click_array = list(map(int,body['clicks'].split(',')))
        pre_agent_array = list(map(float,body['agents'].split(',')))
        agent_array = []
        for x,y in zip(pre_agent_array[0::2], pre_agent_array[1::2]):
            agent_array.append((float("{0:.3f}".format(float(x))),float("{0:.3f}".format(float(y)))))
        print(agent_array)

        width = float("{0:.3f}".format(float(body['width'])))
        height = float("{0:.3f}".format(float(body['height'])))
        dpi = float("{0:.3f}".format(float(body['dpi'])))

        agents = json.dumps(agent_array)
        nagents = len(agent_array)

        clicks = json.dumps(click_array)
        nclicks = len(click_array)
        target = click_array[-1]

        type = int(body['type'])
        question = int(body['question'])
        worker = body['worker']
        assignment = body['assignment']

        distances = []
        for click in click_array:
            distances.append(str(math.sqrt(math.pow(agent_array[click][0] - agent_array[target][0],2) + math.pow(agent_array[click][1] - agent_array[target][1],2))))
        distances = ",".join(distances)

        point = DataPoint.objects.create(experiment=experiment,assignment=assignment,worker=worker,question=question,nclicks=nclicks,nagents=nagents,clicks=clicks,agents=agents,target=target,dists=distances,type=type, width=width,height=height,dpi=dpi)
        return HttpResponse(status=204)

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
        layer = get_channel_layer()
        async_to_sync(layer.group_send)('data_room', {
            'message': 'hello',
        })
        return response
