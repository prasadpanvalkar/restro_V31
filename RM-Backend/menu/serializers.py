# menu/serializers.py

from rest_framework import serializers
from .models import Category, MenuItem, MenuItemVariant, Bill, OrderItem , FoodType, Cuisine

# --- Read-Only Serializers (for displaying the menu) ---

class MenuItemVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItemVariant
        fields = ['variant_name', 'price']

class MenuItemSerializer(serializers.ModelSerializer):
    variants = MenuItemVariantSerializer(many=True, read_only=True)
    class Meta:
        model = MenuItem
        fields = ['name', 'variants']

class CategorySerializer(serializers.ModelSerializer):
    menu_items = MenuItemSerializer(many=True, read_only=True)
    class Meta:
        model = Category
        fields = ['name', 'menu_items']

# --- Write-Only Serializers (for creating orders) ---

class OrderItemWriteSerializer(serializers.ModelSerializer):
    """
    This serializer is ONLY for validating the items in a NEW order.
    """
    variant_id = serializers.IntegerField()
    class Meta:
        model = OrderItem
        fields = ['variant_id', 'quantity']

class BillSerializer(serializers.ModelSerializer):
    """
    This serializer is ONLY for creating a NEW bill.
    """
    # This field uses the correct "Write" serializer and is write_only.
    order_items = OrderItemWriteSerializer(many=True, write_only=True)

    class Meta:
        model = Bill
        fields = ['id', 'customer_name', 'table_number', 'order_items']

    def create(self, validated_data):
        order_items_data = validated_data.pop('order_items')
        bill = Bill.objects.create(**validated_data)
        for item_data in order_items_data:
            OrderItem.objects.create(
                bill=bill,
                variant_id=item_data['variant_id'],
                quantity=item_data['quantity']
            )
        return bill

# --- Cashier Serializers ---

class CashierOrderItemSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='variant.menu_item.name', read_only=True)
    variant_name = serializers.CharField(source='variant.variant_name', read_only=True)
    price = serializers.DecimalField(source='variant.price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['name', 'variant_name', 'quantity', 'price']

# This serializer formats the entire bill, including its items and total price
class CashierBillSerializer(serializers.ModelSerializer):
    order_items = CashierOrderItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Bill
        fields = ['id', 'customer_name', 'table_number', 'payment_status', 'created_at', 'order_items', 'total_price']

    def get_total_price(self, bill):
        # This method calculates the total price by summing up all items
        return sum(item.variant.price * item.quantity for item in bill.order_items.all())

# --- Admin/Management Serializers ---

class MenuItemVariantWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItemVariant
        fields = ['variant_name', 'price', 'preparation_time']

class MenuItemManageSerializer(serializers.ModelSerializer):
    """
    Serializer for the Restaurant Admin to manage their menu items.
    This serializer is now CORRECTED to handle Many-to-Many relationships on create.
    """
    variants = MenuItemVariantWriteSerializer(many=True, required=False)
    
    # --- ADDED ---
    # Explicitly define Many-to-Many fields to accept a list of primary keys (e.g., [1, 2, 3]).
    # This improves validation and makes the serializer's intent clear.
    food_types = serializers.PrimaryKeyRelatedField(
        queryset=FoodType.objects.all(), many=True, required=False
    )
    cuisines = serializers.PrimaryKeyRelatedField(
        queryset=Cuisine.objects.all(), many=True, required=False
    )

    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'description', 'category', 'is_available', 
            'food_types', 'cuisines', 'variants'
        ]
        read_only_fields = ['id']

    # --- MODIFIED ---
    # The 'create' method is now corrected to handle M2M relationships.
    def create(self, validated_data):
        # 1. Pop nested and M2M data before creating the main MenuItem object.
        #    This is crucial because you cannot assign M2M relationships during creation.
        variants_data = validated_data.pop('variants', [])
        food_types_data = validated_data.pop('food_types', [])
        cuisines_data = validated_data.pop('cuisines', [])
        
        # 2. Create the MenuItem instance with the remaining simple fields.
        menu_item = MenuItem.objects.create(**validated_data)
        
        # 3. Use the .set() method to establish the M2M relationships AFTER the object is created.
        if food_types_data:
            menu_item.food_types.set(food_types_data)
        if cuisines_data:
            menu_item.cuisines.set(cuisines_data)
        
        # 4. Create the nested Variant objects associated with the menu item.
        for variant_data in variants_data:
            MenuItemVariant.objects.create(menu_item=menu_item, **variant_data)
            
        return menu_item
        
    def update(self, instance, validated_data):
        # The logic here was already correct, but we've added comments for clarity.
        variants_data = validated_data.pop('variants', None) # Use None to detect if 'variants' was passed
        
        # Update the simple fields on the menu item instance.
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.category = validated_data.get('category', instance.category)
        instance.is_available = validated_data.get('is_available', instance.is_available)
        
        # Handle many-to-many relationships using .set().
        # This replaces all existing relationships with the new set.
        if 'food_types' in validated_data:
            instance.food_types.set(validated_data.get('food_types'))
        if 'cuisines' in validated_data:
            instance.cuisines.set(validated_data.get('cuisines'))
            
        instance.save()
        
        # If a new list of variants is provided, replace the existing ones.
        # This is a simple and common strategy for updating nested objects.
        if variants_data is not None:
            instance.variants.all().delete()
            for variant_data in variants_data:
                MenuItemVariant.objects.create(menu_item=instance, **variant_data)
                
        return instance

class CategoryManageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class FoodTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodType
        fields = ['id', 'name']

class CuisineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuisine
        fields = ['id', 'name']

# --- Public Facing Serializers ---

class PublicMenuItemVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItemVariant
        fields = ['variant_name', 'price', 'preparation_time']

class PublicMenuItemSerializer(serializers.ModelSerializer):
    variants = PublicMenuItemVariantSerializer(many=True, read_only=True)
    # Use StringRelatedField to display human-readable names instead of IDs.
    food_types = serializers.StringRelatedField(many=True)
    cuisines = serializers.StringRelatedField(many=True)

    class Meta:
        model = MenuItem
        fields = ['id', 'name', 'description', 'food_types', 'cuisines', 'variants']

# --- Restaurant Order Management Serializers ---

class RestaurantOrderListSerializer(serializers.ModelSerializer):
    """
    A detailed serializer for listing orders for the Restaurant Admin.
    """
    # Re-use the detailed item serializer made for the cashier.
    order_items = CashierOrderItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Bill
        fields = [
            'id', 'customer_name', 'table_number', 'payment_status', 
            'payment_method', 'created_at', 'total_price', 'order_items'
        ]

    def get_total_price(self, bill):
        return sum(item.variant.price * item.quantity for item in bill.order_items.all())

# --- Frontend Order Creation Serializers ---

class FrontendOrderItemSerializer(serializers.Serializer):
    """
    Validates an incoming order item from the frontend. Not tied to a model directly.
    """
    menu_item_id = serializers.IntegerField()
    variant_name = serializers.CharField(max_length=100)
    quantity = serializers.IntegerField(min_value=1)

class FrontendOrderSerializer(serializers.Serializer):
    """
    Validates the entire incoming order from the frontend. Not tied to a model directly.
    """
    table_number = serializers.CharField(max_length=50)
    customer_name = serializers.CharField(max_length=150)
    items = FrontendOrderItemSerializer(many=True)

# --- Kitchen View Serializers ---

class KitchenOrderItemSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='variant.menu_item.name', read_only=True)
    variant_name = serializers.CharField(source='variant.variant_name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'name', 'variant_name', 'quantity', 'status']

class KitchenOrderSerializer(serializers.ModelSerializer):
    order_items = KitchenOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Bill
        fields = ['id', 'table_number', 'customer_name', 'created_at', 'order_items']