import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
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
  Container,
  useTheme,
  useMediaQuery,
  Grid,
  Avatar,
  alpha,
  LinearProgress,
  TextField,
  InputAdornment,
  Collapse,
} from '@mui/material';
import {
  Timer,
  Restaurant,
  CheckCircle,
  Cancel,
  Refresh,
  AccessTime,
  Person,
  Search,
  Clear,
  ExpandMore,
  ExpandLess,
  ThumbUp,
  Close,
  PlayArrow,
  Done,
  Kitchen,
  TrendingUp,
  Schedule,
  TableRestaurant,
  LocalDining,
} from '@mui/icons-material';
import { useWebSocket } from '@/hooks/useWebSocket';
import orderService from '@/services/api/order.service';
import authService from '@/services/api/auth.service';
import { KitchenOrder, OrderStatus } from '@/types/order.types';
import toast from 'react-hot-toast';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  gradient: string;
  isMobile: boolean;
}

const StatsCard = React.memo(({ title, value, icon, gradient, isMobile }: StatsCardProps) => (
  <Paper
    elevation={0}
    sx={{
      p: isMobile ? 1.5 : 2,
      background: gradient,
      color: 'white',
      borderRadius: 2,
      position: 'relative',
      overflow: 'hidden',
      minHeight: 80,
    }}
  >
    <Box sx={{ position: 'relative', zIndex: 1 }}>
      <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
        {title}
      </Typography>
      <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold" sx={{ lineHeight: 1 }}>
        {value}
      </Typography>
    </Box>
    <Box sx={{ position: 'absolute', right: -5, bottom: -5, fontSize: 40, opacity: 0.15 }}>
      {icon}
    </Box>
  </Paper>
));

interface OrderCardProps {
  order: KitchenOrder;
  onUpdateStatus: (itemId: number, status: OrderStatus) => void;
  onUpdateTableStatus: (order: KitchenOrder, status: OrderStatus) => void;
  onToggleExpand: (orderId: number) => void;
  isExpanded: boolean;
  getOrderAge: (createdAt: string) => string;
  getOrderPriority: (createdAt: string) => 'high' | 'medium' | 'low';
  getTableStatus: (order: KitchenOrder) => 'pending' | 'in-progress' | 'ready';
  theme: any;
}

const OrderCard = React.memo(({
  order,
  onUpdateStatus,
  onUpdateTableStatus,
  getOrderAge,
  getOrderPriority,
  getTableStatus,
  theme
}: OrderCardProps) => {
  const priority = getOrderPriority(order.created_at);
  const tableStatus = getTableStatus(order);
  const pendingItems = order.order_items.filter(item => item.status === 'PENDING');
  const acceptedItems = order.order_items.filter(item => item.status === 'ACCEPTED');
  const completedItems = order.order_items.filter(item => item.status === 'COMPLETED');
  const totalItems = order.order_items.length;
  const progressPercentage = ((acceptedItems.length + completedItems.length) / totalItems) * 100;

  const priorityColors = {
    high: { bg: '#ffebee', color: '#c62828', icon: '🔥' },
    medium: { bg: '#fff3e0', color: '#f57c00', icon: '⚡' },
    low: { bg: '#e8f5e8', color: '#388e3c', icon: '🆕' }
  };

  const statusColors = {
    pending: { bg: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main },
    'in-progress': { bg: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main },
    ready: { bg: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: priority === 'high' ? theme.palette.error.main : theme.palette.divider,
        background: 'white',
        position: 'relative',
        overflow: 'hidden',
        height: 'fit-content',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          transform: 'translateY(-1px)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: priority === 'high' 
            ? `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`
            : priority === 'medium'
            ? `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`
            : `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
        },
      }}
    >
      {/* Progress Bar */}
      <LinearProgress
        variant="determinate"
        value={progressPercentage}
        sx={{
          height: 2,
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          '& .MuiLinearProgress-bar': {
            backgroundColor: theme.palette.primary.main,
          },
        }}
      />

      <CardContent sx={{ p: 2 }}>
        {/* Compact Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              sx={{
                width: 32,
                height: 32,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                fontSize: '0.9rem',
                fontWeight: 'bold',
              }}
            >
              {order.table_number}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight="700" color="primary.main" sx={{ lineHeight: 1 }}>
                Table {order.table_number}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {order.customer_name}
              </Typography>
            </Box>
          </Stack>
          
          <Stack spacing={0.5} alignItems="flex-end">
            <Chip
              size="small"
              label={priority.toUpperCase()}
              sx={{
                background: priorityColors[priority].bg,
                color: priorityColors[priority].color,
                fontWeight: 600,
                fontSize: '0.65rem',
                height: 18,
                '& .MuiChip-label': { px: 1 }
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {getOrderAge(order.created_at)}
            </Typography>
          </Stack>
        </Stack>

        {/* Compact Status */}
        <Box sx={{ 
          p: 1, 
          borderRadius: 1.5, 
          background: statusColors[tableStatus].bg,
          border: '1px solid',
          borderColor: statusColors[tableStatus].color,
          mb: 1.5
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" fontWeight="700" color={statusColors[tableStatus].color} sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
              {tableStatus === 'in-progress' ? 'In Progress' : tableStatus}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {completedItems.length + acceptedItems.length}/{totalItems}
            </Typography>
          </Stack>
        </Box>

        {/* Always Visible Items List */}
        <Box sx={{ 
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.5,
          overflow: 'hidden',
          background: alpha(theme.palette.grey[50], 0.3),
          mb: 1.5
        }}>
          <Box sx={{ 
            p: 1, 
            background: alpha(theme.palette.grey[100], 0.5),
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="caption" fontWeight="600" color="text.primary" sx={{ fontSize: '0.7rem' }}>
              Order Items ({totalItems})
            </Typography>
          </Box>
          
          <Box sx={{ maxHeight: 120, overflowY: 'auto' }}>
            {order.order_items.map((item, index) => {
              // Create stable key: prefer item.id, fallback to composite
              const itemKey = item.id ? `item-${item.id}` : `${order.id}-${item.name.toLowerCase()}-${item.variant_name?.toLowerCase() || 'default'}-${index}`;
              
              return (
                <Box
                  key={itemKey}
                  sx={{
                    p: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: index < order.order_items.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    minHeight: 32
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
                    <Typography variant="caption" fontWeight="600" color="text.primary" noWrap sx={{ fontSize: '0.7rem' }}>
                      {item.name}
                    </Typography>
                    {item.variant_name && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>
                        {item.variant_name} × {item.quantity}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Chip
                      label={item.status}
                      size="small"
                      sx={{
                        backgroundColor: 
                          item.status === 'PENDING' ? alpha(theme.palette.warning.main, 0.1) :
                          item.status === 'ACCEPTED' ? alpha(theme.palette.info.main, 0.1) :
                          item.status === 'COMPLETED' ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                        color:
                          item.status === 'PENDING' ? theme.palette.warning.main :
                          item.status === 'ACCEPTED' ? theme.palette.info.main :
                          item.status === 'COMPLETED' ? theme.palette.success.main : theme.palette.error.main,
                        fontWeight: 600,
                        fontSize: '0.6rem',
                        height: 18,
                        minWidth: '60px',
                        '& .MuiChip-label': { px: 0.5 }
                      }}
                    />
                    {item.status === 'PENDING' && (
                      <Stack direction="row" spacing={0.25}>
                        <Tooltip title="Accept">
                          <IconButton 
                            size="small"
                            onClick={() => onUpdateStatus(item.id, 'ACCEPTED')}
                            sx={{ 
                              color: theme.palette.info.main,
                              width: 20,
                              height: 20,
                              '&:hover': { backgroundColor: alpha(theme.palette.info.main, 0.1) }
                            }}
                          >
                            <ThumbUp sx={{ fontSize: 12 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Decline">
                          <IconButton 
                            size="small"
                            onClick={() => onUpdateStatus(item.id, 'DECLINED')}
                            sx={{ 
                              color: theme.palette.error.main,
                              width: 20,
                              height: 20,
                              '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) }
                            }}
                          >
                            <Close sx={{ fontSize: 12 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    )}
                    {item.status === 'ACCEPTED' && (
                      <Tooltip title="Complete">
                        <IconButton 
                          size="small"
                          onClick={() => onUpdateStatus(item.id, 'COMPLETED')}
                          sx={{ 
                            color: theme.palette.success.main,
                            width: 20,
                            height: 20,
                            '&:hover': { backgroundColor: alpha(theme.palette.success.main, 0.1) }
                          }}
                        >
                          <Done sx={{ fontSize: 12 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Compact Action Buttons */}
        <Stack direction="row" spacing={1}>
          {pendingItems.length > 0 && (
            <>
              <Button
                variant="contained"
                startIcon={<PlayArrow sx={{ fontSize: 14 }} />}
                onClick={() => onUpdateTableStatus(order, 'ACCEPTED')}
                size="small"
                fullWidth
                sx={{
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  py: 0.75,
                  background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                }}
              >
                Accept
              </Button>
              <Button
                variant="outlined"
                startIcon={<Cancel sx={{ fontSize: 14 }} />}
                onClick={() => onUpdateTableStatus(order, 'DECLINED')}
                size="small"
                sx={{
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  py: 0.75,
                  borderColor: theme.palette.error.main,
                  color: theme.palette.error.main,
                  minWidth: 80,
                  '&:hover': {
                    borderColor: theme.palette.error.dark,
                    backgroundColor: alpha(theme.palette.error.main, 0.04),
                  },
                }}
              >
                Decline
              </Button>
            </>
          )}
          {tableStatus === 'in-progress' && (
            <Button
              variant="contained"
              startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
              onClick={() => onUpdateTableStatus(order, 'COMPLETED')}
              size="small"
              fullWidth
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.7rem',
                py: 0.75,
                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              }}
            >
              Complete
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
});

const LoadingSkeleton = React.memo(() => {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Grid size={{ xs: 12, lg: 6, xl: 4 }} key={index}>
          <Card sx={{ borderRadius: 3, height: 420 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} mb={2}>
                <CircularProgress size={48} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">Loading...</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fetching order details
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
});

const ChefDashboard: React.FC = () => {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState<string>('');
  const [wsConnected, setWsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const ordersRef = useRef<KitchenOrder[]>([]);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // Get restaurant slug from user context
  useEffect(() => {
    const getRestaurantSlug = async () => {
      try {
        const user = authService.getCurrentUser();
        const token = localStorage.getItem('token');
        let decodedToken = null;
        try {
          decodedToken = token ? JSON.parse(atob(token.split('.')[1])) : null;
        } catch {
          decodedToken = null;
        }
        
        let slug = '';
        if (user?.restaurant?.slug) {
          slug = user.restaurant.slug;
        } else if (decodedToken?.restaurant_slug) {
          slug = decodedToken.restaurant_slug;
        } else {
          slug = 'md-hotel'; // Fallback
        }
        
        setRestaurantSlug(slug);
      } catch (error) {
        console.error('Failed to get restaurant slug:', error);
        setRestaurantSlug('md-hotel');
      }
    };
    
    getRestaurantSlug();
  }, []);

  // Helper functions for order normalization and merging
  const normalizeOrder = useCallback((payload: any): KitchenOrder => {
    const orderId = payload.id || payload.bill_id;
    if (!orderId) {
      throw new Error('Order must have an id or bill_id');
    }

    return {
      id: orderId,
      table_number: String(payload.table_number || ''),
      customer_name: String(payload.customer_name || 'Walk-in Customer'),
      created_at: payload.created_at || new Date().toISOString(),
      order_items: (payload.order_items || payload.items || []).map((item: any) => ({
        id: item.id || item.order_item_id,
        name: item.name || item.menu_item?.name || 'Item',
        variant_name: item.variant_name || item.variant || '',
        quantity: Number(item.quantity || 1),
        status: (item.status as OrderStatus) || 'PENDING',
      })),
    };
  }, []);

  const mergeOrderItems = useCallback((existing: KitchenOrder['order_items'], incomingItems: KitchenOrder['order_items']): KitchenOrder['order_items'] => {
    const itemMap = new Map<string, any>();
    
    // Create unique key for each item
    const keyOf = (item: any) => {
      if (item.id) return `id:${item.id}`;
      return `comp:${(item.name || '').toLowerCase()}|${(item.variant_name || '').toLowerCase()}`;
    };
    
    // Add existing items
    for (const item of existing) {
      itemMap.set(keyOf(item), item);
    }
    
    // Merge incoming items
    for (const item of incomingItems) {
      const key = keyOf(item);
      if (itemMap.has(key)) {
        // Update existing item (preserve original creation time)
        const existingItem = itemMap.get(key);
        itemMap.set(key, {
          ...existingItem,
          quantity: item.quantity || existingItem.quantity,
          status: item.status || existingItem.status,
        });
      } else {
        // Add new item
        itemMap.set(key, item);
      }
    }
    
    return Array.from(itemMap.values());
  }, []);

  const handleWebSocketMessage = useCallback((data: any) => {
    try {
      console.log('WebSocket message received:', data);
      
      const messageType = data.type;
      const payload = data.order || data.data || data;
      
      if (!payload) {
        console.log('No payload found in message');
        return;
      }

      try {
        const incomingOrder = normalizeOrder(payload);
        
        setOrders(prevOrders => {
          const existingIndex = prevOrders.findIndex(o => o.id === incomingOrder.id);
          
          if (existingIndex === -1) {
            // Only add as new order for specific message types
            if (messageType === 'new_order' || messageType === 'order_created' || !messageType) {
              const newOrders = [incomingOrder, ...prevOrders];
              return newOrders.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
            }
            // Ignore updates for non-existing orders
            return prevOrders;
          }
          
          // Merge with existing order
          const existingOrder = prevOrders[existingIndex];
          const mergedItems = mergeOrderItems(existingOrder.order_items, incomingOrder.order_items);
          
          const updatedOrder: KitchenOrder = {
            ...existingOrder,
            customer_name: incomingOrder.customer_name || existingOrder.customer_name,
            table_number: incomingOrder.table_number || existingOrder.table_number,
            order_items: mergedItems,
            // Keep original created_at
            created_at: existingOrder.created_at,
          };
          
          const newOrders = [...prevOrders];
          newOrders[existingIndex] = updatedOrder;
          return newOrders;
        });

        // Show appropriate toast
        if (messageType === 'new_order' || messageType === 'order_created') {
          toast.success(`New order from Table ${incomingOrder.table_number}`, { duration: 2000 });
        } else if (messageType === 'order_items_added') {
          toast.success(`Items added to Table ${incomingOrder.table_number}`, { duration: 2000 });
        }
        
      } catch (normalizeError) {
        console.error('Error normalizing order:', normalizeError);
      }
      
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }, [normalizeOrder, mergeOrderItems]);

  useWebSocket({
    role: 'CHEF',
    restaurantSlug: restaurantSlug,
    onMessage: handleWebSocketMessage,
    onConnect: () => setWsConnected(true),
    onDisconnect: () => setWsConnected(false),
    onError: (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    },
    enabled: !!restaurantSlug,
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = authService.getToken();
      if (!token) {
        toast.error('Please log in to access kitchen orders');
        return;
      }

      const data = await orderService.getKitchenOrders();
      
      const activeOrders = data.filter(order =>
        order.order_items.some(
          item => item.status === 'PENDING' || item.status === 'ACCEPTED'
        )
      );
      
      const sortedOrders = activeOrders.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setOrders(sortedOrders);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      
      if (error?.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else if (error?.response?.status === 403) {
        toast.error('Access denied. Check your permissions.');
      } else {
        setError('Failed to fetch orders. Please try again.');
        toast.error('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (restaurantSlug) {
      fetchOrders();
    }
  }, [restaurantSlug, fetchOrders]);

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
      
      toast.success(`Item ${status.toLowerCase()}`);
    } catch (error) {
      toast.error('Failed to update item status');
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
        prev.filter(o =>
          o.order_items.some(
            item => item.status === 'PENDING' || item.status === 'ACCEPTED'
          )
        )
      );
      
      toast.success(`Table ${order.table_number} order ${status.toLowerCase()}`);
    } catch (error) {
      toast.error('Failed to update order status');
      console.error('Error updating status:', error);
    }
  };

  const toggleOrderExpansion = useCallback((orderId: number) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }, []);

  const getOrderAge = useCallback((createdAt: string): string => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  }, []);

  const getOrderPriority = useCallback((createdAt: string): 'high' | 'medium' | 'low' => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (minutes > 15) return 'high';
    if (minutes > 10) return 'medium';
    return 'low';
  }, []);

  const getTableStatus = useCallback((order: KitchenOrder): 'pending' | 'in-progress' | 'ready' => {
    const hasAccepted = order.order_items.some(item => item.status === 'ACCEPTED');
    const allCompleted = order.order_items.every(item => item.status === 'COMPLETED');
    if (allCompleted) return 'ready';
    if (hasAccepted) return 'in-progress';
    return 'pending';
  }, []);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    
    const query = searchQuery.toLowerCase();
    return orders.filter(order => 
      order.id.toString().includes(query) ||
      order.table_number.toLowerCase().includes(query) ||
      order.customer_name.toLowerCase().includes(query) ||
      order.order_items.some(item => item.name.toLowerCase().includes(query))
    );
  }, [orders, searchQuery]);

  const statsData = useMemo(() => {
    const pendingOrders = filteredOrders.filter(order => 
      order.order_items.some(item => item.status === 'PENDING')
    ).length;
    
    const inProgressOrders = filteredOrders.filter(order => 
      order.order_items.some(item => item.status === 'ACCEPTED')
    ).length;
    
    const urgentOrders = filteredOrders.filter(order => 
      getOrderPriority(order.created_at) === 'high'
    ).length;

    return {
      totalOrders: filteredOrders.length,
      pendingOrders,
      inProgressOrders,
      urgentOrders
    };
  }, [filteredOrders, getOrderPriority]);

  const StatsSummary = useMemo(() => (
    <Grid container spacing={isMobile ? 1.5 : 2} sx={{ mb: 3 }}>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatsCard
          title="Active Orders"
          value={statsData.totalOrders}
          icon={<Kitchen />}
          gradient={`linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`}
          isMobile={isMobile}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatsCard
          title="Pending"
          value={statsData.pendingOrders}
          icon={<Schedule />}
          gradient={`linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`}
          isMobile={isMobile}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatsCard
          title="In Progress"
          value={statsData.inProgressOrders}
          icon={<TrendingUp />}
          gradient={`linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`}
          isMobile={isMobile}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatsCard
          title="Urgent"
          value={statsData.urgentOrders}
          icon={<Timer />}
          gradient={`linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`}
          isMobile={isMobile}
        />
      </Grid>
    </Grid>
  ), [statsData, theme, isMobile]);

  if (loading && orders.length === 0) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: '#f5f6fa',
      }}>
        <Container maxWidth="xl" sx={{ py: isMobile ? 2 : 3 }}>
          <LoadingSkeleton />
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: '#f5f6fa',
    }}>
      <Container maxWidth="xl" sx={{ py: isMobile ? 2 : 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Stack 
            direction={isMobile ? 'column' : 'row'} 
            justifyContent="space-between" 
            alignItems={isMobile ? 'stretch' : 'center'}
            spacing={2}
          >
            <Box>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box>
                  <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="700" gutterBottom>
                    Kitchen Dashboard
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage and track all incoming orders
                  </Typography>
                </Box>
                {/* WebSocket Connection Status */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    icon={wsConnected ? <CheckCircle sx={{ fontSize: 14 }} /> : <Timer sx={{ fontSize: 14 }} />}
                    label={wsConnected ? "Live" : "Connecting..."}
                    color={wsConnected ? "success" : "warning"}
                    variant="outlined"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      height: 22,
                    }}
                  />
                  {restaurantSlug && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      ({restaurantSlug})
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchOrders}
              disabled={loading}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Refresh Orders
            </Button>
          </Stack>
        </Box>

        {/* Stats Summary */}
        {!loading && StatsSummary}

        {/* Search Section */}
        {!loading && (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search orders by table, customer, or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="medium"
              sx={{ 
                backgroundColor: 'white', 
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setSearchQuery('')}
                      size="small"
                    >
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {searchQuery && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 1 }}>
                Found {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </Typography>
            )}
          </Box>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Connection Status Alert */}
        {!wsConnected && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            Live updates are not available. New orders won't appear automatically. Please check your network connection.
          </Alert>
        )}

        {/* Main Content */}
        {filteredOrders.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: isMobile ? 4 : 6,
              textAlign: 'center',
              borderRadius: 3,
              border: '1px dashed',
              borderColor: 'divider',
              background: 'white',
            }}
          >
            <LocalDining sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom color="text.secondary">
              {searchQuery ? 'No Orders Found' : 'No Active Orders'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery 
                ? 'Try adjusting your search terms or clear the search to see all orders.' 
                : 'New orders will appear here automatically when they come in.'
              }
            </Typography>
            {searchQuery && (
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={() => setSearchQuery('')}
                sx={{ mt: 2, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Clear Search
              </Button>
            )}
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredOrders.map((order) => (
              <Grid size={{ xs: 12, lg: 6, xl: 4 }} key={order.id}>
                <OrderCard
                  order={order}
                  onUpdateStatus={updateOrderStatus}
                  onUpdateTableStatus={updateTableOrderStatus}
                  onToggleExpand={toggleOrderExpansion}
                  isExpanded={expandedOrders.has(order.id)}
                  getOrderAge={getOrderAge}
                  getOrderPriority={getOrderPriority}
                  getTableStatus={getTableStatus}
                  theme={theme}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default React.memo(ChefDashboard);
