from django.http import HttpResponse
import logging
logger = logging.getLogger('testlogger')
class CorsMiddleware(object):

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        logger.error(exception)
        return HttpResponse("in exception")

    def process_response(self, req, resp):
        resp["Access-Control-Allow-Origin"] = "*"
        return resp