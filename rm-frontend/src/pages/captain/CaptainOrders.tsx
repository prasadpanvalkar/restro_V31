// src/pages/Captain/CaptainOrders.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add, Remove, Delete, ShoppingCart, Send, Refresh } from '@mui/icons-material';
import menuService from '@/services/api/menu.service';
import orderService from '@/services/api/order.service';
import authService from '@/services/api/auth.service';
import { MenuItem as MenuItemType, CreateOrderRequest, Category } from '@/types';
import toast from 'react-hot-toast';

interface CartItem {
  variantId: number;
  menuItemName: string;
  variantName: string;
  price: number;
  quantity: number;
}

const CaptainOrders: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user's restaurant from token
  const user = authService.getCurrentUser();
  const token = localStorage.getItem('token');
  const decodedToken = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const restaurantId = decodedToken?.restaurant_id;

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both menu items and categories
      const [itemsData, categoriesData] = await Promise.all([
        menuService.getMenuItems(),
        menuService.getCategories(),
      ]);
      
      // Filter only available items
      const availableItems = itemsData.filter(item => item.is_available);
      
      if (availableItems.length === 0) {
        setError('No menu items available. Please add items in Menu Management first.');
      }
      
      setMenuItems(availableItems);
      setCategories(categoriesData);
      
      console.log('Loaded menu items:', availableItems);
      console.log('Loaded categories:', categoriesData);
    } catch (error: any) {
      console.error('Failed to fetch menu:', error);
      setError('Failed to load menu. Please check your connection and try again.');
      toast.error('Failed to fetch menu');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (menuItem: MenuItemType, variant: any) => {
    // Find the full variant object with ID
    const fullVariant = menuItem.variants.find(v => v.variant_name === variant.variant_name);
    
    if (!fullVariant) {
      toast.error('Invalid variant selected');
      return;
    }

    // Create a unique ID for the variant (you might need to adjust based on your backend)
    const variantId = `${menuItem.id}-${variant.variant_name}`;
    
    const existingItem = cart.find(item => 
      item.menuItemName === menuItem.name && 
      item.variantName === variant.variant_name
    );
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.menuItemName === menuItem.name && item.variantName === variant.variant_name
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        variantId: parseInt(variantId) || Date.now(), // Use a fallback ID
        menuItemName: menuItem.name,
        variantName: variant.variant_name,
        price: variant.price,
        quantity: 1,
      }]);
    }
    toast.success(`Added ${menuItem.name} (${variant.variant_name}) to cart`);
  };

  const updateQuantity = (variantId: number, change: number) => {
    setCart(cart.map(item => {
      if (item.variantId === variantId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (variantId: number) => {
    setCart(cart.filter(item => item.variantId !== variantId));
    toast.success('Item removed from cart');
  };

  const calculateTotal = (): number => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCreateOrder = async () => {
    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    if (!tableNumber.trim()) {
      toast.error('Please enter table number');
      return;
    }

    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // Note: You need to map cart items to actual variant IDs from your backend
    // This is a simplified version - you should store actual variant IDs
    const orderData: CreateOrderRequest = {
      customer_name: customerName,
      table_number: tableNumber,
      order_items: cart.map(item => ({
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
    };

    try {
      await orderService.createOrder(orderData);
      toast.success('Order created successfully!');
      
      // Reset form
      setCart([]);
      setCustomerName('');
      setTableNumber('');
    } catch (error: any) {
      console.error('Failed to create order:', error);
      toast.error(error.response?.data?.detail || 'Failed to create order');
    }
  };

  const filteredMenuItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Create Order</Typography>
        <Button startIcon={<Refresh />} onClick={fetchMenuData}>
          Refresh Menu
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Menu Section */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as number | 'all')}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

          {filteredMenuItems.length === 0 ? (
            <Alert severity="info">
              No menu items available in this category. 
              {menuItems.length === 0 && ' Please add items in Menu Management first.'}
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {filteredMenuItems.map(item => (
                <Grid item xs={12} sm={6} key={item.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {item.description || 'No description available'}
                      </Typography>
                      
                      <Box sx={{ mb: 1 }}>
                        {item.food_types?.map(ft => (
                          <Chip 
                            key={ft} 
                            label={ft} 
                            size="small" 
                            color="success"
                            sx={{ mr: 0.5 }} 
                          />
                        ))}
                        {item.cuisines?.map(c => (
                          <Chip 
                            key={c} 
                            label={c} 
                            size="small" 
                            color="primary"
                            sx={{ mr: 0.5 }} 
                          />
                        ))}
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      {item.variants && item.variants.length > 0 ? (
                        item.variants.map(variant => (
                          <Box
                            key={variant.variant_name}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mt: 1,
                              p: 1,
                              border: '1px solid #e0e0e0',
                              borderRadius: 1,
                            }}
                          >
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {variant.variant_name}
                              </Typography>
                              <Typography variant="body2" color="primary">
                                ₹{variant.price}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Prep: {variant.preparation_time} min
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<Add />}
                              onClick={() => addToCart(item, variant)}
                            >
                              Add
                            </Button>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No variants available
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>

        {/* Cart Section */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              <ShoppingCart sx={{ mr: 1, verticalAlign: 'middle' }} />
              Order Details
            </Typography>

            <TextField
              fullWidth
              label="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              margin="normal"
              size="small"
              required
            />

            <TextField
              fullWidth
              label="Table Number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              margin="normal"
              size="small"
              required
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              Cart Items ({cart.length})
            </Typography>

            {cart.length === 0 ? (
              <Typography color="textSecondary" variant="body2" sx={{ py: 2 }}>
                Cart is empty. Add items from the menu.
              </Typography>
            ) : (
              <List dense>
                {cart.map(item => (
                  <ListItem key={item.variantId} sx={{ px: 0 }}>
                    <ListItemText
                      primary={item.menuItemName}
                      secondary={
                        <>
                          {item.variantName} - ₹{item.price}
                          <br />
                          Subtotal: ₹{(item.price * item.quantity).toFixed(2)}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item.variantId, -1)}
                          disabled={item.quantity <= 1}
                        >
                          <Remove fontSize="small" />
                        </IconButton>
                        <Typography sx={{ mx: 1, minWidth: 20, textAlign: 'center' }}>
                          {item.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item.variantId, 1)}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeFromCart(item.variantId)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6" color="primary">
                ₹{calculateTotal().toFixed(2)}
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<Send />}
              onClick={handleCreateOrder}
              disabled={cart.length === 0 || !customerName || !tableNumber}
            >
              Create Order
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CaptainOrders;