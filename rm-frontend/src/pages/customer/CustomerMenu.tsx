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
  Slide,
  Stack,
  Divider,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  SwipeableDrawer,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
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
  KeyboardArrowDown,
  ExpandMore,
} from '@mui/icons-material';
import menuService from '@/services/api/menu.service';
import orderService from '@/services/api/order.service';
import { PublicMenuItem } from '@/types/menu.types';
import { OrderSessionManager } from '@/utils/orderSession';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Add missing interface
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

// Add missing interface for order request
interface FrontendOrderRequest {
  customer_name: string;
  table_number: string;
  items: Array<{
    menu_item_id: number;
    variant_name: string;
    quantity: number;
  }>;
}

const CustomerMenu: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
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
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [customerInfo, setCustomerInfo] = useState({
    customer_name: '',
    table_number: '',
  });

  const navigate = useNavigate();

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

  const allFoodTypes = useMemo(() => Array.from(new Set(menuItems.flatMap(item => item.food_types || []))), [menuItems]);

  const menuByCategory = useMemo(() => {
    const filtered = menuItems.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesFoodType = selectedFilters.length === 0 || 
        selectedFilters.some(filter => item.food_types?.includes(filter));
      
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
    const existingItemIndex = cart.findIndex(ci => 
      ci.menu_item_id === item.id && ci.variant_name === variant.variant_name
    );
    
    if (existingItemIndex >= 0) {
      const newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { 
        menu_item_id: item.id, 
        variant_name: variant.variant_name, 
        quantity: 1, 
        price: variant.price, 
        name: item.name 
      }]);
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

  const getCartItemCount = (itemId: number, variantName: string) => 
    cart.find(item => item.menu_item_id === itemId && item.variant_name === variantName)?.quantity || 0;

  const getTotalAmount = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  const toggleFilter = (filter: string) => 
    setSelectedFilters(prev => prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]);
  
  const clearAllFilters = () => { 
    setSelectedFilters([]); 
    setPriceFilter('all'); 
    setSearchQuery(''); 
  };

  const toggleItemExpansion = (itemId: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

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
      
      // Fix: Check if response has order_id property
      const orderId = response.order_id || response.id;
      
      const fullOrder = await orderService.getOrderDetails(orderId);
      
      const sessionOrder = {
        orderId: orderId,
        queueNumber: response.queue_number,
        tableNumber: customerInfo.table_number,
        customerName: customerInfo.customer_name,
        items: fullOrder.order_items,
        restaurantSlug: restaurantSlug!,
      };

      OrderSessionManager.saveOrder(sessionOrder);
      navigate(`/track/${restaurantSlug}`, { state: sessionOrder });
      
      setCart([]);
      setOrderDialog(false);
      toast.success(`Order placed! Your order ID is ${orderId}`);
      
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('You are too far from the restaurant to place an order');
      } else {
        toast.error('Failed to place order. Please try again.');
      }
    }
  };

  // Simplified Loading Component
  if (loading || restaurantLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', p: 2 }}>
        <Stack spacing={2}>
          {/* Header Skeleton */}
          <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
          
          {/* Search Skeleton */}
          <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 3 }} />
          
          {/* Menu Items Skeleton */}
          {[1, 2, 3].map((item) => (
            <Card key={item} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Stack spacing={1}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      {/* Simplified AppBar */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          bgcolor: 'white',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar sx={{ px: 2, minHeight: 64 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
            <Box sx={{ 
              width: 40, 
              height: 40, 
              bgcolor: 'primary.main', 
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Restaurant sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
                {restaurantInfo?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {restaurantInfo?.description}
              </Typography>
            </Box>
          </Stack>
          
          <IconButton 
            onClick={() => setShowFilters(true)}
            sx={{ color: 'text.primary' }}
          >
            <FilterList />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 2, px: 2 }}>
        {/* Search Bar */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 3,
            bgcolor: 'white',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <TextField 
            fullWidth
            placeholder="Search menu..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            size="medium"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearchQuery('')} size="small">
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
              sx: { 
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                fontSize: '1rem'
              }
            }}
          />
        </Paper>

        {/* Active Filters */}
        {(selectedFilters.length > 0 || priceFilter !== 'all' || searchQuery) && (
          <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
            {searchQuery && (
              <Chip
                label={`Search: "${searchQuery}"`}
                onDelete={() => setSearchQuery('')}
                size="small"
                variant="outlined"
              />
            )}
            {selectedFilters.map(filter => (
              <Chip
                key={filter}
                label={filter}
                onDelete={() => toggleFilter(filter)}
                size="small"
                variant="outlined"
              />
            ))}
            {priceFilter !== 'all' && (
              <Chip
                label={`Price: ${priceFilter}`}
                onDelete={() => setPriceFilter('all')}
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
            <Button 
              size="small" 
              onClick={clearAllFilters}
              sx={{ minWidth: 'auto' }}
            >
              Clear all
            </Button>
          </Stack>
        )}

        {/* Menu Categories */}
        <Stack spacing={3}>
          {Object.keys(menuByCategory).length > 0 ? (
            Object.entries(menuByCategory).map(([category, items]) => (
              <Box key={category}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: 2,
                    color: 'text.primary'
                  }}
                >
                  {category}
                </Typography>
                
                <Stack spacing={2}>
                  {items.map((item) => {
                    const isExpanded = expandedItems.has(item.id);
                    const shouldTruncate = item.description && item.description.length > 100;

                    return (
                      <Card 
                        key={item.id} 
                        elevation={0}
                        sx={{ 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'white',
                          overflow: 'visible'
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Stack spacing={1.5}>
                            {/* Item Header */}
                            <Box>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontWeight: 600,
                                  lineHeight: 1.3,
                                  mb: 0.5
                                }}
                              >
                                {item.name}
                              </Typography>
                              
                              {item.description && (
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{ 
                                    lineHeight: 1.4,
                                    mb: 1
                                  }}
                                >
                                  {shouldTruncate && !isExpanded
                                    ? `${item.description.substring(0, 100)}...`
                                    : item.description
                                  }
                                  {shouldTruncate && (
                                    <Button
                                      size="small"
                                      onClick={() => toggleItemExpansion(item.id)}
                                      sx={{ 
                                        ml: 0.5, 
                                        minWidth: 'auto',
                                        p: 0,
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      {isExpanded ? 'Show less' : 'Read more'}
                                    </Button>
                                  )}
                                </Typography>
                              )}

                              {item.food_types && item.food_types.length > 0 && (
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                  {item.food_types.map(type => (
                                    <Chip 
                                      key={type} 
                                      label={type} 
                                      size="small"
                                      variant="filled"
                                      sx={{ 
                                        bgcolor: 'primary.light', 
                                        color: 'primary.contrastText',
                                        fontSize: '0.7rem',
                                        height: 20
                                      }} 
                                    />
                                  ))}
                                </Stack>
                              )}
                            </Box>

                            {/* Variants */}
                            <Stack spacing={1}>
                              {item.variants.map((variant) => {
                                const cartCount = getCartItemCount(item.id, variant.variant_name);
                                const isOnlyVariant = item.variants.length === 1;
                                
                                return (
                                  <Box
                                    key={variant.variant_name}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      p: 1,
                                      bgcolor: 'grey.50',
                                      borderRadius: 1
                                    }}
                                  >
                                    <Box sx={{ flex: 1 }}>
                                      {!isOnlyVariant && (
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                          {variant.variant_name}
                                        </Typography>
                                      )}
                                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                                        ₹{variant.price}
                                      </Typography>
                                    </Box>
                                    
                                    {cartCount === 0 ? (
                                      <Button 
                                        variant="contained" 
                                        size="small"
                                        onClick={() => addToCart(item, variant)}
                                        sx={{ 
                                          borderRadius: 2,
                                          fontWeight: 600,
                                          minWidth: 80
                                        }}
                                      >
                                        Add
                                      </Button>
                                    ) : (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <IconButton 
                                          size="small" 
                                          onClick={() => {
                                            const cartIndex = cart.findIndex(c => 
                                              c.variant_name === variant.variant_name && c.menu_item_id === item.id
                                            );
                                            if (cartIndex >= 0) {
                                              updateCartQuantity(cartIndex, -1);
                                            }
                                          }}
                                          sx={{ 
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            border: '1px solid',
                                            borderColor: 'divider'
                                          }}
                                        >
                                          <Remove fontSize="small" />
                                        </IconButton>
                                        <Typography sx={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>
                                          {cartCount}
                                        </Typography>
                                        <IconButton 
                                          size="small" 
                                          onClick={() => addToCart(item, variant)}
                                          sx={{ 
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            '&:hover': { bgcolor: 'primary.dark' }
                                          }}
                                        >
                                          <Add fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    )}
                                  </Box>
                                );
                              })}
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>
            ))
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No items found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Try adjusting your search or filters
              </Typography>
              <Button onClick={clearAllFilters} variant="contained">
                Clear filters
              </Button>
            </Paper>
          )}
        </Stack>
      </Container>

      {/* Filter Drawer */}
      <SwipeableDrawer 
        anchor="bottom"
        open={showFilters}
        onClose={() => setShowFilters(false)}
        onOpen={() => setShowFilters(true)}
        PaperProps={{ 
          sx: { 
            borderTopLeftRadius: 16, 
            borderTopRightRadius: 16,
            maxHeight: '70vh'
          } 
        }}
      >
        <Box sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filters
            </Typography>
            <IconButton onClick={() => setShowFilters(false)}>
              <Close />
            </IconButton>
          </Stack>

          {/* Price Filter */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Price Range
            </Typography>
            <ToggleButtonGroup
              value={priceFilter}
              exclusive
              onChange={(_, value) => value && setPriceFilter(value)}
              fullWidth
            >
              <ToggleButton value="all" sx={{ borderRadius: 1, flex: 1 }}>All</ToggleButton>
              <ToggleButton value="low" sx={{ borderRadius: 1, flex: 1 }}>₹0-200</ToggleButton>
              <ToggleButton value="medium" sx={{ borderRadius: 1, flex: 1 }}>₹200-500</ToggleButton>
              <ToggleButton value="high" sx={{ borderRadius: 1, flex: 1 }}>₹500+</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Food Types */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Food Categories
            </Typography>
            <Stack spacing={1}>
              {allFoodTypes.map(type => (
                <Button
                  key={type}
                  variant={selectedFilters.includes(type) ? "contained" : "outlined"}
                  onClick={() => toggleFilter(type)}
                  size="small"
                  sx={{ 
                    justifyContent: 'flex-start',
                    borderRadius: 1,
                    textTransform: 'none'
                  }}
                >
                  {type}
                </Button>
              ))}
            </Stack>
          </Box>
        </Box>
      </SwipeableDrawer>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <Fab 
            color="primary" 
            onClick={() => setOrderDialog(true)}
            sx={{
              width: 56,
              height: 56,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}
          >
            <Badge 
              badgeContent={cart.reduce((acc, item) => acc + item.quantity, 0)} 
              color="error"
            >
              <ShoppingCart />
            </Badge>
          </Fab>
        </Box>
      )}

      {/* Order Dialog */}
      <Dialog 
        open={orderDialog} 
        onClose={() => setOrderDialog(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ 
          sx: { 
            borderRadius: { xs: 0, sm: 2 },
            margin: { xs: 0, sm: 2 }
          } 
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Your Order</Typography>
            <IconButton onClick={() => setOrderDialog(false)}>
              <Close />
            </IconButton>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {cart.length} items • ₹{getTotalAmount()}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3}>
            {/* Customer Details */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Your Details
              </Typography>
              <Stack spacing={2}>
                <TextField 
                  fullWidth 
                  label="Your Name" 
                  value={customerInfo.customer_name} 
                  onChange={(e) => setCustomerInfo({ ...customerInfo, customer_name: e.target.value })}
                  size="small"
                  required
                  error={!customerInfo.customer_name.trim()}
                />
                <TextField 
                  fullWidth 
                  label="Table Number" 
                  value={customerInfo.table_number} 
                  onChange={(e) => setCustomerInfo({ ...customerInfo, table_number: e.target.value })}
                  size="small"
                  required
                  error={!customerInfo.table_number.trim()}
                />
              </Stack>
            </Box>

            {/* Order Items */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Order Items
              </Typography>
              <Stack spacing={1}>
                {cart.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.variant_name} × {item.quantity}
                      </Typography>
                    </Box>
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  <Typography variant="body2" sx={{ fontWeight: 600 }}>
    ₹{item.price * item.quantity}
  </Typography>

  <IconButton
    size="small"
    onClick={() => updateCartQuantity(index, -1)}
    sx={{
      bgcolor: 'primary.main',
      color: 'white',
      '&:hover': { bgcolor: 'primary.dark' }
    }}
  >
    <Remove fontSize="small" />
  </IconButton>

  <Typography sx={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>
    {item.quantity}
  </Typography>

  <IconButton
    size="small"
    onClick={() => updateCartQuantity(index, 1)}
    sx={{
      bgcolor: 'primary.main',
      color: 'white',
      '&:hover': { bgcolor: 'primary.dark' }
    }}
  >
    <Add fontSize="small" />
  </IconButton>
</Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, flexDirection: 'column', gap: 2 }}>
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Total: ₹{getTotalAmount()}
            </Typography>
          </Box>
          
          <Button 
            variant="contained" 
            onClick={placeOrder} 
            disabled={!customerInfo.customer_name.trim() || !customerInfo.table_number.trim() || cart.length === 0}
            fullWidth
            size="large"
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Place Order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerMenu;