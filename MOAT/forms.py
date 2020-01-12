from django.db import models
from django.forms import ModelForm
from .models import Experiment

class MyModelAdmin(admin.ModelAdmin):
    def get_form(self, request, obj=None, **kwargs):
        form = super(MyModelAdmin, self).get_form(request, obj, **kwargs)
        form.base_fields['my_field_name'].initial = 'abcd'
        return form