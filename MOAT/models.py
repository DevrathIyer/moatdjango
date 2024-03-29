import re
from django.db import models
from django.template.defaultfilters import slugify
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.dispatch import receiver
from django.db.models.signals import pre_save, post_save

"""
@receiver(pre_save)
def pre_save_handler(sender, instance, *args, **kwargs):
    instance.full_clean()
"""

class Experiment(models.Model):
    id = models.SlugField(primary_key=True)
    is_protected = models.BooleanField()
    key = models.CharField(max_length = 15)
    agents = models.IntegerField(default = 16)
    questions = models.IntegerField(default = 60)
    min_time = models.IntegerField(default = 30)
    max_time = models.IntegerField(default = 60)
    agent_speed = models.FloatField(default = 1.0)

    def __str__(self):
        return self.id

    def clean(self):
        if self.min_time > self.max_time:
            return ValidationError(_('Maximum question time should be greater than or equal to Minimum question Time.'))

class DataPoint(models.Model):
    worker = models.ForeignKey('Worker',on_delete=models.CASCADE)
    question = models.IntegerField()
    type = models.IntegerField()
    target = models.IntegerField()
    nclicks = models.IntegerField()
    agents = models.CharField(max_length=2500)
    clicks = models.CharField(max_length=100)
    dists = models.CharField(max_length=2500)
    pos = models.CharField(max_length=100)
    experiment = models.ForeignKey('Experiment',on_delete=models.CASCADE)
    isTestPoint = models.BooleanField()

class Worker(models.Model):
    name = models.CharField(max_length = 100)
    experiments = models.ManyToManyField('Experiment')
    def __str__(self):
        return self.name

def unique_slugify(instance, value, slug_field_name='slug', queryset=None,
                   slug_separator='-'):
    """
    Calculates and stores a unique slug of ``value`` for an instance.

    ``slug_field_name`` should be a string matching the name of the field to
    store the slug in (and the field to check against for uniqueness).

    ``queryset`` usually doesn't need to be explicitly provided - it'll default
    to using the ``.all()`` queryset from the model's default manager.
    """
    slug_field = instance._meta.get_field(slug_field_name)

    slug = getattr(instance, slug_field.attname)
    slug_len = slug_field.max_length

    # Sort out the initial slug, limiting its length if necessary.
    slug = slugify(value)
    if slug_len:
        slug = slug[:slug_len]
    slug = _slug_strip(slug, slug_separator)
    original_slug = slug

    # Create the queryset if one wasn't explicitly provided and exclude the
    # current instance from the queryset.
    if queryset is None:
        queryset = instance.__class__._default_manager.all()
    if instance.pk:
        queryset = queryset.exclude(pk=instance.pk)

    # Find a unique slug. If one matches, at '-2' to the end and try again
    # (then '-3', etc).
    next = 2
    while not slug or queryset.filter(**{slug_field_name: slug}):
        slug = original_slug
        end = '%s%s' % (slug_separator, next)
        if slug_len and len(slug) + len(end) > slug_len:
            slug = slug[:slug_len-len(end)]
            slug = _slug_strip(slug, slug_separator)
        slug = '%s%s' % (slug, end)
        next += 1

    setattr(instance, slug_field.attname, slug)


def _slug_strip(value, separator='-'):
    """
    Cleans up a slug by removing slug separator characters that occur at the
    beginning or end of a slug.

    If an alternate separator is used, it will also replace any instances of
    the default '-' separator with the new separator.
    """
    separator = separator or ''
    if separator == '-' or not separator:
        re_sep = '-'
    else:
        re_sep = '(?:-|%s)' % re.escape(separator)
    # Remove multiple instances and if an alternate separator is provided,
    # replace the default '-' separator.
    if separator != re_sep:
        value = re.sub('%s+' % re_sep, separator, value)
    # Remove separator from the beginning and end of the slug.
    if separator:
        if separator != '-':
            re_sep = re.escape(separator)
        value = re.sub(r'^%s+|%s+$' % (re_sep, re_sep), '', value)
    return value
