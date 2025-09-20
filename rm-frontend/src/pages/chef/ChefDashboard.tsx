// src/pages/Chef/ChefDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
} from '@mui/material';
import {
  Timer,
  Restaurant,
  CheckCircle,
  Cancel,
  Info,
  Refresh,
  AccessTime,
  Person,
} from '@mui/icons-material';
import { useWebSocket } from '@/hooks/useWebSocket';
import orderService from '@/services/api/order.service';
import authService from '@/services/api/auth.service';
import { KitchenOrder, OrderStatus, WebSocketMessage } from '@/types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ChefDashboard: React.FC = () => {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState<string>('');

  const user = authService.getCurrentUser();
  // Get restaurant from user token
  const token = localStorage.getItem('token');
  const decodedToken = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const restaurantId = decodedToken?.restaurant_id;

  // This is the updated function you provided
  const handleWebSocketMessage = useCallback((data: any) => {
    console.log('WebSocket message received:', data);
    
    // Check if this is an additional order for existing table
    if (data.table_number && data.items) {
      const existingOrder = orders.find(o => 
        o.table_number === data.table_number && 
        o.customer_name === data.customer_name
      );
      
      if (existingOrder) {
        // Add items to existing order
        const updatedOrder = {
          ...existingOrder,
          order_items: [
            ...existingOrder.order_items,
            ...data.items.map((item: any) => ({
              id: item.order_item_id || Date.now() + Math.random(),
              name: item.name,
              variant_name: item.variant || item.variant_name,
              quantity: item.quantity,
              status: 'PENDING' as OrderStatus,
              special_instructions: item.special_instructions,
            }))
          ]
        };
        
        setOrders(prev => prev.map(order => 
          order.id === existingOrder.id ? updatedOrder : order
        ));
        
        toast.success(`Additional items added for Table ${data.table_number}`, {
          duration: 5000,
          icon: '➕',
        });
      } else {
        // New order
        const newOrder: KitchenOrder = {
          id: data.bill_id || Date.now(),
          table_number: data.table_number,
          customer_name: data.customer_name || 'Walk-in Customer',
          created_at: new Date().toISOString(),
          order_items: data.items.map((item: any) => ({
            id: item.order_item_id || item.id,
            name: item.name,
            variant_name: item.variant || item.variant_name,
            quantity: item.quantity,
            status: 'PENDING' as OrderStatus,
            special_instructions: item.special_instructions,
          })),
        };
        
        setOrders(prev => [newOrder, ...prev]);
        toast.success(`New order from Table ${data.table_number}`, {
          duration: 5000,
          icon: '🍽️',
        });
      }
    }
  }, [orders]);


  useWebSocket({
    role: 'CHEF',
    restaurantSlug,
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      console.log('WebSocket connected for chef dashboard');
      toast.success('Connected to kitchen updates', { icon: '🔌' });
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected');
      toast.error('Disconnected from kitchen updates', { icon: '🔌' });
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error - orders may not update automatically');
    },
  });

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        if (restaurantId) {
          const slug = decodedToken?.restaurant_slug || 
                       decodedToken?.slug || 
                       user?.restaurant?.slug ||
                       `restaurant-${restaurantId}`;
          setRestaurantSlug(slug);
        }
        await fetchOrders();
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        setError('Failed to initialize dashboard');
      }
    };
    initializeDashboard();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getKitchenOrders();
      const activeOrders = data.filter(order =>
        order.order_items.some(
          item => item.status === 'PENDING' || item.status === 'ACCEPTED'
        )
      );
      setOrders(activeOrders);
    } catch (error: any) {
      setError('Failed to fetch orders. Please try again.');
      toast.error('Failed to load orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (itemId: number, status: OrderStatus) => {
    try {
      await orderService.updateOrderItemStatus(itemId, status);
      setOrders(prev =>
        prev.map(order => ({
          ...order,
          order_items: order.order_items.map(item =>
            item.id === itemId ? { ...item, status } : item
          ),
        }))
      );
      setOrders(prev =>
        prev.filter(order =>
          order.order_items.some(
            item => item.status === 'PENDING' || item.status === 'ACCEPTED'
          )
        )
      );
      const statusMessages = {
        ACCEPTED: { text: 'Order accepted', icon: '👍' },
        COMPLETED: { text: 'Order completed', icon: '✅' },
        DECLINED: { text: 'Order declined', icon: '❌' },
      };
      const message = statusMessages[status as keyof typeof statusMessages];
      if (message) {
        toast.success(message.text, { icon: message.icon });
      }
    } catch (error) {
      toast.error('Failed to update order status');
      console.error('Error updating status:', error);
    }
  };

  const updateTableOrderStatus = async (order: KitchenOrder, status: OrderStatus) => {
    try {
      let itemsToUpdate: any[] = [];
      if (status === 'ACCEPTED' || status === 'DECLINED') {
        itemsToUpdate = order.order_items.filter(item => item.status === 'PENDING');
      } else if (status === 'COMPLETED') {
        itemsToUpdate = order.order_items.filter(item => 
          item.status === 'PENDING' || item.status === 'ACCEPTED'
        );
      }
      for (const item of itemsToUpdate) {
        await orderService.updateOrderItemStatus(item.id, status);
      }
      setOrders(prev =>
        prev.map(o =>
          o.id === order.id
            ? {
                ...o,
                order_items: o.order_items.map(item => {
                  if (status === 'COMPLETED') {
                    return (item.status === 'PENDING' || item.status === 'ACCEPTED') 
                      ? { ...item, status } 
                      : item;
                  } else {
                    return item.status === 'PENDING' 
                      ? { ...item, status } 
                      : item;
                  }
                })
              }
            : o
        )
      );
      setOrders(prev =>
        prev.filter(o => {
          const hasActiveItems = o.order_items.some(
            item => item.status === 'PENDING' || item.status === 'ACCEPTED'
          );
          if (o.id === order.id) {
            const updatedOrder = prev.find(prevOrder => prevOrder.id === order.id);
            if (updatedOrder) {
              return updatedOrder.order_items.some(
                item => item.status === 'PENDING' || item.status === 'ACCEPTED'
              );
            }
          }
          return hasActiveItems;
        })
      );
      const statusMessages = {
        ACCEPTED: { text: `Table ${order.table_number} order accepted`, icon: '👍' },
        COMPLETED: { text: `Table ${order.table_number} order completed`, icon: '✅' },
        DECLINED: { text: `Table ${order.table_number} order declined`, icon: '❌' },
      };
      const message = statusMessages[status as keyof typeof statusMessages];
      if (message) {
        toast.success(message.text, { icon: message.icon });
      }
    } catch (error) {
      toast.error('Failed to update order status');
      console.error('Error updating status:', error);
    }
  };

  const getOrderAge = (createdAt: string): string => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    return format(new Date(createdAt), 'HH:mm');
  };

  const getOrderPriority = (createdAt: string): 'high' | 'medium' | 'low' => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (minutes > 15) return 'high';
    if (minutes > 10) return 'medium';
    return 'low';
  };

  const getTableStatus = (order: KitchenOrder): 'pending' | 'in-progress' | 'ready' => {
    const hasAccepted = order.order_items.some(item => item.status === 'ACCEPTED');
    const allCompleted = order.order_items.every(item => item.status === 'COMPLETED');
    if (allCompleted) return 'ready';
    if (hasAccepted) return 'in-progress';
    return 'pending';
  };

  if (loading && orders.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#c6c9cf', minHeight: '100vh' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: 2, sm: 0 },
        mb: 4,
        backgroundColor: 'white',
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 600, 
              color: '#1a1a1a', 
              mb: 1,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            Kitchen Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and track your restaurant orders
          </Typography>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          justifyContent: { xs: 'center', sm: 'flex-end' }
        }}>
          <Chip 
            label={`${orders.length} Active Orders`} 
            sx={{ 
              backgroundColor: '#e3f2fd',
              color: '#1976d2',
              fontWeight: 500,
              height: { xs: 28, sm: 32 }
            }}
          />
          <Tooltip title="Refresh orders">
            <IconButton 
              onClick={fetchOrders} 
              disabled={loading}
              sx={{ 
                backgroundColor: '#f5f5f5',
                '&:hover': { backgroundColor: '#e0e0e0' },
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 }
              }}
            >
              <Refresh sx={{ fontSize: { xs: 20, sm: 24 } }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Restaurant sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Active Orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            New orders will appear here automatically
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => {
            const priority = getOrderPriority(order.created_at);
            const tableStatus = getTableStatus(order);
            const pendingItems = order.order_items.filter(item => item.status === 'PENDING');
            
            return (
              <Grid item xs={12} lg={6} xl={4} key={order.id}>
                <Card 
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid #e0e0e0',
                    backgroundColor: 'white',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      borderColor: '#d0d0d0'
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                            Table {order.table_number}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Person sx={{ fontSize: 16, color: '#666' }} />
                              <Typography variant="body2" color="text.secondary">
                                {order.customer_name}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTime sx={{ fontSize: 16, color: '#666' }} />
                              <Typography variant="body2" color="text.secondary">
                                {getOrderAge(order.created_at)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Chip
                            size="small"
                            label={
                              priority === 'high' ? 'URGENT' :
                              priority === 'medium' ? 'MEDIUM' : 'NEW'
                            }
                            sx={{
                              backgroundColor: 
                                priority === 'high' ? '#fff3e0' :
                                priority === 'medium' ? '#f3e5f5' : '#e8f5e8',
                              color:
                                priority === 'high' ? '#f57c00' :
                                priority === 'medium' ? '#7b1fa2' : '#388e3c',
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              mb: 1
                            }}
                          />
                          <Typography variant="caption" display="block" color="text.secondary">
                            {order.order_items.length} items
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <TableContainer sx={{ mb: 3, backgroundColor: '#fafafa', borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#666', fontSize: '0.8rem' }}>Item</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600, color: '#666', fontSize: '0.8rem' }}>Qty</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600, color: '#666', fontSize: '0.8rem' }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {order.order_items.map((item) => (
                            <TableRow key={item.id} sx={{ '&:last-child td': { border: 0 } }}>
                              <TableCell sx={{ py: 1.5 }}>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a1a1a' }}>{item.name}</Typography>
                                  {item.variant_name && (<Typography variant="caption" color="text.secondary">{item.variant_name}</Typography>)}
                                  {item.special_instructions && (
                                    <Box sx={{ mt: 0.5, p: 1, backgroundColor: '#fff3e0', borderRadius: 1, border: '1px solid #ffe0b2' }}>
                                      <Typography variant="caption" sx={{ color: '#f57c00', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Info sx={{ fontSize: 12 }} />
                                        {item.special_instructions}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell align="center" sx={{ py: 1.5 }}><Typography variant="body2" sx={{ fontWeight: 500 }}>{item.quantity}</Typography></TableCell>
                              <TableCell align="center" sx={{ py: 1.5 }}>
                                <Chip
                                  label={item.status}
                                  size="small"
                                  sx={{
                                    backgroundColor: 
                                      item.status === 'PENDING' ? '#fff3e0' :
                                      item.status === 'ACCEPTED' ? '#e3f2fd' :
                                      item.status === 'COMPLETED' ? '#e8f5e8' : '#ffebee',
                                    color:
                                      item.status === 'PENDING' ? '#f57c00' :
                                      item.status === 'ACCEPTED' ? '#1976d2' :
                                      item.status === 'COMPLETED' ? '#388e3c' : '#d32f2f',
                                    fontWeight: 500,
                                    fontSize: '0.7rem',
                                    minWidth: '70px'
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    <Stack direction="row" spacing={2}>
                      {pendingItems.length > 0 && (
                        <>
                          <Button variant="contained" startIcon={<CheckCircle />} onClick={() => updateTableOrderStatus(order, 'ACCEPTED')} fullWidth sx={{ backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' }, textTransform: 'none', fontWeight: 500, py: 1.2 }}>Accept Order</Button>
                          <Button variant="outlined" startIcon={<Cancel />} onClick={() => updateTableOrderStatus(order, 'DECLINED')} sx={{ borderColor: '#d32f2f', color: '#d32f2f', '&:hover': { borderColor: '#c62828', backgroundColor: '#ffebee' }, textTransform: 'none', fontWeight: 500, py: 1.2, minWidth: '120px' }}>Decline</Button>
                        </>
                      )}
                      {tableStatus === 'in-progress' && (
                        <Button variant="contained" startIcon={<CheckCircle />} onClick={() => updateTableOrderStatus(order, 'COMPLETED')} fullWidth sx={{ backgroundColor: '#388e3c', '&:hover': { backgroundColor: '#2e7d32' }, textTransform: 'none', fontWeight: 500, py: 1.2 }}>Mark Complete</Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default ChefDashboard;

