import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer

logger = logging.getLogger(__name__)

class TransactionUpdateConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer that handles live balance updates and real-time transaction notifications.
    """
    async def connect(self):
        self.user = self.scope.get("user")
        
        # Check authentication status
        if not self.user or self.user.is_anonymous:
            logger.warning("Rejecting anonymous WebSocket connection request.")
            await self.close(code=4003)
            return

        self.group_name = f"user_{self.user.id}"
        
        # Join user personal alert group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"User {self.user.email} successfully connected to WebSockets channel: {self.channel_name}")

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            # Leave user personal group
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
            logger.info(f"User {self.user.email} disconnected from WebSockets. Channel discarded.")

    async def transaction_update(self, event):
        """
        Handler called when a transaction event is broadcast to the group.
        Sends the payload downstream to the React client.
        """
        await self.send_json(event["data"])
