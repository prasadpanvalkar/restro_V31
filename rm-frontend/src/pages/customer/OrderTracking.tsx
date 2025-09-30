import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, Grid, Card, CardContent, Button, Chip,
  LinearProgress, List, ListItem, ListItemText, Divider, Alert, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Stack,
  Avatar, Badge, Stepper, Step, StepLabel, Fade, Zoom, Pulse,
  TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Collapse, useMediaQuery, useTheme // 🔥 ADDED: Mobile detection
} from '@mui/material';
import {
  Timer, CheckCircle, Restaurant, ShoppingCart, Add, Remove, AccessTime, Receipt,
  Kitchen, LocalDining, Notifications, PlayArrow, Schedule, DoneAll, 
  RadioButtonUnchecked, RadioButtonChecked, RestaurantMenu, Wifi, WifiOff,
  Clear, Search, FilterList, ExpandMore, ExpandLess // 🔥 ADDED: Mobile icons
} from '@mui/icons-material';
import { useWebSocket } from '@/hooks/useWebSocket';
import menuService from '@/services/api/menu.service';
import orderService from '@/services/api/order.service';
import { PublicMenuItem } from '@/types/menu.types';
import toast from 'react-hot-toast';
import { OrderSessionManager, SessionOrder } from '@/utils/orderSession';

// 🔥 ENHANCED: Mobile-Optimized Order Status Component
const OrderStatusCard: React.FC<{ item: any, timer: number }> = ({ item, timer }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // 🔥 Mobile detection
  
  // Handle multiple possible ID field names
  const itemId = item?.id || item?.order_item_id || item?.item_id;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: <Schedule sx={{ fontSize: isMobile ? 20 : 28 }} />, // 🔥 Responsive icon size
          color: '#ff9800',
          bgColor: '#fff3e0',
          label: 'Order Received',
          description: 'Your order is being reviewed by the kitchen'
        };
      case 'ACCEPTED':
        return {
          icon: <Kitchen sx={{ fontSize: isMobile ? 20 : 28 }} />,
          color: '#2196f3',
          bgColor: '#e3f2fd',
          label: 'Preparing',
          description: 'Your order is being prepared'
        };
      case 'COMPLETED':
        return {
          icon: <DoneAll sx={{ fontSize: isMobile ? 20 : 28 }} />,
          color: '#4caf50',
          bgColor: '#e8f5e8',
          label: 'Ready!',
          description: 'Your order is ready for pickup'
        };
      default:
        return {
          icon: <RadioButtonUnchecked sx={{ fontSize: isMobile ? 20 : 28 }} />,
          color: '#9e9e9e',
          bgColor: '#f5f5f5',
          label: 'Unknown',
          description: ''
        };
    }
  };

  const config = getStatusConfig(item?.status || 'Unknown');
  
  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "Ready soon!";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const shouldShowTimer = item?.status === 'ACCEPTED' && timer > 0;

  return (
    <Card 
      elevation={2} // 🔥 Reduced elevation for mobile
      sx={{ 
        mb: isMobile ? 1.5 : 2, // 🔥 Responsive margin
        borderLeft: `${isMobile ? 4 : 6}px solid ${config.color}`, // 🔥 Responsive border
        transition: 'all 0.3s ease',
        '&:hover': { 
          transform: isMobile ? 'none' : 'translateY(-2px)', // 🔥 No hover on mobile
          boxShadow: isMobile ? 2 : 6 
        },
      }}
    >
      <CardContent sx={{ p: isMobile ? 2 : 3 }}> {/* 🔥 Responsive padding */}
        {/* 🔥 MOBILE-OPTIMIZED: Stacked layout on mobile */}
        <Box 
          display="flex" 
          flexDirection={isMobile ? "column" : "row"} // 🔥 Stack on mobile
          alignItems={isMobile ? "flex-start" : "center"}
          justifyContent="space-between" 
          gap={isMobile ? 1 : 2}
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={isMobile ? 1.5 : 2}>
            <Avatar sx={{ 
              bgcolor: config.bgColor, 
              color: config.color, 
              width: isMobile ? 40 : 50, // 🔥 Responsive avatar
              height: isMobile ? 40 : 50 
            }}>
              {config.icon}
            </Avatar>
            <Box>
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} // 🔥 Responsive typography
                fontWeight="bold" 
                color={config.color}
              >
                {item?.name || item?.menu_item?.name || 'Unknown Item'}
              </Typography>
              <Typography 
                variant={isMobile ? "caption" : "body2"} 
                color="text.secondary"
              >
                {item?.variant_name || 'N/A'} • Qty: {item?.quantity || 0}
              </Typography>
            </Box>
          </Box>
          <Chip 
            label={config.label}
            size={isMobile ? "small" : "medium"} // 🔥 Responsive chip size
            sx={{ 
              backgroundColor: config.bgColor,
              color: config.color,
              fontWeight: 'bold',
              fontSize: isMobile ? '0.75rem' : '0.9rem',
              height: isMobile ? 28 : 32,
              alignSelf: isMobile ? 'flex-start' : 'center' // 🔥 Mobile alignment
            }}
          />
        </Box>

        {/* 🔥 MOBILE: Hide description on very small screens */}
        {!isMobile && (
          <Typography variant="body2" color="text.secondary" mb={2}>
            {config.description}
          </Typography>
        )}

        {/* 🔥 MOBILE-OPTIMIZED: Timer display */}
        {shouldShowTimer && (
          <Box sx={{ 
            p: isMobile ? 1.5 : 2, 
            backgroundColor: '#e3f2fd', 
            borderRadius: 2,
            border: '2px solid #2196f3'
          }}>
            <Box 
              display="flex" 
              flexDirection={isMobile ? "column" : "row"} // 🔥 Stack timer on mobile
              alignItems={isMobile ? "center" : "center"} 
              justifyContent="space-between" 
              mb={1}
              gap={isMobile ? 0.5 : 0}
            >
              <Typography 
                variant={isMobile ? "caption" : "body2"} 
                fontWeight="bold" 
                color="#1976d2"
                textAlign={isMobile ? "center" : "left"}
              >
                Estimated Time Remaining
              </Typography>
              <Typography 
                variant={isMobile ? "h6" : "h5"} // 🔥 Smaller timer on mobile
                fontWeight="bold" 
                color="#1976d2"
              >
                {formatTime(timer)}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={Math.max(0, 100 - (timer / ((item?.preparation_time || 15) * 60)) * 100)}
              sx={{ 
                height: isMobile ? 6 : 8, // 🔥 Thinner progress bar on mobile
                borderRadius: 4,
                backgroundColor: '#bbdefb',
                '& .MuiLinearProgress-bar': { backgroundColor: '#1976d2' }
              }} 
            />
            <Typography 
              variant="caption" 
              color="#1976d2" 
              sx={{ 
                mt: 1, 
                display: 'block', 
                textAlign: 'center',
                fontSize: isMobile ? '0.7rem' : '0.75rem' // 🔥 Smaller text on mobile
              }}
            >
              Preparation time: {item?.preparation_time || 15} minutes
            </Typography>
          </Box>
        )}

        {item?.status === 'COMPLETED' && (
          <Alert 
            severity="success" 
            icon={<DoneAll sx={{ fontSize: isMobile ? 18 : 24 }} />}
            sx={{ 
              backgroundColor: '#e8f5e8',
              '& .MuiAlert-icon': { fontSize: isMobile ? 18 : 24 },
              fontSize: isMobile ? '0.8rem' : '0.875rem' // 🔥 Responsive text
            }}
          >
            <Typography fontWeight="bold" fontSize={isMobile ? '0.8rem' : '0.875rem'}>
              Ready for pickup!
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

// Main component
const OrderTracking: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // 🔥 Mobile detection
  const isTablet = useMediaQuery(theme.breakpoints.down('md')); // 🔥 Tablet detection
  
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
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [wsConnected, setWsConnected] = useState(false);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // --- Component Initialization ---
  useEffect(() => {
    const stateData = location.state as SessionOrder;
    const sessionData = OrderSessionManager.getOrder();
    const initialOrder = stateData?.orderId ? stateData : sessionData;

    console.log('🔍 DEBUGGING ORDER DATA:');
    console.log('- State data:', stateData);
    console.log('- Session data:', sessionData);
    console.log('- Initial order:', initialOrder);
    console.log('- restaurantSlug from params:', restaurantSlug);

    if (initialOrder) {
      // Ensure items array exists and is an array
      if (!initialOrder.items || !Array.isArray(initialOrder.items)) {
        console.warn('⚠️ Order found but items is not an array. Setting empty array.');
        initialOrder.items = [];
      }

      console.log('📋 ORDER ITEMS STRUCTURE:');
      initialOrder.items.forEach((item: any, index: number) => {
        console.log(`Item ${index}:`, {
          id: item?.id,
          name: item?.name,
          status: item?.status,
          variant_name: item?.variant_name,
          quantity: item?.quantity,
          preparation_time: item?.preparation_time,
          fullItem: item
        });
      });
      setOrder(initialOrder);
    } else {
      console.log('❌ No order found, redirecting to menu');
      navigate(`/menu/${restaurantSlug}`);
    }

    if (restaurantSlug) {
      menuService.getPublicMenu(restaurantSlug)
        .then(setMenuItems)
        .catch(err => console.error('Failed to fetch menu:', err));
    }
  }, [location.state, restaurantSlug, navigate]);

  // --- WebSocket Logic ---
  const handleWebSocketMessage = useCallback((data: any) => {
    console.log('🔄 WebSocket message received in OrderTracking:', data);
    
    // Handle individual item status updates
    if (data.type === 'order_status_update' && data.order_item_id && data.status) {
      console.log('📦 Processing order status update:', {
        itemId: data.order_item_id,
        newStatus: data.status,
        itemName: data.item_name,
        preparationTime: data.preparation_time
      });
      
      setOrder(prevOrder => {
        if (!prevOrder?.items || !Array.isArray(prevOrder.items)) {
          console.log('❌ No current order or items to update');
          return prevOrder;
        }
        
        console.log('🔍 Current order items before update:', prevOrder.items.map(item => ({
          id: item?.id,
          name: item?.name,
          status: item?.status,
          fullStructure: item
        })));
        
        let foundMatch = false;
        const updatedItems = prevOrder.items.map((item: any) => {
          // Try multiple possible ID fields since there might be inconsistency
          const itemId = item?.id || item?.order_item_id || item?.item_id;
          console.log(`🔍 Checking item: itemId=${itemId}, order_item_id=${data.order_item_id}, name=${item?.name}`);
          
          if (itemId === data.order_item_id) {
            foundMatch = true;
            console.log(`✅ MATCH FOUND! Updating item ${itemId} (${item?.name}) from ${item?.status} to ${data.status}`);
            const updatedItem = { 
              ...item, 
              id: itemId, // Ensure ID is set
              status: data.status, 
              preparation_time: data.preparation_time || item?.preparation_time || 15
            };
            console.log('📝 Updated item details:', updatedItem);
            return updatedItem;
          }
          return item;
        });
        
        if (!foundMatch) {
          console.log(`❌ NO MATCH FOUND for order_item_id: ${data.order_item_id}`);
          console.log(`Available item IDs: [${prevOrder.items.map(item => item?.id || item?.order_item_id || 'undefined').join(', ')}]`);
          console.log('Full items structure:', prevOrder.items);
        }
        
        const updatedOrder = { ...prevOrder, items: updatedItems };
        console.log('💾 Saving updated order to session storage');
        OrderSessionManager.saveOrder(updatedOrder);
        setLastUpdate(new Date());
        return updatedOrder;
      });
      
      // Enhanced notifications with more details
      if (data.status === 'ACCEPTED') {
        const prepTime = data.preparation_time ? ` (${data.preparation_time} minutes)` : '';
        toast.success(`🔥 "${data.item_name}" is now being prepared!${prepTime}`, {
          duration: 4000,
          style: { backgroundColor: '#e3f2fd', color: '#1976d2', fontSize: '14px' }
        });
        console.log('🎉 Showed ACCEPTED notification');
      } else if (data.status === 'COMPLETED') {
        toast.success(`🎉 "${data.item_name}" is ready for pickup!`, { 
          icon: '🍽️',
          duration: 6000,
          style: { backgroundColor: '#e8f5e8', color: '#2e7d32', fontSize: '14px' }
        });
        console.log('🎉 Showed COMPLETED notification');
      }
    }
    // Handle full order updates when new items are added
    else if (data.type === 'order_updated' && data.order) {
      console.log('🔄 Processing full order update:', data.order);
      
      setOrder(prevOrder => {
        if (!prevOrder) {
          console.log('❌ No previous order to update');
          return null;
        }
        
        const updatedOrder = {
          ...prevOrder,
          ...data.order,
          items: data.order.items || data.order.order_items || []
        };
        
        console.log('💾 Saving full updated order to session storage');
        OrderSessionManager.saveOrder(updatedOrder);
        setLastUpdate(new Date());
        return updatedOrder;
      });
      
      toast.success('Order updated successfully!', {
        duration: 3000,
        style: { backgroundColor: '#e8f5e8', color: '#2e7d32', fontSize: '14px' }
      });
    }
    else {
      console.log('❓ Unhandled WebSocket message or missing required fields:', data);
    }
  }, []);

  // WebSocket connection
  const { sendMessage, isConnected } = useWebSocket({
    role: 'CUSTOMER' as any,
    restaurantSlug: restaurantSlug || order?.restaurantSlug || '',
    billId: order?.orderId ? Number(order.orderId) : undefined,
    onMessage: handleWebSocketMessage,
    enabled: !!order && !!order.orderId && !!(restaurantSlug || order?.restaurantSlug),
    onConnect: () => {
      setWsConnected(true);
      console.log('✅ WebSocket connected for order tracking. URL:', `ws://localhost:8000/ws/customer/${order?.orderId}/`);
      toast.success('🟢 Connected - Live updates enabled', { duration: 2000 });
    },
    onDisconnect: () => {
      setWsConnected(false);
      console.log('❌ WebSocket disconnected');
      toast.error('🔴 Disconnected - No live updates', { duration: 3000 });
    },
    onError: (error: any) => {
      console.error('⚠️ WebSocket error:', error);
      toast.error('⚠️ Connection error - Check network', { duration: 3000 });
    },
  });

  // Timer Logic (same as before - keeping it unchanged)
  useEffect(() => {
    if (!order?.items || !Array.isArray(order.items)) {
      console.log('⚠️ Timer effect: No order or items array, skipping timer setup');
      return;
    }
    
    console.log('🕐 Timer effect running. Current order items:', order.items.map(item => ({
      id: item?.id,
      name: item?.name || item?.menu_item?.name,
      status: item?.status,
      prep_time: item?.preparation_time
    })));
    console.log('🕐 Current timers state:', timers);
    
    const activeTimerIDs: NodeJS.Timeout[] = [];
    const newTimers: { [itemId: number]: number } = {};
    
    order.items.forEach((item: any) => {
      if (!item) return; // Skip null/undefined items
      
      // Handle multiple possible ID field names
      const itemId = item.id || item.order_item_id || item.item_id;
      const prepTime = item.preparation_time || 15; // Default 15 minutes
      
      console.log(`🔍 Checking item ${itemId} (${item?.name || item?.menu_item?.name}): status=${item?.status}, hasTimer=${itemId in timers}, prep_time=${prepTime}`);
      
      // Start timer for newly accepted items OR maintain existing timers
      if (item.status === 'ACCEPTED' && itemId && prepTime > 0) {
        // Use existing timer value or start new one
        const remainingSeconds = timers[itemId] !== undefined ? timers[itemId] : prepTime * 60;
        
        if (!(itemId in timers)) {
          console.log(`⏰ Starting NEW timer for item ${itemId} (${item?.name || item?.menu_item?.name}): ${remainingSeconds} seconds`);
          
          toast.success(`⏰ Timer started for "${item?.name}" - ${prepTime} minutes`, {
            duration: 3000,
            style: { backgroundColor: '#e3f2fd', color: '#1976d2' }
          });
        } else {
          console.log(`⏰ Continuing existing timer for item ${itemId}: ${remainingSeconds} seconds`);
        }
        
        newTimers[itemId] = remainingSeconds;
        
        // Only create new interval if timer doesn't exist
        if (!(itemId in timers)) {
          const timerId = setInterval(() => {
            setTimers(prevTimers => {
              const currentTime = prevTimers[itemId] || 0;
              const newTime = Math.max(0, currentTime - 1); // Ensure non-negative
              console.log(`⏱️ Timer tick for item ${itemId}: ${currentTime} -> ${newTime}`);
              
              if (newTime <= 0) {
                console.log(`⏰ Timer finished for item ${itemId}`);
                clearInterval(timerId);
                toast.info(`⏰ Estimated time for "${item?.name}" has passed!`, {
                  duration: 4000,
                  style: { backgroundColor: '#fff3e0', color: '#f57c00' }
                });
                return { ...prevTimers, [itemId]: 0 };
              }
              return { ...prevTimers, [itemId]: newTime };
            });
          }, 1000);
          
          activeTimerIDs.push(timerId);
        }
      }
      
      // Clear timer for completed items
      else if (item.status === 'COMPLETED' && itemId && itemId in timers) {
        console.log(`🛑 Clearing timer for completed item ${itemId}`);
        toast.success(`✅ "${item?.name}" is ready!`, {
          duration: 3000,
          style: { backgroundColor: '#e8f5e8', color: '#2e7d32' }
        });
        // Don't add to newTimers - this will remove it
      }
    });
    
    // Update timers state with new timers (preserving existing ones)
    setTimers(prevTimers => {
      const updatedTimers = { ...prevTimers };
      
      // Remove completed items
      Object.keys(updatedTimers).forEach(key => {
        const itemId = parseInt(key);
        const item = order.items.find((item: any) => 
          (item.id || item.order_item_id || item.item_id) === itemId
        );
        
        if (!item || item.status === 'COMPLETED') {
          delete updatedTimers[itemId];
        }
      });
      
      // Add new timers
      Object.entries(newTimers).forEach(([itemId, time]) => {
        if (!(parseInt(itemId) in updatedTimers)) {
          updatedTimers[parseInt(itemId)] = time;
        }
      });
      
      return updatedTimers;
    });
    
    return () => {
      console.log('🧹 Cleaning up', activeTimerIDs.length, 'timers');
      activeTimerIDs.forEach(clearInterval);
    };
  }, [order?.items]);

  // Separate effect to handle timer decrements
  useEffect(() => {
    const activeIntervals: NodeJS.Timeout[] = [];
    
    Object.keys(timers).forEach(itemIdStr => {
      const itemId = parseInt(itemIdStr);
      const timerValue = timers[itemId];
      
      if (timerValue > 0) {
        const intervalId = setInterval(() => {
          setTimers(prevTimers => {
            if (prevTimers[itemId] <= 0) {
              clearInterval(intervalId);
              return prevTimers;
            }
            
            const newValue = Math.max(0, prevTimers[itemId] - 1);
            
            if (newValue <= 0) {
              clearInterval(intervalId);
              // Find item name for notification
              const item = order?.items?.find((item: any) => 
                (item.id || item.order_item_id || item.item_id) === itemId
              );
              toast.info(`⏰ Estimated time for "${item?.name || 'item'}" has passed!`, {
                duration: 4000,
                style: { backgroundColor: '#fff3e0', color: '#f57c00' }
              });
            }
            
            return {
              ...prevTimers,
              [itemId]: newValue
            };
          });
        }, 1000);
        
        activeIntervals.push(intervalId);
      }
    });
    
    return () => {
      activeIntervals.forEach(clearInterval);
    };
  }, [Object.keys(timers).join(',')]);

  // Filter and search logic
  const filteredItems = useMemo(() => {
    let filtered = [...menuItems];

    // Search by name
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.variants?.some(variant => 
          variant.variant_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by price range
    if (priceRange) {
      filtered = filtered.filter(item => {
        const minPrice = Math.min(...item.variants?.map(v => v.price) || [0]);
        switch (priceRange) {
          case '0-100': return minPrice < 100;
          case '100-300': return minPrice >= 100 && minPrice <= 300;
          case '300-500': return minPrice >= 300 && minPrice <= 500;
          case '500+': return minPrice > 500;
          default: return true;
        }
      });
    }

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'price-asc': return Math.min(...a.variants?.map(v => v.price) || [0]) - Math.min(...b.variants?.map(v => v.price) || [0]);
        case 'price-desc': return Math.min(...b.variants?.map(v => v.price) || [0]) - Math.min(...a.variants?.map(v => v.price) || [0]);
        default: return 0;
      }
    });

    return filtered;
  }, [menuItems, searchQuery, selectedCategory, priceRange, sortBy]);

  // Get unique categories
  const uniqueCategories = useMemo(() => {
    return [...new Set(menuItems.map(item => item.category).filter(Boolean))];
  }, [menuItems]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (priceRange) count++;
    if (sortBy !== 'name') count++;
    return count;
  }, [selectedCategory, priceRange, sortBy]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setPriceRange('');
    setSortBy('name');
    setShowFilters(false);
  };

  // Enhanced Add More Items Function (same as before)
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
      
      console.log('🔄 Adding items to order:', { orderId: order.orderId, items: newItemsPayload });
      
      const updatedOrderFromServer = await orderService.addItemsToOrder(order.orderId, newItemsPayload);
      
      console.log('🆕 Updated order received from server:', updatedOrderFromServer);
      
      const serverItems = updatedOrderFromServer.order_items || updatedOrderFromServer.items || [];
      
      console.log('📋 Server items array:', serverItems);
      
      const completeUpdatedOrder = {
        ...order,
        ...updatedOrderFromServer,
        items: serverItems,
      };
      
      console.log('📋 Complete updated order:', completeUpdatedOrder);
      
      setOrder(completeUpdatedOrder);
      OrderSessionManager.saveOrder(completeUpdatedOrder);
      
      setCart([]);
      setReorderDialog(false);
      
      toast.success(`Successfully added ${cart.length} items to your order!`);
      setLastUpdate(new Date());
      
    } catch (error: any) {
      console.error('Failed to add items:', error);
      
      if (error?.response?.data?.message) {
        toast.error(`Failed to add items: ${error.response.data.message}`);
      } else if (error?.message) {
        toast.error(`Failed to add items: ${error.message}`);
      } else {
        toast.error('Failed to add items to your order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: PublicMenuItem, variant: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(c => c.menu_item_id === item.id && c.variant_name === variant.variant_name);
      if (existingItem) {
        return prevCart.map(c => 
          c.menu_item_id === item.id && c.variant_name === variant.variant_name 
            ? { ...c, quantity: c.quantity + 1 } 
            : c
        );
      } else {
        return [...prevCart, { 
          menu_item_id: item.id, 
          variant_name: variant.variant_name, 
          quantity: 1, 
          price: variant.price, 
          name: item.name, 
          preparation_time: variant.preparation_time 
        }];
      }
    });
    toast.success('Added to cart');
  };

  const updateCartQuantity = (itemId: number, variantName: string, change: number) => {
    setCart(prevCart => 
      prevCart.map(item => {
        if (item.menu_item_id === itemId && item.variant_name === variantName) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      }).filter(Boolean) as any[]
    );
  };

  // Safe helper functions with proper null checking
  const getProgress = (): number => {
    if (!order?.items || !Array.isArray(order.items) || order.items.length === 0) return 0;
    const completedItems = order.items.filter((i: any) => i?.status === 'COMPLETED').length;
    return (completedItems / order.items.length) * 100;
  };

  const getOverallStatus = () => {
    if (!order?.items || !Array.isArray(order.items) || order.items.length === 0) return 'No Items';
    
    const allCompleted = order.items.every((i: any) => i?.status === 'COMPLETED');
    const hasAccepted = order.items.some((i: any) => i?.status === 'ACCEPTED');
    const allPending = order.items.every((i: any) => i?.status === 'PENDING');
    
    if (allCompleted) return 'All Ready!';
    if (hasAccepted) return 'Being Prepared';
    if (allPending) return 'Order Received';
    return 'In Progress';
  };

  // Enhanced Order Status Logic
  const isOrderStillActive = () => {
    if (!order?.items || !Array.isArray(order.items)) return false;
    
    const hasNonCompletedItems = order.items.some((item: any) => 
      item?.status === 'PENDING' || item?.status === 'ACCEPTED'
    );
    
    return order.items.length === 0 || hasNonCompletedItems || order.status !== 'CLOSED';
  };

  const allItemsCompleted = order?.items?.every((i: any) => i?.status === 'COMPLETED') ?? false;
  const orderIsActive = isOrderStillActive();

  if (!order) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={isMobile ? 40 : 60} />
      </Box>
    );
  }

  const overallStatus = getOverallStatus();

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        py: isMobile ? 2 : 3, // 🔥 Responsive padding
        px: isMobile ? 1 : 3, // 🔥 Tighter horizontal padding on mobile
        backgroundColor: '#f8f9fa', 
        minHeight: '100vh' 
      }}
    >
      {/* 🔥 MOBILE-OPTIMIZED: Header Section */}
      <Paper 
        elevation={isMobile ? 2 : 4} 
        sx={{ 
          p: isMobile ? 2 : 4, // 🔥 Responsive padding
          mb: isMobile ? 2 : 4, 
          borderRadius: 3, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white' 
        }}
      >
        <Grid container spacing={isMobile ? 2 : 3} alignItems="center">
          <Grid size={{ xs: 12, md: 8 }}>
            <Box 
              display="flex" 
              flexDirection={isMobile ? "column" : "row"} // 🔥 Stack on mobile
              alignItems={isMobile ? "center" : "center"} 
              gap={isMobile ? 1.5 : 3}
              textAlign={isMobile ? "center" : "left"}
            >
              <Avatar sx={{ 
                width: isMobile ? 50 : 70, // 🔥 Responsive avatar
                height: isMobile ? 50 : 70, 
                bgcolor: 'rgba(255,255,255,0.2)' 
              }}>
                <Receipt fontSize={isMobile ? "medium" : "large"} />
              </Avatar>
              <Box>
                <Typography 
                  variant={isMobile ? "h5" : "h4"} // 🔥 Responsive typography
                  fontWeight="bold" 
                  gutterBottom
                >
                  Order #{order.orderId || 'N/A'}
                </Typography>
                <Typography 
                  variant={isMobile ? "body1" : "h6"} 
                  sx={{ opacity: 0.9 }}
                >
                  Queue: {order.queueNumber || 'N/A'} • Table: {order.tableNumber || 'N/A'}
                </Typography>
                <Typography 
                  variant={isMobile ? "body2" : "body1"} 
                  sx={{ opacity: 0.8, mt: 1 }}
                >
                  Status: {overallStatus} • {lastUpdate.toLocaleTimeString()}
                </Typography>
                {/* WebSocket Connection Status Indicator */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, justifyContent: isMobile ? "center" : "flex-start" }}>
                  <Chip
                    icon={wsConnected ? <Wifi /> : <WifiOff />}
                    label={wsConnected ? "🟢 Live Updates" : "🔴 No Live Updates"}
                    color={wsConnected ? "success" : "warning"}
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontSize: isMobile ? '0.7rem' : '0.75rem' // 🔥 Smaller text on mobile
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box textAlign="center"> {/* 🔥 Always center on mobile */}
              <Button 
                variant="contained" 
                size={isMobile ? "medium" : "large"} // 🔥 Responsive button size
                startIcon={<Add />} 
                onClick={() => setReorderDialog(true)} 
                disabled={!orderIsActive}
                fullWidth={isMobile} // 🔥 Full width on mobile
                sx={{ 
                  bgcolor: orderIsActive ? 'rgba(255,255,255,0.2)' : 'rgba(150,150,150,0.3)', 
                  backdropFilter: 'blur(10px)',
                  '&:hover': { 
                    bgcolor: orderIsActive ? 'rgba(255,255,255,0.3)' : 'rgba(150,150,150,0.3)' 
                  },
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: isMobile ? '0.8rem' : '0.875rem', // 🔥 Responsive text
                  py: isMobile ? 1.5 : 1 // 🔥 Better mobile touch target
                }}
              >
                {orderIsActive ? 'Add More Items' : 'Order Closed'}
              </Button>
              
              {allItemsCompleted && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mt: 1, 
                    opacity: 0.8, 
                    fontSize: isMobile ? '0.75rem' : '0.9rem' // 🔥 Responsive text
                  }}
                >
                  ✅ Items ready - You can still add more!
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* 🔥 MOBILE-OPTIMIZED: Progress Section */}
        <Box sx={{ mt: isMobile ? 3 : 4 }}>
          <Box 
            display="flex" 
            flexDirection={isMobile ? "column" : "row"} 
            justifyContent="space-between" 
            alignItems={isMobile ? "center" : "center"}
            mb={2}
            textAlign={isMobile ? "center" : "left"}
            gap={isMobile ? 0.5 : 0}
          >
            <Typography variant={isMobile ? "body1" : "h6"} fontWeight="bold">
              Order Progress
            </Typography>
            <Typography variant={isMobile ? "body1" : "h6"} fontWeight="bold">
              {Math.round(getProgress())}% Complete
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={getProgress()} 
            sx={{ 
              height: isMobile ? 8 : 12, // 🔥 Thinner progress bar on mobile
              borderRadius: 6,
              backgroundColor: 'rgba(255,255,255,0.3)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: allItemsCompleted ? '#4caf50' : '#fff',
                borderRadius: 6
              }
            }} 
          />
        </Box>
      </Paper>

      {/* Connection Status Alert */}
      {!wsConnected && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: isMobile ? 2 : 3,
            fontSize: isMobile ? '0.8rem' : '0.875rem' // 🔥 Smaller text on mobile
          }}
        >
          ⚠️ Live updates are not available. Status changes won't appear automatically.
        </Alert>
      )}

      {/* 🔥 MOBILE-OPTIMIZED: Order Items Section */}
      <Typography 
        variant={isMobile ? "h6" : "h5"} 
        fontWeight="bold" 
        gutterBottom 
        sx={{ 
          color: '#333', 
          mb: isMobile ? 2 : 3,
          textAlign: isMobile ? "center" : "left" // 🔥 Center on mobile
        }}
      >
        Your Order Items ({order?.items?.length || 0} items)
      </Typography>
      
      {/* Safe rendering with comprehensive checks */}
      {order?.items && Array.isArray(order.items) && order.items.length > 0 ? (
        order.items.map((item: any, index: number) => {
          if (!item) return null; // Skip null/undefined items
          const itemId = item.id || item.order_item_id || item.item_id;
          return (
            <Fade in={true} timeout={500 + index * 200} key={itemId || `item-${index}`}>
              <div>
                <OrderStatusCard item={item} timer={timers[itemId] || 0} />
              </div>
            </Fade>
          );
        })
      ) : (
        <Paper sx={{ p: isMobile ? 3 : 4, textAlign: 'center', borderRadius: 2 }}>
          <Restaurant sx={{ fontSize: isMobile ? 36 : 48, color: '#ccc', mb: 2 }} />
          <Typography variant={isMobile ? "body1" : "h6"} color="text.secondary" gutterBottom>
            No items found in your order
          </Typography>
        </Paper>
      )}

      {/* Enhanced Completion Alert - Shows when items are ready but order is still active */}
      {allItemsCompleted && orderIsActive && (
        <Zoom in={true}>
          <Alert 
            severity="info" 
            icon={<CheckCircle sx={{ fontSize: isMobile ? 24 : 32 }} />}
            sx={{ 
              mt: isMobile ? 2 : 3, 
              p: isMobile ? 2 : 3, 
              borderRadius: 3,
              fontSize: isMobile ? '0.9rem' : '1.1rem',
              backgroundColor: '#e3f2fd',
              '& .MuiAlert-icon': { fontSize: isMobile ? 24 : 32 }
            }}
          >
            <Typography variant={isMobile ? "body1" : "h6"} fontWeight="bold" gutterBottom>
              🎉 Current items are ready for pickup!
            </Typography>
            <Typography variant={isMobile ? "body2" : "body1"}>
              Your current items are ready. You can still add more items to this order or proceed to pickup.
            </Typography>
          </Alert>
        </Zoom>
      )}

      {/* Final Completion Alert - Only when order is truly done */}
      {allItemsCompleted && !orderIsActive && (
        <Zoom in={true}>
          <Alert 
            severity="success" 
            icon={<DoneAll sx={{ fontSize: isMobile ? 24 : 32 }} />}
            sx={{ 
              mt: isMobile ? 2 : 3, 
              p: isMobile ? 2 : 3, 
              borderRadius: 3,
              fontSize: isMobile ? '0.9rem' : '1.1rem',
              '& .MuiAlert-icon': { fontSize: isMobile ? 24 : 32 }
            }}
          >
            <Typography variant={isMobile ? "body1" : "h6"} fontWeight="bold" gutterBottom>
              🎉 Order completed!
            </Typography>
            <Typography variant={isMobile ? "body2" : "body1"}>
              All items are ready for pickup. Thank you for your order!
            </Typography>
          </Alert>
        </Zoom>
      )}

      {/* 🔥 MOBILE-OPTIMIZED: Add More Items Dialog */}
      <Dialog 
        open={reorderDialog} 
        onClose={() => setReorderDialog(false)} 
        maxWidth="lg" 
        fullWidth
        fullScreen={isMobile} // 🔥 Full screen on mobile for better UX
        PaperProps={{
          sx: { 
            borderRadius: isMobile ? 0 : 3, 
            maxHeight: isMobile ? '100vh' : '90vh',
            margin: isMobile ? 0 : undefined
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, px: isMobile ? 2 : 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold" gutterBottom>
                Add More Items
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Search and add items to your existing order
              </Typography>
            </Box>
            {/* 🔥 MOBILE: Close button */}
            {isMobile && (
              <IconButton onClick={() => setReorderDialog(false)} size="small">
                <Clear />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2, px: isMobile ? 1 : 3 }}>
          {/* 🔥 MOBILE-OPTIMIZED: Search and Filter Section */}
          <Paper 
            elevation={1} 
            sx={{ 
              p: isMobile ? 2 : 3, 
              mb: isMobile ? 2 : 3, 
              backgroundColor: '#f8f9fa', 
              borderRadius: 2,
              border: '1px solid #e0e0e0'
            }}
          >
            {/* 🔥 MOBILE: Stacked Search Bar */}
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? "column" : "row",
                gap: 2, 
                mb: isMobile ? 2 : 3, 
                alignItems: 'center' 
              }}
            >
              <TextField
                fullWidth
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size={isMobile ? "small" : "medium"} // 🔥 Smaller input on mobile
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#666', fontSize: isMobile ? 20 : 24 }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchQuery('')}
                        sx={{ color: '#666' }}
                      >
                        <Clear sx={{ fontSize: isMobile ? 16 : 20 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'white',
                    '&:hover fieldset': { borderColor: '#1976d2' },
                    '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                  }
                }}
              />
              <Button
                variant="outlined"
                onClick={() => setShowFilters(!showFilters)}
                startIcon={showFilters ? <ExpandLess /> : <ExpandMore />}
                size={isMobile ? "small" : "medium"}
                fullWidth={isMobile} // 🔥 Full width on mobile
                sx={{
                  minWidth: isMobile ? 'auto' : '140px',
                  height: isMobile ? '40px' : '56px',
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </Button>
            </Box>

            {/* 🔥 MOBILE-OPTIMIZED: Expandable Filter Section */}
            <Collapse in={showFilters}>
              <Divider sx={{ mb: isMobile ? 2 : 3 }} />
              <Grid container spacing={isMobile ? 2 : 3}>
                {/* Category Filter */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      label="Category"
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {uniqueCategories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Price Range Filter */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                    <InputLabel>Price Range</InputLabel>
                    <Select
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                      label="Price Range"
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">All Prices</MenuItem>
                      <MenuItem value="0-100">Under ₹100</MenuItem>
                      <MenuItem value="100-300">₹100 - ₹300</MenuItem>
                      <MenuItem value="300-500">₹300 - ₹500</MenuItem>
                      <MenuItem value="500+">Above ₹500</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Sort Filter */}
                <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                  <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      label="Sort By"
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="name">Name (A-Z)</MenuItem>
                      <MenuItem value="name-desc">Name (Z-A)</MenuItem>
                      <MenuItem value="price-asc">Price (Low to High)</MenuItem>
                      <MenuItem value="price-desc">Price (High to Low)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Filter Actions */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? "column" : "row",
                gap: 2, 
                mt: isMobile ? 2 : 3, 
                justifyContent: 'flex-end',
                alignItems: isMobile ? "stretch" : "center"
              }}>
                <Button
                  variant="text"
                  onClick={clearAllFilters}
                  disabled={activeFiltersCount === 0}
                  size={isMobile ? "small" : "medium"}
                  sx={{ textTransform: 'none' }}
                >
                  Clear All
                </Button>
                <Chip
                  label={`${filteredItems.length} items found`}
                  color="primary"
                  variant="outlined"
                  sx={{ 
                    fontWeight: 500,
                    alignSelf: isMobile ? "center" : "auto"
                  }}
                />
              </Box>
            </Collapse>
          </Paper>

          {/* 🔥 MOBILE-OPTIMIZED: Menu Items Grid */}
          <Box sx={{ 
            maxHeight: isMobile ? '50vh' : '60vh', 
            overflow: 'auto', 
            pr: isMobile ? 0 : 1 
          }}>
            {filteredItems.length > 0 ? (
              <Grid container spacing={isMobile ? 1.5 : 2}>
                {filteredItems.map((item) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        height: '100%',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                          transform: isMobile ? 'none' : 'translateY(-4px)', // 🔥 No hover on mobile
                          boxShadow: isMobile ? 1 : '0 8px 25px rgba(0,0,0,0.15)',
                          borderColor: '#1976d2'
                        },
                        borderRadius: 3,
                        overflow: 'hidden'
                      }}
                    >
                      <CardContent sx={{ p: isMobile ? 2 : 2.5 }}>
                        {/* Item Header */}
                        <Box sx={{ mb: 2 }}>
                          <Typography 
                            variant={isMobile ? "body1" : "h6"} 
                            fontWeight="bold" 
                            sx={{ 
                              fontSize: isMobile ? '1rem' : '1.1rem',
                              lineHeight: 1.2,
                              mb: 0.5,
                              color: '#1a1a1a'
                            }}
                          >
                            {item.name}
                          </Typography>
                          {item.category && (
                            <Chip
                              label={item.category}
                              size="small"
                              sx={{
                                backgroundColor: '#f0f0f0',
                                color: '#666',
                                fontSize: isMobile ? '0.7rem' : '0.75rem',
                                height: isMobile ? '18px' : '20px'
                              }}
                            />
                          )}
                        </Box>

                        {/* Item Description - hide on mobile to save space */}
                        {!isMobile && item.description && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ mb: 2, lineHeight: 1.4 }}
                          >
                            {item.description.length > 80 
                              ? `${item.description.substring(0, 80)}...` 
                              : item.description
                            }
                          </Typography>
                        )}

                        {/* 🔥 MOBILE-OPTIMIZED: Variants */}
                        <Box sx={{ mt: 'auto' }}>
                          {item?.variants?.map((variant) => {
                            const isInCart = cart.some(c => 
                              c.menu_item_id === item.id && c.variant_name === variant.variant_name
                            );
                            const cartItem = cart.find(c => 
                              c.menu_item_id === item.id && c.variant_name === variant.variant_name
                            );

                            return (
                              <Box 
                                key={variant.variant_name} 
                                sx={{
                                  display: 'flex', 
                                  flexDirection: isMobile ? "column" : "row", // 🔥 Stack on mobile
                                  justifyContent: 'space-between', 
                                  alignItems: isMobile ? "stretch" : "center",
                                  p: isMobile ? 1.5 : 2,
                                  mb: 1,
                                  backgroundColor: isInCart ? '#e3f2fd' : '#f9f9f9',
                                  borderRadius: 2,
                                  border: isInCart ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                  transition: 'all 0.2s ease',
                                  gap: isMobile ? 1 : 0
                                }}
                              >
                                <Box sx={{ flex: 1 }}>
                                  <Typography 
                                    variant={isMobile ? "body2" : "body1"} 
                                    fontWeight="medium"
                                  >
                                    {variant.variant_name}
                                  </Typography>
                                  <Box display="flex" alignItems="center" gap={2}>
                                    <Typography 
                                      variant={isMobile ? "subtitle1" : "h6"} 
                                      color="primary" 
                                      fontWeight="bold"
                                      sx={{ fontSize: isMobile ? '1rem' : '1.1rem' }}
                                    >
                                      ₹{variant.price}
                                    </Typography>
                                    {variant.preparation_time && (
                                      <Typography 
                                        variant="caption" 
                                        color="text.secondary"
                                        sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                                      >
                                        <Timer sx={{ fontSize: 10, mr: 0.5 }} />
                                        {variant.preparation_time} min
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>

                                {/* Add/Remove Controls */}
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 1,
                                  justifyContent: isMobile ? "center" : "flex-end",
                                  width: isMobile ? "100%" : "auto"
                                }}>
                                  {isInCart ? (
                                    <>
                                      <IconButton 
                                        size="small" 
                                        onClick={() => updateCartQuantity(item.id, variant.variant_name, -1)}
                                        sx={{ 
                                          backgroundColor: '#fff',
                                          '&:hover': { backgroundColor: '#f5f5f5' },
                                          width: isMobile ? 36 : 32,
                                          height: isMobile ? 36 : 32
                                        }}
                                      >
                                        <Remove sx={{ fontSize: isMobile ? 18 : 16 }} />
                                      </IconButton>
                                      <Typography 
                                        fontWeight="bold" 
                                        sx={{ 
                                          minWidth: isMobile ? '40px' : '32px', 
                                          textAlign: 'center',
                                          px: 1,
                                          py: 0.5,
                                          backgroundColor: '#fff',
                                          borderRadius: 1,
                                          fontSize: isMobile ? '1.1rem' : '1rem'
                                        }}
                                      >
                                        {cartItem?.quantity || 0}
                                      </Typography>
                                      <IconButton 
                                        size="small" 
                                        onClick={() => updateCartQuantity(item.id, variant.variant_name, 1)}
                                        sx={{ 
                                          backgroundColor: '#fff',
                                          '&:hover': { backgroundColor: '#f5f5f5' },
                                          width: isMobile ? 36 : 32,
                                          height: isMobile ? 36 : 32
                                        }}
                                      >
                                        <Add sx={{ fontSize: isMobile ? 18 : 16 }} />
                                      </IconButton>
                                    </>
                                  ) : (
                                    <Button 
                                      size={isMobile ? "medium" : "small"} 
                                      variant="contained" 
                                      onClick={() => addToCart(item, variant)}
                                      startIcon={<Add sx={{ fontSize: isMobile ? 18 : 16 }} />}
                                      fullWidth={isMobile} // 🔥 Full width on mobile
                                      sx={{
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        borderRadius: 2,
                                        px: 2,
                                        py: isMobile ? 1 : 0.5,
                                        fontSize: isMobile ? '0.9rem' : '0.8rem'
                                      }}
                                    >
                                      Add
                                    </Button>
                                  )}
                                </Box>
                              </Box>
                            );
                          }) || (
                            <Typography 
                              color="text.secondary" 
                              sx={{ 
                                textAlign: 'center', 
                                py: 2,
                                fontSize: isMobile ? '0.8rem' : '0.875rem'
                              }}
                            >
                              No variants available
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper 
                sx={{ 
                  p: isMobile ? 4 : 6, 
                  textAlign: 'center', 
                  backgroundColor: '#f8f9fa',
                  borderRadius: 3,
                  border: '2px dashed #e0e0e0'
                }}
              >
                <Restaurant sx={{ fontSize: isMobile ? 36 : 48, color: '#ccc', mb: 2 }} />
                <Typography variant={isMobile ? "body1" : "h6"} color="text.secondary" gutterBottom>
                  No items found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search or filters
                </Typography>
              </Paper>
            )}
          </Box>
          
          {/* 🔥 MOBILE-OPTIMIZED: Cart Summary */}
          {cart.length > 0 && (
            <Paper 
              elevation={3} 
              sx={{ 
                mt: isMobile ? 2 : 3, 
                p: isMobile ? 2 : 3, 
                backgroundColor: '#f8f9fa',
                borderRadius: 3,
                border: '2px solid #1976d2'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? "column" : "row",
                justifyContent: 'space-between', 
                alignItems: isMobile ? "center" : "center", 
                mb: 2,
                gap: isMobile ? 1 : 0
              }}>
                <Typography variant={isMobile ? "body1" : "h6"} fontWeight="bold" color="primary">
                  <ShoppingCart sx={{ mr: 1, verticalAlign: 'middle', fontSize: isMobile ? 20 : 24 }} />
                  Cart Summary
                </Typography>
                <Chip 
                  label={`${cart.reduce((sum, item) => sum + item.quantity, 0)} items`}
                  color="primary"
                  variant="filled"
                  size={isMobile ? "small" : "medium"}
                />
              </Box>
              
              <List dense sx={{ 
                maxHeight: isMobile ? '150px' : '200px', 
                overflow: 'auto' 
              }}>
                {cart.map((item) => (
                  <ListItem 
                    key={`${item.menu_item_id}-${item.variant_name}`} 
                    sx={{ 
                      px: 0,
                      py: isMobile ? 0.5 : 1,
                      borderBottom: '1px solid #e0e0e0',
                      '&:last-child': { borderBottom: 'none' }
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Typography 
                          variant={isMobile ? "body2" : "body1"} 
                          fontWeight="medium"
                        >
                          {item.name} ({item.variant_name})
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: isMobile ? "column" : "row",
                          alignItems: isMobile ? "flex-start" : "center", 
                          gap: isMobile ? 0.5 : 2, 
                          mt: 0.5 
                        }}>
                          <Typography 
                            variant="body2" 
                            color="primary" 
                            fontWeight="bold"
                            sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
                          >
                            ₹{item.price} × {item.quantity}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
                          >
                            = ₹{item.price * item.quantity}
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => updateCartQuantity(item.menu_item_id, item.variant_name, -1)}
                      >
                        <Remove sx={{ fontSize: isMobile ? 16 : 18 }} />
                      </IconButton>
                      <Typography 
                        fontWeight="bold" 
                        sx={{ 
                          minWidth: isMobile ? '28px' : '30px', 
                          textAlign: 'center',
                          fontSize: isMobile ? '0.9rem' : '1rem'
                        }}
                      >
                        {item.quantity}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => updateCartQuantity(item.menu_item_id, item.variant_name, 1)}
                      >
                        <Add sx={{ fontSize: isMobile ? 16 : 18 }} />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
              
              <Divider sx={{ my: 2 }} />
              <Box sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? "column" : "row",
                justifyContent: 'space-between', 
                alignItems: isMobile ? "center" : "center",
                gap: isMobile ? 2 : 0
              }}>
                <Typography 
                  variant={isMobile ? "h6" : "h5"} 
                  fontWeight="bold" 
                  color="primary"
                >
                  Total: ₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                </Typography>
                <Button
                  variant="text"
                  color="error"
                  onClick={() => setCart([])}
                  size={isMobile ? "small" : "medium"}
                  sx={{ textTransform: 'none' }}
                >
                  Clear Cart
                </Button>
              </Box>
            </Paper>
          )}
        </DialogContent>
        
        {/* 🔥 MOBILE-OPTIMIZED: Dialog Actions */}
        <DialogActions sx={{ 
          p: isMobile ? 2 : 3, 
          pt: 2,
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 1 : 0
        }}>
          {!isMobile && (
            <Button 
              onClick={() => setReorderDialog(false)} 
              size="large"
              sx={{ textTransform: 'none', px: 3 }}
            >
              Cancel
            </Button>
          )}
          <Button 
            variant="contained" 
            onClick={handleAddMoreItems} 
            disabled={cart.length === 0 || loading} 
            startIcon={loading ? <CircularProgress size={20} /> : <ShoppingCart />}
            size="large"
            fullWidth={isMobile} // 🔥 Full width on mobile
            sx={{ 
              textTransform: 'none', 
              px: 4,
              py: isMobile ? 2 : 1.5,
              borderRadius: 2,
              fontWeight: 600
            }}
          >
            {loading ? 'Adding...' : `Add ${cart.length} Item${cart.length !== 1 ? 's' : ''} to Order`}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrderTracking;
