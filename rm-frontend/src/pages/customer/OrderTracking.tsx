import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, Grid, Card, CardContent, Button, Chip,
  LinearProgress, List, ListItem, ListItemText, Divider, Alert, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Stack,
} from '@mui/material';
import {
  Timer, CheckCircle, Restaurant, ShoppingCart, Add, Remove, AccessTime, Receipt
} from '@mui/icons-material';
import { useWebSocket } from '@/hooks/useWebSocket';
import menuService from '@/services/api/menu.service';
import orderService from '@/services/api/order.service';
import { PublicMenuItem } from '@/types/menu.types';
import toast from 'react-hot-toast';
import { OrderSessionManager, SessionOrder } from '@/utils/orderSession';

// Main component
const OrderTracking: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();

  // --- State Management ---
  const [order, setOrder] = useState<SessionOrder | null>(null);
  const [timers, setTimers] = useState<{ [itemId: number]: number }>({});
  const [menuItems, setMenuItems] = useState<PublicMenuItem[]>([]);
  const [reorderDialog, setReorderDialog] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // --- Component Initialization ---
  useEffect(() => {
    const stateData = location.state as SessionOrder;
    const sessionData = OrderSessionManager.getOrder();
    const initialOrder = stateData?.orderId ? stateData : sessionData;

    if (initialOrder) {
      setOrder(initialOrder);
    } else {
      navigate(`/menu/${restaurantSlug}`);
    }

    if (restaurantSlug) {
      menuService.getPublicMenu(restaurantSlug)
        .then(setMenuItems)
        .catch(err => console.error('Failed to fetch menu:', err));
    }
  }, []);

  // --- WebSocket Logic ---
  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === 'order_status_update' && data.order_item_id) {
      setOrder(prevOrder => {
        if (!prevOrder) return null;
        const updatedItems = prevOrder.items.map((item: any) =>
          item.id === data.order_item_id
            ? { ...item, status: data.status, preparation_time: data.preparation_time }
            : item
        );
        const updatedOrder = { ...prevOrder, items: updatedItems };
        OrderSessionManager.saveOrder(updatedOrder);
        return updatedOrder;
      });
      if (data.status === 'ACCEPTED') {
        toast.success(`"${data.item_name}" is being prepared!`);
      } else if (data.status === 'COMPLETED') {
        toast.success(`"${data.item_name}" is ready!`, { icon: '🍽️' });
      }
    }
  },[]);

  useWebSocket({
    role: 'CUSTOMER',
    restaurantSlug: order?.restaurantSlug,
    tableNumber: order?.tableNumber,
    onMessage: handleWebSocketMessage,
    enabled: !!order, // This flag prevents connection before order is loaded
  });

  // --- Countdown Timer Logic ---
  useEffect(() => {
    if (!order) return;
    const activeTimerIDs: NodeJS.Timeout[] = [];
    order.items.forEach((item: any) => {
      if (item.status === 'ACCEPTED' && timers[item.id] === undefined && item.preparation_time) {
        const remainingSeconds = item.preparation_time * 60;
        setTimers(prev => ({ ...prev, [item.id]: remainingSeconds }));
        const timerId = setInterval(() => {
          setTimers(prevTimers => {
            const newTime = (prevTimers[item.id] || 0) - 1;
            if (newTime <= 0) {
              clearInterval(timerId);
              return { ...prevTimers, [item.id]: 0 };
            }
            return { ...prevTimers, [item.id]: newTime };
          });
        }, 1000);
        activeTimerIDs.push(timerId);
      }
    });
    return () => {
      activeTimerIDs.forEach(clearInterval);
    };
  }, [order]);

  // --- "Add More Items" Logic ---
  const handleAddMoreItems = async () => {
    if (cart.length === 0 || !order) {
      toast.error('Your cart is empty.');
      return;
    }
    setLoading(true);
    try {
      const newItemsPayload = cart.map(item => ({
        menu_item_id: item.menu_item_id,
        variant_name: item.variant_name,
        quantity: item.quantity,
      }));
      
      const response = await orderService.addItemsToOrder(order.orderId, newItemsPayload);
      const updatedOrderFromServer = response.data;
      
      setOrder(updatedOrderFromServer);
      OrderSessionManager.saveOrder(updatedOrderFromServer);
      setCart([]);
      setReorderDialog(false);
      toast.success('Additional items added to your order!');
    } catch (error) {
      toast.error('Failed to add items to your order.');
    } finally {
      setLoading(false);
    }
  };

  // --- Cart and UI Helper Functions ---
  const addToCart = (item: PublicMenuItem, variant: any) => {
    const existingItem = cart.find(c => c.menu_item_id === item.id && c.variant_name === variant.variant_name);
    if (existingItem) {
      setCart(cart.map(c => c.menu_item_id === item.id && c.variant_name === variant.variant_name ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { menu_item_id: item.id, variant_name: variant.variant_name, quantity: 1, price: variant.price, name: item.name, preparation_time: variant.preparation_time }]);
    }
    toast.success('Added to cart');
  };

  const updateCartQuantity = (itemId: number, variantName: string, change: number) => {
    setCart(cart.map(item => {
      if (item.menu_item_id === itemId && item.variant_name === variantName) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean) as any[]);
  };

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "Ready soon!";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getProgress = (): number => {
    if (!order || order.items.length === 0) return 0;
    const completedItems = order.items.filter((i: any) => i.status === 'COMPLETED').length;
    return (completedItems / order.items.length) * 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'ACCEPTED': return 'info';
      case 'COMPLETED': return 'success';
      default: return 'default';
    }
  };

  // --- Loading State & Render ---
  if (!order) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const allItemsCompleted = order.items.every((i: any) => i.status === 'COMPLETED');

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid xs={12} md={4}>
            <Box display="flex" alignItems="center" gap={2}>
              <Receipt fontSize="large" color="primary" />
              <Box>
                <Typography variant="h5" fontWeight="bold">Order #{order.orderId}</Typography>
                <Typography variant="body2" color="textSecondary">Queue: {order.queueNumber}</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid xs={12} md={4}>
            <Box textAlign="center">
              <Typography variant="body2" color="textSecondary">Table: {order.tableNumber}</Typography>
            </Box>
          </Grid>
          <Grid xs={12} md={4}>
            <Box textAlign={{ xs: 'left', md: 'right' }} mt={{ xs: 2, md: 0 }}>
              <Button variant="contained" startIcon={<Add />} onClick={() => setReorderDialog(true)} disabled={allItemsCompleted}>
                Add More Items
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ mt: 3 }}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">Order Progress</Typography>
            <Typography variant="body2" fontWeight="bold">{Math.round(getProgress())}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={getProgress()} sx={{ height: 8, borderRadius: 4 }} color={allItemsCompleted ? 'success' : 'primary'} />
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>Order Items</Typography>
        <List>
          {order.items.map((item: any, index: number) => (
            <React.Fragment key={item.id || index}>
              <ListItem sx={{ py: 2 }}>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Typography variant="subtitle1" fontWeight="500">{item.name} ({item.variant_name})</Typography>
                      <Chip label={`×${item.quantity}`} size="small" variant="outlined" />
                    </Box>
                  }
                  secondary={
                    <Box component="div" display="flex" alignItems="center" gap={2} mt={1}>
                      <Chip
                        label={item.status}
                        color={getStatusColor(item.status)}
                        size="small"
                        icon={
                          item.status === 'COMPLETED' ? <CheckCircle /> :
                          item.status === 'ACCEPTED' ? <Restaurant /> :
                          <AccessTime />
                        }
                      />
                      {item.status === 'ACCEPTED' && timers[item.id] > 0 && (
                        <Typography variant="caption" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Timer sx={{ fontSize: 14 }} /> {formatTime(timers[item.id])}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < order.items.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
        {allItemsCompleted && (
          <Alert severity="success" sx={{ mt: 2 }}>
            All items are ready! Please proceed to the cashier for payment.
          </Alert>
        )}
      </Paper>

      <Dialog open={reorderDialog} onClose={() => setReorderDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add More Items</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {menuItems.map((item) => (
              <Grid xs={12} sm={6} key={item.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold">{item.name}</Typography>
                    {item.variants.map((variant) => (
                      <Box key={variant.variant_name} display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                        <Typography variant="body2">{variant.variant_name} - ₹{variant.price}</Typography>
                        <Button size="small" variant="outlined" onClick={() => addToCart(item, variant)}>Add</Button>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          {cart.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Selected Items ({cart.reduce((sum, item) => sum + item.quantity, 0)})</Typography>
              <List>
                {cart.map((item, index) => (
                  <ListItem key={`${item.menu_item_id}-${item.variant_name}`}>
                    <ListItemText primary={`${item.name} (${item.variant_name})`} secondary={`₹${item.price}`} />
                    <Box display="flex" alignItems="center">
                      <IconButton size="small" onClick={() => updateCartQuantity(item.menu_item_id, item.variant_name, -1)}><Remove /></IconButton>
                      <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                      <IconButton size="small" onClick={() => updateCartQuantity(item.menu_item_id, item.variant_name, 1)}><Add /></IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
              <Typography variant="h6" align="right" sx={{ mt: 2 }}>
                Total: ₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReorderDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddMoreItems} disabled={cart.length === 0 || loading} startIcon={loading ? <CircularProgress size={20} /> : <ShoppingCart />}>
            {loading ? 'Adding...' : 'Add to Order'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderTracking;