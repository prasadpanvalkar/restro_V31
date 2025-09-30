import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Fab,
  AppBar,
  Toolbar,
  Container,
  Stack,
  Badge,
  alpha,
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  ShoppingCart,
  Send,
  Refresh,
  Close,
  Search,
  TableRestaurant,
  Person,
  RestaurantMenu,
  ExpandMore,
  ExpandLess,
  AddShoppingCart
} from '@mui/icons-material';
import menuService from '@/services/api/menu.service';
import orderService from '@/services/api/order.service';
import authService from '@/services/api/auth.service';
import { useWebSocket } from '@/hooks/useWebSocket';
import { MenuItem as MenuItemType, Category } from '@/types/menu.types';
import { KitchenOrder } from '@/types/order.types';
import toast from 'react-hot-toast';

/** Types */
interface Variant {
  variant_name: string;
  price: number | string;
  preparation_time?: number;
}

interface CartItem {
  variantId: string;
  menuItemId: number;
  menuItemName: string;
  variantName: string;
  price: number;
  quantity: number;
}

// Helper function to decode JWT token safely
const decodeToken = (token: string | null): any => {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

// Memoized Cart Item Component
const CartItemRow = memo<{
  item: CartItem;
  onUpdateQuantity: (variantId: string, change: number) => void;
  onRemove: (variantId: string) => void;
  isMobile?: boolean;
}>(({ item, onUpdateQuantity, onRemove, isMobile = false }) => (
  <ListItem 
    sx={{ 
      px: 0, 
      py: 1, 
      borderBottom: '1px solid', 
      borderColor: 'grey.100',
      '&:last-child': { borderBottom: 'none' }
    }}
  >
    <ListItemText
      primary={
        <Typography variant="subtitle2" fontWeight={600}>
          {item.menuItemName}
        </Typography>
      }
      secondary={
        <Typography variant="body2" color="text.secondary" component="div">
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="caption" display="block">
              {item.variantName} - ₹{Number(item.price).toFixed(2)}
            </Typography>
            <Typography variant="caption" fontWeight={600} display="block">
              Subtotal: ₹{(Number(item.price) * item.quantity).toFixed(2)}
            </Typography>
          </Box>
        </Typography>
      }
    />
    <ListItemSecondaryAction>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <IconButton
          size="small"
          aria-label={`Decrease quantity of ${item.menuItemName}`}
          onClick={() => onUpdateQuantity(item.variantId, -1)}
          disabled={item.quantity <= 1}
          sx={{ backgroundColor: 'grey.100', '&:hover': { backgroundColor: 'grey.200' } }}
        >
          <Remove fontSize="small" />
        </IconButton>
        <Typography 
          sx={{ 
            minWidth: isMobile ? 28 : 24, 
            textAlign: 'center', 
            fontWeight: 600,
            fontSize: isMobile ? '0.875rem' : '0.8rem'
          }}
        >
          {item.quantity}
        </Typography>
        <IconButton
          size="small"
          aria-label={`Increase quantity of ${item.menuItemName}`}
          onClick={() => onUpdateQuantity(item.variantId, 1)}
          sx={{ backgroundColor: 'grey.100', '&:hover': { backgroundColor: 'grey.200' } }}
        >
          <Add fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          aria-label={`Remove ${item.menuItemName} from cart`}
          onClick={() => onRemove(item.variantId)}
          sx={{ ml: 0.5 }}
        >
          <Delete fontSize="small" />
        </IconButton>
      </Box>
    </ListItemSecondaryAction>
  </ListItem>
));

CartItemRow.displayName = 'CartItemRow';

const CaptainOrders: React.FC = () => {
  console.log('🔄 CaptainOrders RENDER');
  // --- Component States ---
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');

  console.log('📝 Customer Name:', customerName);
  console.log('📋 Table Number:', tableNumber);
  console.log('🛒 Cart length:', cart.length);

  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [activeOrders, setActiveOrders] = useState<KitchenOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isAddItemsModalOpen, setAddItemsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
  const [additionalCart, setAdditionalCart] = useState<CartItem[]>([]);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Search and filter states
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [modalMenuSearchQuery, setModalMenuSearchQuery] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [showCartDetails, setShowCartDetails] = useState(false);
  const [expandedMenuItems, setExpandedMenuItems] = useState<Set<number>>(new Set());

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Memoized callbacks for form inputs
  const handleCustomerNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('✏️ handleCustomerNameChange called:', e.target.value);

    setCustomerName(e.target.value);
  }, []);

  const handleTableNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('✏️ handleTableNumberChange called:', e.target.value);
    setTableNumber(e.target.value);
  }, []);

  // Prevent Enter key from submitting/closing dialogs unexpectedly
  const onFormKeyDown = useCallback((e: React.KeyboardEvent) => {
    console.log('⌨️ onFormKeyDown called, key:', e.key);
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  }, []);

  // Get user and restaurant info safely (memoized)
  const { user, restaurantSlug } = useMemo(() => {
    const currentUser = authService.getCurrentUser();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const decodedToken = decodeToken(token);
    const slug = currentUser?.restaurant?.slug || decodedToken?.restaurant_slug || '';
    
    return { user: currentUser, restaurantSlug: slug };
  }, []);

  // --- WebSocket Handler ---
  const handleOrderUpdate = useCallback((data: any) => {
    if (data.type === 'send.new.order' || data.type === 'new_order') {
      const orderData = data.data || data.order;
      if (!orderData) return;

      const newOrder: KitchenOrder = {
        id: orderData.bill_id || orderData.id,
        table_number: orderData.table_number,
        customer_name: orderData.customer_name,
        created_at: orderData.created_at || new Date().toISOString(),
        order_items: (orderData.items || orderData.order_items || []).map((item: any) => ({
          id: item.order_item_id || item.id,
          name: item.name,
          variant_name: item.variant || item.variant_name,
          quantity: item.quantity,
          status: item.status || 'PENDING',
        })),
      };

      setActiveOrders(prevOrders => {
        const existingIndex = prevOrders.findIndex(order => order.id === newOrder.id);
        if (existingIndex >= 0) {
          const updated = [...prevOrders];
          updated[existingIndex] = newOrder;
          return updated;
        }
        return [newOrder, ...prevOrders];
      });

      toast.success(`New order received for Table ${orderData.table_number}`, { duration: 2000 });
    } else if (data.type === 'order_status_update') {
      setActiveOrders(prevOrders =>
        prevOrders.map(order => ({
          ...order,
          order_items: order.order_items.map(item =>
            item.id === data.order_item_id ? { ...item, status: data.status } : item
          ),
        }))
      );
    }
  }, []);

  const handleWebSocketConnect = useCallback(() => {
    toast.success('Connected to order updates', { duration: 1500 });
  }, []);

  const handleWebSocketDisconnect = useCallback(() => {
    toast.error('Disconnected from order updates', { duration: 1500 });
  }, []);

  // --- WebSocket Connection ---
  useWebSocket({
    role: 'CHEF' as any,
    restaurantSlug: restaurantSlug,
    onMessage: handleOrderUpdate,
    enabled: !!restaurantSlug,
    onConnect: handleWebSocketConnect,
    onDisconnect: handleWebSocketDisconnect,
  });

  // --- Data Fetching ---
  const fetchMenuData = useCallback(async () => {
    try {
      setLoadingMenu(true);
      setMenuError(null);
      const [itemsData, categoriesData] = await Promise.all([
        menuService.getMenuItems(),
        menuService.getCategories(),
      ]);

      const itemsRaw = Array.isArray(itemsData) ? itemsData : itemsData?.data || [];
      const catsRaw = Array.isArray(categoriesData) ? categoriesData : categoriesData?.data || [];

      const availableItems = itemsRaw.filter((item: any) => item.is_available);
      if (availableItems.length === 0) {
        setMenuError('No menu items available. Please add items in Menu Management first.');
      }

      setMenuItems(availableItems);
      setCategories(catsRaw);
    } catch (error: any) {
      console.error('Failed to fetch menu:', error);
      setMenuError('Failed to load menu. Please check the connection and try again.');
      toast.error('Failed to fetch menu');
    } finally {
      setLoadingMenu(false);
    }
  }, []);

  const fetchActiveOrders = useCallback(async () => {
    try {
      setIsLoadingOrders(true);
      const orders = await orderService.getKitchenOrders();
      setActiveOrders(orders);
    } catch (error) {
      console.error('Failed to fetch active orders:', error);
      toast.error('Failed to load active orders.');
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuData();
    fetchActiveOrders();
  }, [fetchMenuData, fetchActiveOrders]);

  // --- Cart Management ---
  const addToCart = useCallback(
    (menuItem: MenuItemType, variant: Variant, targetCart: 'main' | 'additional') => {
      if (!menuItem.id || !variant.variant_name) {
        toast.error('Invalid menu item or variant data');
        return;
      }

      const variantId = `${menuItem.id}_${variant.variant_name}`;
      const setCartToUpdate = targetCart === 'main' ? setCart : setAdditionalCart;
      
      setCartToUpdate(prev => {
        const idx = prev.findIndex(it => it.variantId === variantId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
          return next;
        }
        return [
          ...prev,
          {
            variantId,
            menuItemId: menuItem.id,
            menuItemName: menuItem.name,
            variantName: variant.variant_name,
            price: Number(variant.price),
            quantity: 1,
          },
        ];
      });
      
      toast.success(`Added ${menuItem.name} (${variant.variant_name})`, { duration: 1500 });
    },
    []
  );

  const updateQuantity = useCallback((variantId: string, change: number, targetCart: 'main' | 'additional') => {
    const setCartToUpdate = targetCart === 'main' ? setCart : setAdditionalCart;
    setCartToUpdate(prev =>
      prev
        .map(item => {
          if (item.variantId === variantId) {
            const newQuantity = item.quantity + change;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
          }
          return item;
        })
        .filter(item => item.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((variantId: string, targetCart: 'main' | 'additional') => {
    const setCartToUpdate = targetCart === 'main' ? setCart : setAdditionalCart;
    setCartToUpdate(prev => prev.filter(item => item.variantId !== variantId));
    toast.success('Item removed from cart', { duration: 1200 });
  }, []);

  const calculateTotal = useCallback(
    (targetCart: 'main' | 'additional'): number => {
      const cartToSum = targetCart === 'main' ? cart : additionalCart;
      return cartToSum.reduce((total, item) => total + Number(item.price) * item.quantity, 0);
    },
    [cart, additionalCart]
  );

  // Memoized handlers for cart operations
  const handleMainCartQuantityUpdate = useCallback((variantId: string, change: number) => {
    updateQuantity(variantId, change, 'main');
  }, [updateQuantity]);

  const handleMainCartRemove = useCallback((variantId: string) => {
    removeFromCart(variantId, 'main');
  }, [removeFromCart]);

  const handleAdditionalCartQuantityUpdate = useCallback((variantId: string, change: number) => {
    updateQuantity(variantId, change, 'additional');
  }, [updateQuantity]);

  const handleAdditionalCartRemove = useCallback((variantId: string) => {
    removeFromCart(variantId, 'additional');
  }, [removeFromCart]);

  // --- Search and Filter Logic ---
  const effectiveMenuSearch = activeTab === 0 ? menuSearchQuery : modalMenuSearchQuery;
  
  const filteredMenuItems = useMemo(() => {
    let filtered = menuItems;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    const q = effectiveMenuSearch.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.variants?.some(v => v.variant_name.toLowerCase().includes(q))
      );
    }
    
    return filtered;
  }, [menuItems, selectedCategory, effectiveMenuSearch]);

  const filteredActiveOrders = useMemo(() => {
    const q = orderSearchQuery.trim().toLowerCase();
    if (!q) return activeOrders;
    
    return activeOrders.filter(order =>
      order.table_number.toLowerCase().includes(q) ||
      order.customer_name.toLowerCase().includes(q) ||
      order.id.toString().includes(q)
    );
  }, [activeOrders, orderSearchQuery]);// --- Order Actions ---
  const handleCreateOrder = useCallback(async () => {
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

    const orderData = {
      customer_name: customerName.trim(),
      table_number: tableNumber.trim(),
      items: cart.map(item => ({
        menu_item_id: item.menuItemId,
        variant_name: item.variantName,
        quantity: item.quantity,
      })),
    };

    try {
      setIsCreatingOrder(true);
      const result = await orderService.createCustomerOrder(restaurantSlug, orderData);
      toast.success(`Order created! ID: ${result.order_id}, Queue: ${result.queue_number}`, { duration: 2500 });
      
      // Reset form
      setCart([]);
      setCustomerName('');
      setTableNumber('');
      setShowCartDetails(false);
      
      // Refresh orders
      await fetchActiveOrders();
    } catch (error: any) {
      console.error('Failed to create order:', error);
      let errorMessage = 'Failed to create order';
      
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.response?.data && typeof error.response.data === 'object') {
        const keys = Object.keys(error.response.data);
        if (keys.length > 0) {
          const field = keys[0];
          const val = error.response.data[field];
          errorMessage = Array.isArray(val) ? `${field}: ${val[0]}` : `${field}: ${val}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsCreatingOrder(false);
    }
  }, [customerName, tableNumber, cart, restaurantSlug, fetchActiveOrders]);

  const handleAddItemsToExistingOrder = useCallback(async () => {
    if (!selectedOrder || additionalCart.length === 0) {
      toast.error('No items selected to add');
      return;
    }

    const items = additionalCart.map(item => ({
      menu_item_id: item.menuItemId,
      variant_name: item.variantName,
      quantity: item.quantity,
    }));

    try {
      await orderService.addItemsToOrder(selectedOrder.id, items);
      toast.success(`Items added to order for Table ${selectedOrder.table_number}`, { duration: 2000 });
      
      // Reset modal state
      setAddItemsModalOpen(false);
      setAdditionalCart([]);
      setSelectedOrder(null);
      setModalMenuSearchQuery('');
      
      // Refresh orders
      await fetchActiveOrders();
    } catch (error) {
      console.error('Failed to add items to order:', error);
      toast.error('Failed to add items to order');
    }
  }, [selectedOrder, additionalCart, fetchActiveOrders]);

  const handleSelectOrderForAddingItems = useCallback((order: KitchenOrder) => {
    setSelectedOrder(order);
    setAdditionalCart([]);
    setModalMenuSearchQuery('');
    setAddItemsModalOpen(true);
  }, []);

  const toggleMenuItemExpansion = useCallback((itemId: number) => {
    setExpandedMenuItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const handleCloseCartDialog = useCallback(() => {
    setShowCartDetails(false);
  }, []);

  const handleOpenCartDialog = useCallback(() => {
  console.log('🚀 Opening cart dialog, current showCartDetails:', showCartDetails);
  setShowCartDetails(true);
  console.log('✅ setShowCartDetails(true) called');
}, [showCartDetails]);

  const handleCloseAddItemsModal = useCallback(() => {
    setAddItemsModalOpen(false);
    setModalMenuSearchQuery('');
  }, []);

  const handleTabChange = useCallback((_: React.SyntheticEvent, value: number) => {
    setActiveTab(value);
  }, []);

  // --- Components ---
  const MenuItemCard = memo<{ 
    item: MenuItemType; 
    targetCart?: 'main' | 'additional';
  }>(({ item, targetCart = 'main' }) => {
    const isExpanded = expandedMenuItems.has(item.id);
    const variants: Variant[] = (item.variants || []) as Variant[];
    const showExpansion = variants.length > (isMobile ? 2 : 3);
    const sliceCount = isExpanded ? variants.length : (isMobile ? 2 : 3);

    return (
      <Card
        sx={{
          width: '100%',
          borderRadius: 3,
          overflow: 'visible',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          backgroundColor: 'white',
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.1),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            transform: 'translateY(-2px)'
          }
        }}
      >
        <CardContent sx={{ p: isMobile ? 2 : 2.5, '&:last-child': { pb: isMobile ? 2 : 2.5 } }}>
          <Box sx={{ mb: isMobile ? 2 : 2.5 }}>
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontWeight: 700,
                lineHeight: 1.3,
                fontSize: isMobile ? '1.1rem' : '1.2rem',
                color: 'text.primary',
                wordBreak: 'break-word',
                mb: 0.5
              }}
            >
              {item.name}
            </Typography>
            {item.description && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ fontSize: isMobile ? '0.875rem' : '0.9rem', lineHeight: 1.4 }}
              >
                {item.description}
              </Typography>
            )}
          </Box>

          {variants.length > 0 ? (
            <Box>
              {variants.slice(0, sliceCount).map(variant => (
                <Box
                  key={`${item.id}_${variant.variant_name}`}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    alignItems: 'center',
                    mb: isMobile ? 2 : 1.5,
                    p: isMobile ? 2 : 1.5,
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                    gap: isMobile ? 1.5 : 2,
                    minHeight: 56
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{ 
                        fontSize: isMobile ? '0.95rem' : '1rem', 
                        mb: 0.5, 
                        color: 'text.primary', 
                        lineHeight: 1.2 
                      }}
                    >
                      {variant.variant_name}
                    </Typography>
                    <Box sx={{ display: 'inline-flex', alignItems: 'baseline', gap: 1, minWidth: 120, flexWrap: 'wrap' }}>
                      <Typography 
                        variant="h6" 
                        color="primary.main" 
                        sx={{ fontWeight: 700, fontSize: isMobile ? '1rem' : '1.1rem' }}
                      >
                        ₹{Number(variant.price)}
                      </Typography>
                      {variant.preparation_time != null && (
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ fontSize: isMobile ? '0.75rem' : '0.8rem' }}
                        >
                          {variant.preparation_time} min
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    size={isMobile ? 'medium' : 'small'}
                    onClick={() => addToCart(item, variant, targetCart)}
                    aria-label={`Add ${item.name} ${variant.variant_name} to cart`}
                    sx={{
                      minWidth: isMobile ? 70 : 65,
                      height: isMobile ? 40 : 36,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: isMobile ? '0.8rem' : '0.75rem',
                      px: isMobile ? 2 : 1.5,
                      whiteSpace: 'nowrap',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                    }}
                  >
                    Add
                  </Button>
                </Box>
              ))}

              {showExpansion && (
                <Box sx={{ height: isMobile ? 36 : 32 }}>
                  <Button
                    variant="text"
                    onClick={() => toggleMenuItemExpansion(item.id)}
                    endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                    aria-label={isExpanded ? 'Show fewer variants' : 'Show more variants'}
                    aria-expanded={isExpanded}
                    sx={{
                      width: '100%',
                      mt: 1,
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: isMobile ? '0.875rem' : '0.8rem',
                      py: isMobile ? 1 : 0.5,
                      color: 'primary.main'
                    }}
                  >
                    {isExpanded ? 'Show Less' : `Show ${variants.length - (isMobile ? 2 : 3)} More`}
                  </Button>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: isMobile ? 3 : 2 }}>
              <AddShoppingCart sx={{ fontSize: 32, color: 'grey.400', mb: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: isMobile ? '0.875rem' : '0.8rem' }}>
                No variants available
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  });

  MenuItemCard.displayName = 'MenuItemCard';

  const MobileCartFab = memo(() => (
    <Fab
      color="primary"
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        '&:hover': { transform: 'scale(1.05)', boxShadow: '0 12px 32px rgba(0,0,0,0.3)' },
        transition: 'all 0.2s ease-in-out'
      }}
      onClick={handleOpenCartDialog}
      aria-label="Open cart"
    >
      <Badge
        badgeContent={cart.length}
        color="error"
        sx={{
          '& .MuiBadge-badge': {
            fontSize: '0.7rem',
            fontWeight: 'bold'
          }
        }}
      >
        <ShoppingCart />
      </Badge>
    </Fab>
  ));

  MobileCartFab.displayName = 'MobileCartFab';

  const CartDetailsDialog = () => {
  console.log('🔷 CartDetailsDialog RENDER');
  console.log('  - showCartDetails:', showCartDetails);
  console.log('  - customerName:', customerName);
  console.log('  - tableNumber:', tableNumber);
  
  // Add early return if not open - this prevents unnecessary rendering
  if (!showCartDetails) return null;
  
  return (
    <Dialog
      open={true}  // Always true because we return null above if false
      onClose={handleCloseCartDialog}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, background: '#fafafa' } }}
      aria-labelledby="cart-details-title"
      role="dialog"
    >
      <DialogTitle
        id="cart-details-title"
        sx={{
          p: isMobile ? 2 : 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Order Details
          </Typography>
          <IconButton 
            onClick={handleCloseCartDialog} 
            sx={{ color: 'white' }} 
            aria-label="Close dialog"
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
        <Stack spacing={2} component="form" onKeyDown={onFormKeyDown} autoComplete="on">
          <TextField
            fullWidth
            label="Customer Name"
            name="customer_name"
            autoComplete="name"
            value={customerName}
            onChange={(e) => {
              console.log('🎯 TextField onChange fired:', e.target.value);
              handleCustomerNameChange(e);
            }}
            size="small"
            required
            inputProps={{ 
              autoCapitalize: 'words', 
              autoCorrect: 'off', 
              'aria-label': 'Customer name' 
            }}
            sx={{ 
              '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: 'white' }, 
              mt: 2
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Table Number"
            name="table_number"
            autoComplete="on"
            value={tableNumber}
            onChange={(e) => {
              console.log('🎯 TextField onChange fired (table):', e.target.value);
              handleTableNumberChange(e);
            }}
            size="small"
            required
            inputProps={{ 
              inputMode: 'text', 
              pattern: '[0-9A-Za-z\\- ]*', 
              'aria-label': 'Table number' 
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: 'white' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <TableRestaurant sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>
            Cart Items ({cart.length})
          </Typography>

          {cart.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ShoppingCart sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
              <Typography color="textSecondary" variant="body2">
                Cart is empty. Add items from the menu.
              </Typography>
            </Box>
          ) : (
            <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
              {cart.map(item => (
                <CartItemRow
                  key={item.variantId}
                  item={item}
                  onUpdateQuantity={handleMainCartQuantityUpdate}
                  onRemove={handleMainCartRemove}
                  isMobile={isMobile}
                />
              ))}
            </List>
          )}

          <Divider />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>Total:</Typography>
            <Typography variant="h6" color="primary" fontWeight={700}>
              ₹{calculateTotal('main').toFixed(2)}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: isMobile ? 2 : 3, gap: 1 }}>
        <Button
          onClick={handleCloseCartDialog}
          variant="outlined"
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Continue Shopping
        </Button>
        <Button
          variant="contained"
          size="large"
          startIcon={isCreatingOrder ? <CircularProgress size={20} color="inherit" /> : <Send />}
          onClick={handleCreateOrder}
          disabled={cart.length === 0 || !customerName.trim() || !tableNumber.trim() || isCreatingOrder}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
          }}
        >
          {isCreatingOrder ? 'Creating...' : 'Create Order'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

  CartDetailsDialog.displayName = 'CartDetailsDialog';

  // --- Main Render ---
  return (
    <Box 
      sx={{ 
        pb: isMobile ? 8 : 10, 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', 
        minHeight: '100vh' 
      }}
    >
      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar
          position="sticky"
          sx={{
            top: 0,
            zIndex: 1100,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
        >
          <Toolbar sx={{ minHeight: '56px !important', px: 2 }}>
            <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 600, fontSize: '1.1rem' }}>
              Captain Dashboard
            </Typography>
            <IconButton
              color="inherit"
              onClick={fetchActiveOrders}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' } 
              }}
              aria-label="Refresh orders"
            >
              <Refresh />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      <Container maxWidth="lg" sx={{ px: isMobile ? 1.5 : 3, py: isMobile ? 2 : 3 }}>
        {/* Desktop Header */}
        {!isMobile && (
          <Paper
            sx={{
              p: 3,
              mb: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'white' }}>
                Captain Dashboard
              </Typography>
              <Button
                startIcon={<Refresh />}
                onClick={fetchActiveOrders}
                variant="contained"
                aria-label="Refresh orders"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  color: 'primary.main',
                  borderRadius: 2,
                  fontWeight: 600,
                  '&:hover': { backgroundColor: 'white' }
                }}
              >
                Refresh
              </Button>
            </Box>
          </Paper>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3, backgroundColor: 'white', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            centered={!isMobile}
            variant={isMobile ? 'fullWidth' : 'standard'}
            aria-label="Captain dashboard tabs"
            sx={{
              '& .MuiTab-root': {
                fontSize: isMobile ? '0.875rem' : '0.9rem',
                fontWeight: 600,
                minHeight: isMobile ? 48 : 40,
                py: isMobile ? 1.5 : 1,
                textTransform: 'none'
              }
            }}
          >
            <Tab label={isMobile ? 'New Order' : 'Create New Order'} id="tab-0" aria-controls="tabpanel-0" />
            <Tab label={`Active Orders (${activeOrders.length})`} id="tab-1" aria-controls="tabpanel-1" />
          </Tabs>
        </Paper>

        {/* TAB 0: CREATE NEW ORDER */}
        {activeTab === 0 && (
          <Box role="tabpanel" id="tabpanel-0" aria-labelledby="tab-0">
            {/* Search and Filter */}
            <Stack spacing={isMobile ? 1.5 : 2} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search menu items..."
                value={menuSearchQuery}
                onChange={(e) => setMenuSearchQuery(e.target.value)}
                size="small"
                aria-label="Search menu items"
                sx={{ backgroundColor: 'white', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl fullWidth size="small" sx={{ backgroundColor: 'white', borderRadius: 2 }}>
                <InputLabel id="category-filter-label">Category</InputLabel>
                <Select
                  labelId="category-filter-label"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as number | 'all')}
                  label="Category"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* Menu + Cart Layout */}
            {loadingMenu ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress aria-label="Loading menu" />
              </Box>
            ) : menuError ? (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{menuError}</Alert>
            ) : (
              <>
                {isMobile ? (
                  <Box sx={{ width: '100%' }}>
                    {filteredMenuItems.map(item => (
                      <Box key={item.id} sx={{ mb: 2 }}>
                        <MenuItemCard item={item} />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Grid container spacing={3} alignItems="flex-start">
                    <Grid item xs={12} md={7} lg={8}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                        {filteredMenuItems.map(item => (
                          <MenuItemCard key={item.id} item={item} />
                        ))}
                      </Box>
                    </Grid>

                    {/* Sticky Cart Sidebar */}
                    <Grid item xs={12} md={5} lg={4}>
                      <Paper
                        sx={{
                          p: 2.5,
                          position: 'sticky',
                          top: { xs: 64, md: 80 },
                          borderRadius: 3,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                          border: '1px solid',
                          borderColor: alpha(theme.palette.primary.main, 0.1),
                          maxHeight: 'calc(100vh - 100px)',
                          overflow: 'auto',
                        }}
                      >
                        <Typography
                          variant="h6"
                          component="h2"
                          gutterBottom
                          sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, color: 'primary.main' }}
                        >
                          <ShoppingCart sx={{ mr: 1, fontSize: '1.25rem' }} />
                          Order Details
                        </Typography>

                        <Stack spacing={2}>
  <Button
    fullWidth
    variant="outlined"
    size="large"
    startIcon={<Person />}
    onClick={handleOpenCartDialog}
    sx={{
      borderRadius: 2,
      textTransform: 'none',
      fontWeight: 600,
      justifyContent: 'flex-start',
      py: 1.5,
      borderWidth: 2,
      '&:hover': { borderWidth: 2 }
    }}
  >
    {customerName || 'Enter Customer Name'}
  </Button>

  <Button
    fullWidth
    variant="outlined"
    size="large"
    startIcon={<TableRestaurant />}
    onClick={handleOpenCartDialog}
    sx={{
      borderRadius: 2,
      textTransform: 'none',
      fontWeight: 600,
      justifyContent: 'flex-start',
      py: 1.5,
      borderWidth: 2,
      '&:hover': { borderWidth: 2 }
    }}
  >
    {tableNumber || 'Enter Table Number'}
  </Button>

  <Divider />

                          <Typography variant="subtitle1" fontWeight={600}>
                            Cart Items ({cart.length})
                          </Typography>

                          {cart.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                              <ShoppingCart sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                              <Typography color="textSecondary" variant="body2">
                                Cart is empty. Add items from the menu.
                              </Typography>
                            </Box>
                          ) : (
                            <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                              {cart.map(item => (
                                <CartItemRow
                                  key={item.variantId}
                                  item={item}
                                  onUpdateQuantity={handleMainCartQuantityUpdate}
                                  onRemove={handleMainCartRemove}
                                />
                              ))}
                            </List>
                          )}

                          <Divider />

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" fontWeight={700}>Total:</Typography>
                            <Typography variant="h6" color="primary" fontWeight={700}>
                              ₹{calculateTotal('main').toFixed(2)}
                            </Typography>
                          </Box>

                          <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            startIcon={isCreatingOrder ? <CircularProgress size={20} color="inherit" /> : <Send />}
                            onClick={handleCreateOrder}
                            disabled={cart.length === 0 || !customerName.trim() || !tableNumber.trim() || isCreatingOrder}
                            sx={{
                              borderRadius: 2,
                              fontWeight: 600,
                              py: 1.5,
                              textTransform: 'none',
                              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                            }}
                          >
                            {isCreatingOrder ? 'Creating Order...' : 'Create Order'}
                          </Button>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                )}
              </>
            )}
          </Box>
        )}

        {/* TAB 1: ACTIVE ORDERS */}
        {activeTab === 1 && (
          <Box role="tabpanel" id="tabpanel-1" aria-labelledby="tab-1">
            <TextField
              fullWidth
              placeholder="Search orders by table number, customer name, or order ID..."
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              size="small"
              aria-label="Search orders"
              sx={{ mb: 3, backgroundColor: 'white', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
            
            {isLoadingOrders ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress aria-label="Loading orders" />
              </Box>
            ) : filteredActiveOrders.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                {orderSearchQuery ? 'No orders found matching your search.' : 'No active orders found.'}
              </Alert>
            ) : (
              <Box sx={{ width: '100%' }}>
                {filteredActiveOrders.map(order => (
                  <Card
                    key={order.id}
                    sx={{
                      mb: 2,
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      overflow: 'hidden',
                      backgroundColor: 'white',border: '1px solid',
                      borderColor: alpha(theme.palette.primary.main, 0.1),
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': { boxShadow: '0 8px 32px rgba(0,0,0,0.12)', transform: 'translateY(-2px)' }
                    }}
                  >
                    <Box
                      sx={{
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        color: 'white',
                        p: isMobile ? 2 : 2.5
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography
                            variant="h6"
                            component="h3"
                            sx={{ 
                              fontWeight: 700, 
                              fontSize: isMobile ? '1.1rem' : '1.2rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1 
                            }}
                          >
                            <TableRestaurant sx={{ fontSize: isMobile ? '1.3rem' : '1.4rem' }} />
                            Table {order.table_number}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              opacity: 0.95,
                              fontSize: isMobile ? '0.9rem' : '0.95rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              mt: 0.5,
                              fontWeight: 500
                            }}
                          >
                            <Person sx={{ fontSize: isMobile ? '1rem' : '1.1rem' }} />
                            {order.customer_name}
                          </Typography>
                        </Box>
                        <Chip
                          label={`#${order.id}`}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(255,255,255,0.25)',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: isMobile ? '0.75rem' : '0.8rem',
                            height: isMobile ? 26 : 28
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ opacity: 0.85, fontSize: isMobile ? '0.75rem' : '0.8rem' }}>
                        {new Date(order.created_at).toLocaleString()}
                      </Typography>
                    </Box>

                    <CardContent sx={{ flexGrow: 1, p: isMobile ? 2 : 2.5 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ 
                          mb: 1.5, 
                          fontWeight: 700, 
                          color: 'text.secondary', 
                          fontSize: isMobile ? '0.85rem' : '0.9rem', 
                          letterSpacing: 0.5 
                        }}
                      >
                        ORDER ITEMS ({order.order_items.length})
                      </Typography>
                      <List dense sx={{ maxHeight: isMobile ? 250 : 200, overflow: 'auto' }}>
                        {order.order_items.map(item => (
                          <ListItem
                            key={item.id}
                            disableGutters
                            sx={{ 
                              py: isMobile ? 1.5 : 1, 
                              borderBottom: '1px solid', 
                              borderColor: 'grey.100', 
                              '&:last-child': { borderBottom: 'none' } 
                            }}
                          >
                            <Box sx={{ width: '100%' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                <Typography
                                  variant="body2"
                                  sx={{ 
                                    fontWeight: 600, 
                                    fontSize: isMobile ? '0.95rem' : '1rem', 
                                    lineHeight: 1.3, 
                                    flex: 1, 
                                    pr: 1 
                                  }}
                                >
                                  {item.name}
                                </Typography>
                                <Chip
                                  label={item.status}
                                  size="small"
                                  color={
                                    item.status === 'COMPLETED' ? 'success' :
                                    item.status === 'ACCEPTED' ? 'info' :
                                    item.status === 'PENDING' ? 'warning' : 'error'
                                  }
                                  sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, minWidth: 70 }}
                                />
                              </Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ 
                                  fontSize: isMobile ? '0.85rem' : '0.9rem', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 1, 
                                  flexWrap: 'wrap' 
                                }}
                              >
                                <span>{item.variant_name}</span>
                                <span>•</span>
                                <span>Qty: {item.quantity}</span>
                              </Typography>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>

                    <Box sx={{ p: isMobile ? 2 : 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        size={isMobile ? 'medium' : 'large'}
                        startIcon={<Add />}
                        onClick={() => handleSelectOrderForAddingItems(order)}
                        sx={{
                          height: isMobile ? 44 : 48,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: isMobile ? '0.875rem' : '0.95rem',
                          borderWidth: 2,
                          '&:hover': { borderWidth: 2, backgroundColor: 'primary.50' }
                        }}
                      >
                        Add Items to Order
                      </Button>
                    </Box>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Mobile FAB */}
        {isMobile && activeTab === 0 && <MobileCartFab />}

        {/* Cart Details Dialog */}
        <CartDetailsDialog />

        {/* ADD ITEMS MODAL */}
        <Dialog
          open={isAddItemsModalOpen}
          onClose={handleCloseAddItemsModal}
          fullScreen={isMobile}
          maxWidth="lg"
          fullWidth
          PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, background: '#f5f7fa' } }}
          role="dialog"
          aria-labelledby="add-items-title"
        >
          <DialogTitle
            id="add-items-title"
            sx={{ p: isMobile ? 2 : 3, backgroundColor: 'white', borderBottom: '1px solid', borderColor: 'grey.200' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                Add Items - Table {selectedOrder?.table_number}
              </Typography>
              <IconButton
                onClick={handleCloseAddItemsModal}
                size="small"
                sx={{ backgroundColor: 'grey.100', '&:hover': { backgroundColor: 'grey.200' } }}
                aria-label="Close add items dialog"
              >
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ p: isMobile ? 1 : 2, background: '#f5f7fa' }}>
            <Grid container spacing={isMobile ? 1 : 2}>
              <Grid item xs={12} md={8}>
                <Stack spacing={2} sx={{ mb: 3, p: isMobile ? 1 : 0 }}>
                  <TextField
                    fullWidth
                    placeholder="Search menu items..."
                    value={modalMenuSearchQuery}
                    onChange={(e) => setModalMenuSearchQuery(e.target.value)}
                    size="small"
                    aria-label="Search menu items in modal"
                    sx={{ backgroundColor: 'white', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>

                <Typography variant="h6" component="h3" gutterBottom sx={{ p: isMobile ? 1 : 0, fontWeight: 600 }}>
                  <RestaurantMenu sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Available Menu Items
                </Typography>

                <Box sx={{ width: '100%' }}>
                  {filteredMenuItems.map(item => (
                    <Box key={item.id} sx={{ mb: 2 }}>
                      <MenuItemCard item={item} targetCart="additional" />
                    </Box>
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper
                  sx={{
                    p: 2,
                    position: 'sticky',
                    top: 20,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.1)
                  }}
                >
                  <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                    Items to Add
                  </Typography>

                  {additionalCart.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <AddShoppingCart sx={{ fontSize: 48, color: 'grey.300', mb: 1 }} />
                      <Typography color="textSecondary" variant="body2">
                        No items selected
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {additionalCart.map(item => (
                          <CartItemRow
                            key={item.variantId}
                            item={item}
                            onUpdateQuantity={handleAdditionalCartQuantityUpdate}
                            onRemove={handleAdditionalCartRemove}
                          />
                        ))}
                      </List>

                      <Divider />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={700}>Total:</Typography>
                        <Typography variant="h6" color="primary" fontWeight={700}>
                          ₹{calculateTotal('additional').toFixed(2)}
                        </Typography>
                      </Box>
                    </Stack>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions
            sx={{ p: 2, backgroundColor: 'white', borderTop: '1px solid', borderColor: 'grey.200', gap: 1 }}
          >
            <Button
              onClick={handleCloseAddItemsModal}
              size={isMobile ? 'medium' : 'small'}
              variant="outlined"
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAddItemsToExistingOrder}
              disabled={additionalCart.length === 0}
              size={isMobile ? 'medium' : 'small'}
              startIcon={<Add />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
              }}
            >
              Add {additionalCart.length} Item{additionalCart.length !== 1 ? 's' : ''}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default CaptainOrders;