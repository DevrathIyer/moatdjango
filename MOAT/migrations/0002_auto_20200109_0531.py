# Generated by Django 3.0.2 on 2020-01-09 05:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('MOAT', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='worker',
            name='id',
            field=models.SlugField(primary_key=True, serialize=False),
        ),
    ]