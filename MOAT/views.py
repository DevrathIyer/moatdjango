from django.shortcuts import render

# Create your views here.
def index(request):
    context = {
    'exper':request.GET.get('exper', '1'),
    'assignmentId':request.GET.get('assignmentId', 'NULL'),
    'prac':request.GET.get('prac', '0'),
    'agents':request.GET.get('agents', '5')}
    return render(request,'MOAT/index.html',context)
