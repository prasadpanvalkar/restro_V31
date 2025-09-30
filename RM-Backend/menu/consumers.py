# menu/consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ChefConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.restaurant_slug = self.scope['url_route']['kwargs']['restaurant_slug']
        self.group_name = f'chef_notifications_{self.restaurant_slug}'

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # This method is called when a message with 'type': 'send.new.order' is sent to the group
    async def send_new_order(self, event):
        order_data = event['data']
        await self.send(text_data=json.dumps(order_data))
        
class CashierConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.restaurant_slug = self.scope['url_route']['kwargs']['restaurant_slug']
        self.group_name = f'cashier_notifications_{self.restaurant_slug}'

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # This method is called when an order is ready for payment
    async def order_ready_for_payment(self, event):
        order_data = event['data']
        await self.send(text_data=json.dumps(order_data))


class CustomerConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        
        self.bill_id = self.scope['url_route']['kwargs']['bill_id']
        self.group_name = f'customer_{self.bill_id}'

        # Join the correct room group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()
        # --- END OF FIX ---

    async def disconnect(self, close_code):
        # Discard from the correct group name
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    # This new method is called when your ChefOrderItemUpdateView sends a message
    # with {'type': 'order_status_update', ...}
    async def order_status_update(self, event):
        # The event itself is the message, so we send it directly.
        await self.send(text_data=json.dumps(event))

    # This handles the old message format for backward compatibility
    async def send_status_update(self, event):
        data = event['data']
        await self.send(text_data=json.dumps(data))