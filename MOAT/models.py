from django.db import models

class Experiment(models.Model):
    id = models.SlugField(primary_key=True)

class DataPoint(models.Model):
    worker = models.SlugField()
    assignment = models.SlugField()
    question = models.IntegerField()
    type = models.IntegerField()
    target = models.IntegerField()
    nclicks = models.IntegerField()
    nagents = models.IntegerField()
    agents = models.CharField(max_length=2500)
    clicks = models.CharField(max_length=100)
    dists = models.CharField(max_length=2500)
    width = models.FloatField()
    height = models.FloatField()
    dpi = models.FloatField()
    experiment = models.ForeignKey('Experiment',on_delete=models.CASCADE)
