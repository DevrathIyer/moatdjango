# Generated by Django 3.0.2 on 2020-01-31 18:22

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Experiment',
            fields=[
                ('id', models.SlugField(primary_key=True, serialize=False)),
                ('is_protected', models.BooleanField()),
                ('key', models.CharField(max_length=15)),
            ],
        ),
        migrations.CreateModel(
            name='Worker',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('experiments', models.ManyToManyField(to='MOAT.Experiment')),
            ],
        ),
        migrations.CreateModel(
            name='DataPoint',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('question', models.IntegerField()),
                ('type', models.IntegerField()),
                ('target', models.IntegerField()),
                ('nclicks', models.IntegerField()),
                ('agents', models.CharField(max_length=2500)),
                ('clicks', models.CharField(max_length=100)),
                ('dists', models.CharField(max_length=2500)),
                ('pos', models.CharField(max_length=100)),
                ('isTestPoint', models.BooleanField()),
                ('experiment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='MOAT.Experiment')),
                ('worker', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='MOAT.Worker')),
            ],
        ),
    ]
