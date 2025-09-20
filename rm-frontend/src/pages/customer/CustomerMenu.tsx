// src/pages/Customer/CustomerMenu.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Button,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
  Fab,
  Badge,
  AppBar,
  Toolbar,
  Container,
  Fade,
  Zoom,
  Stack,
  Divider,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Search,
  FilterList,
  ShoppingCart,
  Add,
  Remove,
  Close,
  Restaurant,
  Star,
  Clear,
  LocationOn,
  Phone,
  Schedule,
} from '@mui/icons-material';
import menuService from '@/services/api/menu.service';
import orderService from '@/services/api/order.service';
import { PublicMenuItem, FrontendOrderRequest } from '@/types/menu.types';
import { OrderSessionManager } from '@/utils/orderSession';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface CartItem {
  menu_item_id: number;
  variant_name: string;
  quantity: number;
  price: number;
  name: string;
}

interface RestaurantInfo {
  id: number;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  opening_hours?: string;
}

const CustomerMenu: React.FC = () => {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const [menuItems, setMenuItems] = useState<PublicMenuItem[]>([]);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderDialog, setOrderDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [restaurantLoading, setRestaurantLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState({
    customer_name: '',
    table_number: '',
  });

  useEffect(() => {
    if (restaurantSlug) {
      fetchRestaurantInfo();
      fetchMenu();
    }
  }, [restaurantSlug]);

  const fetchRestaurantInfo = async () => {
    try {
      setRestaurantLoading(true);
      const mockRestaurantInfo: RestaurantInfo = {
        id: 1,
        name: restaurantSlug?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Restaurant',
        slug: restaurantSlug!,
        description: 'A delightful fusion of traditional and modern cuisine.',
        address: '123 Food Street, Flavor Town',
        phone: '+91 98765 43210',
        opening_hours: '10:00 AM - 11:00 PM'
      };
      setTimeout(() => {
        setRestaurantInfo(mockRestaurantInfo);
        setRestaurantLoading(false);
      }, 300);
    } catch (error) {
      setRestaurantInfo({ id: 1, name: 'Restaurant', slug: restaurantSlug! });
      setRestaurantLoading(false);
    }
  };

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const data = await menuService.getPublicMenu(restaurantSlug!);
      setMenuItems(data);
      setTimeout(() => setLoading(false), 500);
    } catch (error) {
      toast.error('Failed to load menu');
      setLoading(false);
    }
  };

  const allFoodTypes = useMemo(() => Array.from(new Set(menuItems.flatMap(item => item.food_types))), [menuItems]);

  const menuByCategory = useMemo(() => {
    const filtered = menuItems.filter(item => {
      const matchesSearch = searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFoodType = selectedFilters.length === 0 || selectedFilters.some(filter => item.food_types.includes(filter));
      let matchesPrice = true;
      if (priceFilter !== 'all') {
        const minPrice = Math.min(...item.variants.map(v => v.price));
        if (priceFilter === 'low') matchesPrice = minPrice <= 200;
        else if (priceFilter === 'medium') matchesPrice = minPrice > 200 && minPrice <= 500;
        else if (priceFilter === 'high') matchesPrice = minPrice > 500;
      }
      return matchesSearch && matchesFoodType && matchesPrice;
    });

    return filtered.reduce((acc, item) => {
      const category = item.category_name || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, PublicMenuItem[]>);
  }, [menuItems, searchQuery, selectedFilters, priceFilter]);

  const addToCart = (item: PublicMenuItem, variant: any) => {
    const existingItemIndex = cart.findIndex(ci => ci.menu_item_id === item.id && ci.variant_name === variant.variant_name);
    if (existingItemIndex >= 0) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { menu_item_id: item.id, variant_name: variant.variant_name, quantity: 1, price: variant.price, name: item.name }]);
    }
    toast.success(`${item.name} added to cart!`);
  };

  const updateCartQuantity = (index: number, change: number) => {
    const newCart = [...cart];
    newCart[index].quantity += change;
    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  };

  const getCartItemCount = (itemId: number, variantName: string) => cart.find(item => item.menu_item_id === itemId && item.variant_name === variantName)?.quantity || 0;
  const getTotalAmount = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const toggleFilter = (filter: string) => setSelectedFilters(prev => prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]);
  const clearAllFilters = () => { setSelectedFilters([]); setPriceFilter('all'); setSearchQuery(''); };
  const navigate = useNavigate();

const placeOrder = async () => {
  if (!customerInfo.customer_name.trim() || !customerInfo.table_number.trim()) {
    toast.error('Please fill in all details');
    return;
  }

  const orderData: FrontendOrderRequest = {
    ...customerInfo,
    items: cart.map(item => ({
      menu_item_id: item.menu_item_id,
      variant_name: item.variant_name,
      quantity: item.quantity,
    })),
  };

  try {
    const response = await orderService.createCustomerOrder(restaurantSlug!, orderData);
    
    // 1. Create a clean object to store in the session
    const sessionOrder = {
      orderId: response.order_id,
      queueNumber: response.queue_number,
      tableNumber: customerInfo.table_number,
      customerName: customerInfo.customer_name,
      items: cart, // Store the cart items
      restaurantSlug: restaurantSlug!,
    };

    // 2. Save the active order to session storage (CRITICAL FIX)
    OrderSessionManager.saveOrder(sessionOrder);

    // 3. Navigate to the tracking page, passing the same data for initial load
    navigate(`/track/${restaurantSlug}`, {
      state: sessionOrder
    });
    
    // Clear the cart and close the order dialog
    setCart([]);
    setOrderDialog(false);
    
    toast.success(`Order placed! Your order ID is ${response.order_id}`);
    
  } catch (error: any) {
    if (error.response?.status === 403) {
      toast.error('You are too far from the restaurant to place an order');
    } else {
      toast.error('Failed to place order. Please try again.');
    }
  }
};

  const renderFilters = (isMobile: boolean) => (
    <Box p={isMobile ? 3 : 0}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Filters</Typography>
        <Button startIcon={<Clear />} onClick={clearAllFilters} size="small">Clear</Button>
      </Box>
      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Food Type</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>{allFoodTypes.map(type => (<Chip key={type} label={type} onClick={() => toggleFilter(type)} variant={selectedFilters.includes(type) ? 'filled' : 'outlined'} color={selectedFilters.includes(type) ? 'primary' : 'default'} />))}</Box>
        </Box>
        {/* <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Price</Typography>
          <ToggleButtonGroup value={priceFilter} exclusive onChange={(e, newFilter) => newFilter && setPriceFilter(newFilter)} size="small" fullWidth>
            <ToggleButton value="all">All</ToggleButton><ToggleButton value="low">₹</ToggleButton><ToggleButton value="medium">₹₹</ToggleButton><ToggleButton value="high">₹₹₹</ToggleButton>
          </ToggleButtonGroup>
        </Box> */}
      </Stack>
      {isMobile && <Button variant="contained" fullWidth sx={{ mt: 3, borderRadius: 2, py: 1.5 }} onClick={() => setShowFilters(false)}>Apply Filters</Button>}
    </Box>
  );

  if (loading || restaurantLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <Stack alignItems="center" spacing={2}>
        <Restaurant sx={{ fontSize: 60, color: 'primary.main' }} />
        <Typography variant="h6" color="text.secondary">Loading delicious menu...</Typography>
        <Skeleton variant="rectangular" width={300} height={50} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" width={300} height={100} sx={{ borderRadius: 2 }} />
      </Stack>
    </Box>;
  }

  return (
    <Box sx={{ backgroundColor: '#dee0e3', minHeight: '100vh', pb: 12 }}>
      <AppBar position="sticky" elevation={0} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <Restaurant sx={{ color: 'primary.main', mr: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700, flexGrow: 1 }}>{restaurantInfo?.name}</Typography>
          <IconButton onClick={() => setShowFilters(true)}><FilterList /></IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Grid container spacing={4}>
          <Grid item md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, border: '1px solid #e0e0e0', position: 'sticky', top: 88 }}>
              {renderFilters(false)}
            </Paper>
          </Grid>

          <Grid item xs={12} md={9}>
            <Stack spacing={4}>
              <TextField fullWidth placeholder="Search for your favorite dish..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><Search color="action" /></InputAdornment>),
                  endAdornment: searchQuery && (<InputAdornment position="end"><IconButton onClick={() => setSearchQuery('')}><Clear /></IconButton></InputAdornment>),
                  sx: { borderRadius: 3, bgcolor: 'white' }
                }}
              />

              {Object.keys(menuByCategory).length > 0 ? (
                Object.entries(menuByCategory).map(([category, items]) => (
                  <Box key={category}>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, color: 'text.primary' }}>{category}</Typography>
                    <Stack divider={<Divider sx={{ my: 1 }} />} spacing={1}>
                      {items.map((item) => (
                        <Paper key={item.id} elevation={0} sx={{ p: 2, borderRadius: 3, transition: 'background-color 0.2s', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                          <Stack spacing={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>{item.name}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ pr: 2 }}>{item.description}</Typography>
                              </Box>
                              <Stack direction="row" spacing={0.5} alignSelf="flex-start">
                                {item.food_types.map(type => <Chip key={type} label={type} size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 500 }} />)}
                              </Stack>
                            </Box>
                            <Stack spacing={1.5}>
                              {item.variants.map((variant) => {
                                const cartCount = getCartItemCount(item.id, variant.variant_name);
                                return (
                                  <Box key={variant.variant_name} sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box flexGrow={1}>
                                      <Typography variant="body1">{variant.variant_name}</Typography>
                                      <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 600 }}>₹{variant.price}</Typography>
                                    </Box>
                                    {cartCount === 0 ? (
                                      <Button variant="outlined" size="small" onClick={() => addToCart(item, variant)} sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>Add</Button>
                                    ) : (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'action.hover', borderRadius: 2 }}>
                                        <IconButton size="small" onClick={() => updateCartQuantity(cart.findIndex(c => c.variant_name === variant.variant_name && c.menu_item_id === item.id), -1)}><Remove fontSize="small" /></IconButton>
                                        <Typography sx={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{cartCount}</Typography>
                                        <IconButton size="small" onClick={() => addToCart(item, variant)}><Add fontSize="small" /></IconButton>
                                      </Box>
                                    )}
                                  </Box>
                                );
                              })}
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                ))
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
                  <Restaurant sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>No items match your filters</Typography>
                  <Button onClick={clearAllFilters} variant="outlined">Clear Filters</Button>
                </Paper>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Container>
      
      <Drawer anchor="bottom" open={showFilters && window.innerWidth < 900} onClose={() => setShowFilters(false)} PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16 } }}>
        {renderFilters(true)}
      </Drawer>

      {cart.length > 0 && (
          <Zoom in><Fab color="primary" onClick={() => setOrderDialog(true)} sx={{ position: 'fixed', bottom: 30, right: 30, zIndex: 1301 }}><Badge badgeContent={cart.reduce((acc, item) => acc + item.quantity, 0)} color="error"><ShoppingCart /></Badge></Fab></Zoom>
      )}

      <Dialog open={orderDialog} onClose={() => setOrderDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: { xs: 0, sm: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>Your Order <IconButton onClick={() => setOrderDialog(false)}><Close /></IconButton></DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
            <Box p={3}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Your Details</Typography>
                <Stack spacing={2}>
                    <TextField fullWidth label="Your Name *" value={customerInfo.customer_name} onChange={(e) => setCustomerInfo({ ...customerInfo, customer_name: e.target.value })} />
                    <TextField fullWidth label="Table Number *" value={customerInfo.table_number} onChange={(e) => setCustomerInfo({ ...customerInfo, table_number: e.target.value })} />
                </Stack>
            </Box>
            <Divider />
            <List sx={{ p: 3 }}>
                {cart.map((item, index) => (
                    <ListItem key={index} disableGutters>
                        <ListItemText primary={`${item.quantity} × ${item.name}`} secondary={item.variant_name} />
                        <Typography sx={{ fontWeight: 600 }}>₹{item.price * item.quantity}</Typography>
                    </ListItem>
                ))}
            </List>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Total: <span style={{ color: '#1976d2' }}>₹{getTotalAmount()}</span></Typography>
            <Button variant="contained" onClick={placeOrder} disabled={!customerInfo.customer_name.trim() || !customerInfo.table_number.trim()} sx={{ textTransform: 'none', fontWeight: 600, py: 1.5, px: 3, borderRadius: 2 }}>Place Order</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerMenu;
