from django.shortcuts import render
from .models import Experiment,DataPoint
from django.http import HttpResponse
import json

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
        experiment = Experiment.objects.get_or_create(id = request.body['hitId'])

        click_array = list(map(int,request.body['clicks'].split(',')))
        agent_array = list(map(float,request.body['agents'].split(',')))

        agents = json.dumps(request.body['agents'])
        nagents = len(agent_array)

        clicks = json.dumps(request.body['clicks'])
        nclicks = len(click_array)
        target = click_array[-1]

        type = int(request.body['type'])
        question = int(request.body['question'])
        worker = request.body['worker']
        assignment = request.body['assignment']

        distances = []
        for click in clicks_array:
            distances.append(str(math.sqrt(math.pow(agent_array[click][0] - agent_array[target][0],2) + math.pow(agent_array[click][1] - agent_array[target][1],2))))
        distances = ",".join(distances)

        point = DataPoint.objects.create(experiment=experiment,assignment=assignment,worker=worker,question=question,nclicks=nclicks,nagents=nagents,clicks=clicks,agents=agents,target=target,dists=distances,type=type)
        return HttpResponse(status=204)
