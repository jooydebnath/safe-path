"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.1/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# get_asgi_application() must run first — it populates Django's app registry,
# which api/routing.py's consumer import depends on.
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402

import api.routing  # noqa: E402

# No AuthMiddlewareStack here: EmergencyConsumer does its own token-based
# auth (query param, matching how the REST API authenticates) rather than
# Django's session-cookie auth, since browsers can't set custom WS headers.
application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': URLRouter(api.routing.websocket_urlpatterns),
})
