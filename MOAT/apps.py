from django.apps import AppConfig
from suit.apps import DjangoSuitConfig

class MoatConfig(AppConfig):
    name = 'MOAT'

class SuitConfig(DjangoSuitConfig):
    layout = 'horizontal'