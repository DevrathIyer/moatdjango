from django.apps import AppConfig

class MoatConfig(AppConfig):
    name = 'MOAT'

    def ready(self):
        from django.contrib import admin
        from django.contrib.admin import sites

        class MyAdminSite(admin.AdminSite):
            pass

        mysite = MyAdminSite()
        admin.site = mysite
        sites.site = mysite