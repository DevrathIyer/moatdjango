# Generated by Django 3.0.2 on 2020-01-16 20:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('MOAT', '0002_auto_20200112_1710'),
    ]

    operations = [
        migrations.AddField(
            model_name='datapoint',
            name='isTestPoint',
            field=models.BooleanField(default=False),
            preserve_default=False,
        ),
    ]