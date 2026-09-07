from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from rest_framework.authtoken.models import Token


@database_sync_to_async
def get_user_from_token(token_key):
    try:
        return Token.objects.select_related("user").get(key=token_key).user
    except Token.DoesNotExist:
        return None


class EmergencyConsumer(AsyncJsonWebsocketConsumer):
    """One connection per logged-in device. Joins a per-user group
    (``user_<id>``) so the server can push an SOS alert straight to a
    specific nearby user without any client-side distance math or a single
    shared broadcast group that would leak the alert to everyone (including
    the sender). Auth token is passed as a query param (``?token=...``)
    since browsers can't set custom headers on a WebSocket handshake."""

    async def connect(self):
        query = parse_qs(self.scope["query_string"].decode())
        token_key = (query.get("token") or [None])[0]
        user = await get_user_from_token(token_key) if token_key else None

        if user is None:
            await self.close(code=4001)
            return

        self.user = user
        self.group_name = f"user_{user.pk}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # Handler name must match the "type" key used in channel_layer.group_send
    # (Channels converts dots: "emergency.alert" -> emergency_alert).
    async def emergency_alert(self, event):
        await self.send_json(event["payload"])
