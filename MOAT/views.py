from django.shortcuts import render
from .models import Experiment,DataPoint
from django.http import HttpResponse
import json
import math

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

        experiment = Experiment.objects.get_or_create(id = body['hitId'])

        click_array = list(map(int,body['clicks'].split(',')))
        pre_agent_array = list(map(float,body['agents'].split(',')))
        agent_array = []
        for x,y in zip(pre_agent_array[0::2], pre_agent_array[1::2]):
            agent_array.append((float(x),float(y)))
        print(agent_array)

        agents = json.dumps(body['agents'])
        nagents = len(agent_array)

        clicks = json.dumps(body['clicks'])
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

        point = DataPoint.objects.create(experiment=experiment,assignment=assignment,worker=worker,question=question,nclicks=nclicks,nagents=nagents,clicks=clicks,agents=agents,target=target,dists=distances,type=type)
        return HttpResponse(status=204)
