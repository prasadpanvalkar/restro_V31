// src/pages/Cashier/CashierDashboard.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Container,
  useTheme,
  useMediaQuery,
  Stack,
  Divider,
  IconButton,
  Skeleton,
  Avatar,
  LinearProgress,
  alpha,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
} from '@mui/material';
import { 
  Payment, 
  ReceiptLong,
  Refresh,
  Search,
  Clear,
  ExpandMore,
  ExpandLess,
  Timer,
  Close,
  CheckCircle,
  CreditCard,
  AccountBalance,
  QrCode2,
  ShoppingBag,
  AttachMoney,
  TrendingUp,
  TableRestaurant,
  Restaurant,
  AccessTime,
  Person,
  Receipt,
} from '@mui/icons-material';
import { useWebSocket } from '@/hooks/useWebSocket';
import billingService from '@/services/api/billing.service';
import authService from '@/services/api/auth.service';
import { Order, PaymentMethod, CashierNotification } from '@/types/billing.types';
import toast from 'react-hot-toast';

// 🔥 FIXED: Extracted stable components to prevent re-renders
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

interface BillCardProps {
  bill: Order;
  onPaymentClick: (bill: Order) => void;
  onToggleExpand: (billId: number) => void;
  isExpanded: boolean;
  calculateTotal: (bill: Order) => number;
  getTimeElapsed: (createdAt: string) => string;
  theme: any;
}

const BillCard = React.memo(({ 
  bill, 
  onPaymentClick, 
  onToggleExpand, 
  isExpanded, 
  calculateTotal, 
  getTimeElapsed, 
  theme 
}: BillCardProps) => {
  const total = calculateTotal(bill);
  const itemCount = bill.order_items.reduce((sum, item) => sum + item.quantity, 0);
  const visibleItems = isExpanded ? bill.order_items : bill.order_items.slice(0, 1);
  const hasMoreItems = bill.order_items.length > 1;

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '0.5px solid',
        borderColor: theme.palette.primary.main,
        background: 'white',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
        },
      }}
    >
      {/* Condensed Header */}
      <Box sx={{ p: 2, pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                width: 36,
                height: 36,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                fontSize: '1rem',
                fontWeight: 'bold',
              }}
            >
              {bill.table_number}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight="700" color="primary.main" sx={{ lineHeight: 1 }}>
                Table {bill.table_number}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Timer sx={{ fontSize: 10 }} />
                {getTimeElapsed(bill.created_at)}
              </Typography>
            </Box>
          </Stack>
          <Chip
            size="small"
            label={`#${bill.id}`}
            sx={{
              borderRadius: 1.5,
              fontWeight: 700,
              fontSize: '0.7rem',
              height: 22,
              background: alpha(theme.palette.info.main, 0.1),
              color: theme.palette.info.main,
            }}
          />
        </Stack>
      </Box>

      {/* Condensed Items List */}
      <CardContent sx={{ p: 2, pt: 0, pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography variant="caption" fontWeight="600" color="text.primary" sx={{ fontSize: '0.75rem' }}>
            {itemCount} Items
          </Typography>
        </Stack>

        <Box sx={{ 
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.5,
          overflow: 'hidden',
          background: alpha(theme.palette.grey[50], 0.5)
        }}>
          {visibleItems.map((item, index) => (
            <Box
              key={`${bill.id}-${item.id}-${index}`}
              sx={{
                p: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: index < visibleItems.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" fontWeight="600" color="text.primary" noWrap>
                  {item.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                  {item.variant_name} × {item.quantity}
                </Typography>
              </Box>
              <Typography variant="caption" fontWeight="700" color="success.main" sx={{ fontSize: '0.75rem' }}>
                ₹{(Number(item.price || 0) * item.quantity).toFixed(0)}
              </Typography>
            </Box>
          ))}
          
          {hasMoreItems && (
            <Box sx={{ p: 0.5 }}>
              <Button
                fullWidth
                size="small"
                onClick={() => onToggleExpand(bill.id)}
                endIcon={isExpanded ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  color: 'primary.main',
                  fontSize: '0.7rem',
                  py: 0.5,
                  minHeight: 28,
                }}
              >
                {isExpanded ? 'Less' : `+${bill.order_items.length - 1} More`}
              </Button>
            </Box>
          )}
        </Box>
      </CardContent>

      {/* Condensed Footer */}
      <Box sx={{ p: 2, pt: 0 }}>
        <Divider sx={{ mb: 1.5 }} />
        
        {/* Total Section */}
        <Box sx={{ 
          p: 1.5, 
          borderRadius: 2, 
          background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)}, ${alpha(theme.palette.success.main, 0.12)})`,
          border: '1px solid',
          borderColor: alpha(theme.palette.success.main, 0.2),
          mb: 1.5
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ fontSize: '0.7rem' }}>
                Total
              </Typography>
              <Typography variant="h6" fontWeight="900" color="success.main" sx={{ lineHeight: 1 }}>
                ₹{total.toFixed(2)}
              </Typography>
            </Box>
            <Chip 
              size="small" 
              label="Pending" 
              color="warning"
              sx={{
                fontWeight: 700,
                fontSize: '0.65rem',
                height: 20,
              }}
            />
          </Stack>
        </Box>

        {/* Action Button */}
        <Button
          variant="contained"
          fullWidth
          size="small"
          startIcon={<Payment sx={{ fontSize: 16 }} />}
          onClick={() => onPaymentClick(bill)}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.8rem',
            py: 1.25,
            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
          }}
        >
          Process Payment
        </Button>
      </Box>
    </Card>
  );
});

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  selectedBill: Order | null;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onProcessPayment: () => void;
  processingPayment: boolean;
  calculateTotal: (bill: Order) => number;
  getTimeElapsed: (createdAt: string) => string;
  theme: any;
}

const PaymentDialog = React.memo(({
  open,
  onClose,
  selectedBill,
  paymentMethod,
  onPaymentMethodChange,
  onProcessPayment,
  processingPayment,
  calculateTotal,
  getTimeElapsed,
  theme
}: PaymentDialogProps) => {
  const [showOrderDetails, setShowOrderDetails] = useState(true);
  const selectedTotal = selectedBill ? calculateTotal(selectedBill) : 0;
  const itemCount = selectedBill ? selectedBill.order_items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const subtotal = selectedBill ? selectedBill.order_items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0) : 0;
  const discount = 0; // No discount for now

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          maxHeight: '90vh',
        },
      }}
      transitionDuration={{ enter: 300, exit: 200 }}
    >
      {processingPayment && <LinearProgress />}
      
      <DialogTitle sx={{ 
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'white',
        pb: 2,
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Receipt sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h6" fontWeight="600">
                Order Details & Payment
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Table {selectedBill?.table_number} • Bill #{selectedBill?.id}
              </Typography>
            </Box>
          </Stack>
          <IconButton
            onClick={onClose}
            sx={{ color: 'white' }}
            disabled={processingPayment}
          >
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, px: 3, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
        {selectedBill && (
          <Grid container spacing={3}>
            {/* Left Column - Order Details */}
            <Grid item xs={12} md={7}>
              {/* Order Info Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 2,
                  background: alpha(theme.palette.primary.main, 0.03),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.1),
                }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight="600" color="primary.main">
                      Order Information
                    </Typography>
                    <Chip
                      size="small"
                      label={showOrderDetails ? 'Hide Details' : 'Show Details'}
                      onClick={() => setShowOrderDetails(!showOrderDetails)}
                      clickable
                      sx={{
                        backgroundColor: theme.palette.primary.main,
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </Stack>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TableRestaurant color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Table Number
                          </Typography>
                          <Typography variant="body1" fontWeight="600">
                            {selectedBill.table_number}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AccessTime color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Order Time
                          </Typography>
                          <Typography variant="body1" fontWeight="600">
                            {getTimeElapsed(selectedBill.created_at)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Person color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Customer
                          </Typography>
                          <Typography variant="body1" fontWeight="600">
                            {selectedBill.customer_name || 'Walk-in Customer'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Restaurant color="action" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Total Items
                          </Typography>
                          <Typography variant="body1" fontWeight="600">
                            {itemCount} items
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>
                </Stack>
              </Paper>

              {/* Order Items */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ 
                  p: 2, 
                  background: alpha(theme.palette.grey[100], 0.5),
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight="600">
                      Order Items
                    </Typography>
                    <Chip
                      size="small"
                      label={`${selectedBill.order_items.length} items`}
                      color="primary"
                      variant="outlined"
                    />
                  </Stack>
                </Box>

                <Collapse in={showOrderDetails}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 600, backgroundColor: alpha(theme.palette.grey[50], 0.8) } }}>
                          <TableCell>Item</TableCell>
                          <TableCell>Variant</TableCell>
                          <TableCell align="center">Qty</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedBill.order_items.map((item, index) => (
                          <TableRow 
                            key={`${selectedBill.id}-${item.id}-${index}`}
                            sx={{ '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.grey[50], 0.3) } }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight="600">
                                {item.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {item.variant_name}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={item.quantity} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                                sx={{ minWidth: 35, fontSize: '0.75rem' }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="500">
                                ₹{Number(item.price || 0).toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="600" color="success.main">
                                ₹{(Number(item.price || 0) * item.quantity).toFixed(2)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Collapse>

                {!showOrderDetails && (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Click "Show Details" to view all items
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Right Column - Payment Details */}
            <Grid item xs={12} md={5}>
              {/* Bill Summary */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 2,
                  background: alpha(theme.palette.success.main, 0.03),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.success.main, 0.2),
                }}
              >
                <Typography variant="h6" fontWeight="600" color="success.main" gutterBottom>
                  Bill Summary
                </Typography>
                
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Subtotal ({itemCount} items)</Typography>
                    <Typography fontWeight="600">₹{subtotal.toFixed(2)}</Typography>
                  </Stack>
                  
                  {discount > 0 && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Discount</Typography>
                      <Typography fontWeight="600" color="error.main">-₹{discount.toFixed(2)}</Typography>
                    </Stack>
                  )}
                  
                  <Divider />
                  
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight="600">Total Amount</Typography>
                    <Typography variant="h5" fontWeight="700" color="success.main">
                      ₹{selectedTotal.toFixed(2)}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>

              {/* Payment Method Selection */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                    Select Payment Method
                  </FormLabel>
                  <RadioGroup
                    value={paymentMethod}
                    onChange={(e) => onPaymentMethodChange(e.target.value as PaymentMethod)}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        mb: 2,
                        p: 2,
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: paymentMethod === 'OFFLINE' ? 'primary.main' : 'divider',
                        background: paymentMethod === 'OFFLINE' ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          borderColor: 'primary.main',
                          background: alpha(theme.palette.primary.main, 0.02),
                        },
                      }}
                      onClick={() => onPaymentMethodChange('OFFLINE')}
                    >
                      <FormControlLabel
                        value="OFFLINE"
                        control={<Radio />}
                        label={
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Stack direction="row" spacing={1}>
                              <CreditCard color={paymentMethod === 'OFFLINE' ? 'primary' : 'inherit'} />
                              <AccountBalance color={paymentMethod === 'OFFLINE' ? 'primary' : 'inherit'} />
                            </Stack>
                            <Box>
                              <Typography fontWeight="600">Offline Payment</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Cash / Card / Other offline methods
                              </Typography>
                            </Box>
                          </Stack>
                        }
                      />
                    </Paper>

                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: paymentMethod === 'ONLINE' ? 'primary.main' : 'divider',
                        background: paymentMethod === 'ONLINE' ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          borderColor: 'primary.main',
                          background: alpha(theme.palette.primary.main, 0.02),
                        },
                      }}
                      onClick={() => onPaymentMethodChange('ONLINE')}
                    >
                      <FormControlLabel
                        value="ONLINE"
                        control={<Radio />}
                        label={
                          <Stack direction="row" spacing={2} alignItems="center">
                            <QrCode2 color={paymentMethod === 'ONLINE' ? 'primary' : 'inherit'} />
                            <Box>
                              <Typography fontWeight="600">Online Payment</Typography>
                              <Typography variant="caption" color="text.secondary">
                                UPI / Net Banking / Digital Wallets
                              </Typography>
                            </Box>
                          </Stack>
                        }
                      />
                    </Paper>
                  </RadioGroup>
                </FormControl>
              </Paper>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          onClick={onClose}
          disabled={processingPayment}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onProcessPayment}
          variant="contained"
          color="success"
          disabled={processingPayment}
          startIcon={processingPayment ? undefined : <CheckCircle />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            minWidth: 180,
          }}
        >
          {processingPayment ? 'Processing Payment...' : `Confirm Payment ₹${selectedBill ? calculateTotal(selectedBill).toFixed(2) : '0.00'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

const LoadingSkeleton = React.memo(() => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Grid container spacing={2}>
      {Array.from({ length: 8 }).map((_, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
          <Card sx={{ borderRadius: 3, height: 280 }}>
            <CardContent sx={{ p: 2 }}>
              <Skeleton variant="circular" width={36} height={36} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={16} />
              <Skeleton variant="rectangular" height={80} sx={{ my: 2, borderRadius: 1.5 }} />
              <Skeleton variant="rectangular" height={32} sx={{ borderRadius: 2 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
});

const CashierDashboard: React.FC = () => {
  const [pendingBills, setPendingBills] = useState<Order[]>([]);
  const [selectedBill, setSelectedBill] = useState<Order | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('OFFLINE');
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBills, setExpandedBills] = useState<Set<number>>(new Set());
  const [restaurantSlug, setRestaurantSlug] = useState<string>('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Get restaurant slug from user context or auth service
  useEffect(() => {
    const getRestaurantSlug = async () => {
      try {
        // Get the current user's restaurant slug from auth service or context
        const userInfo = authService.getCurrentUser();
        if (userInfo?.restaurant_slug) {
          setRestaurantSlug(userInfo.restaurant_slug);
        } else {
          // Fallback - you might want to get this from a different source
          setRestaurantSlug('md-hotel'); // Based on your server logs
        }
      } catch (error) {
        console.error('Failed to get restaurant slug:', error);
        setRestaurantSlug('md-hotel'); // Fallback
      }
    };
    
    getRestaurantSlug();
  }, []);

  // 🔥 FIXED: Use stable WebSocket handler with better error handling
  const wsHandlerRef = useRef<(data: CashierNotification) => void>();
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    wsHandlerRef.current = (data: CashierNotification) => {
      try {
        if (data.table_number && data.items) {
          const newBill: Order = {
            id: data.id,
            table_number: data.table_number,
            customer_name: data.customer_name || '',
            created_at: new Date().toISOString(),
            order_items: data.items.map((item, index) => ({
              id: index,
              name: item.name,
              variant_name: item.variant_name,
              quantity: item.quantity,
              status: 'COMPLETED',
              price: Number(item.price) || 0, // Ensure price is a number
            })),
            payment_status: 'PENDING',
            total_price: Number(data.totalAmount) || 0, // Ensure total is a number
          };
          
          setPendingBills((prev) => {
            // Check if bill already exists to prevent duplicates
            if (prev.some(bill => bill.id === newBill.id)) {
              return prev;
            }
            return [...prev, newBill];
          });
          
          toast.success(`Order ready for payment - Table ${data.table_number}`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        toast.error('Error processing new order notification');
      }
    };
  }, []);

  // Only connect WebSocket when we have a restaurant slug
  useWebSocket({
    role: 'CASHIER',
    restaurantSlug: restaurantSlug,
    onMessage: (data) => wsHandlerRef.current?.(data),
    onConnect: () => setWsConnected(true),
    onDisconnect: () => setWsConnected(false),
    onError: (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    },
    enabled: !!restaurantSlug, // Only enable when we have a restaurant slug
  });

  useEffect(() => {
    fetchPendingBills();
  }, []);

  const fetchPendingBills = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const token = authService.getToken();
      if (!token) {
        toast.error('Please log in to access pending bills');
        return;
      }

      const bills = await billingService.getPendingBills();
      setPendingBills(bills);
    } catch (error: any) {
      console.error('Error fetching pending bills:', error);
      
      // Handle specific error cases
      if (error?.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        // Redirect to login or refresh token
      } else if (error?.response?.status === 403) {
        toast.error('Access denied. Check your permissions.');
      } else {
        toast.error('Failed to fetch pending bills. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔥 OPTIMIZED: Stable callback handlers
  const handlePaymentClick = useCallback((bill: Order) => {
    setSelectedBill(bill);
    setPaymentMethod('OFFLINE');
    setPaymentDialogOpen(true);
  }, []);

  const handleProcessPayment = async () => {
    if (!selectedBill) return;

    try {
      setProcessingPayment(true);
      
      // Check authentication before processing payment
      const token = authService.getToken();
      if (!token) {
        toast.error('Please log in to process payments');
        return;
      }

      await billingService.markBillAsPaid(selectedBill.id, paymentMethod);
      
      setPendingBills((prev) => prev.filter((bill) => bill.id !== selectedBill.id));
      
      setPaymentDialogOpen(false);
      setSelectedBill(null);
      toast.success(`Payment processed successfully for Table ${selectedBill.table_number}`);
      
    } catch (error: any) {
      console.error('Error processing payment:', error);
      
      // Handle specific error cases
      if (error?.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else if (error?.response?.status === 403) {
        toast.error('Access denied. Check your permissions.');
      } else if (error?.response?.status === 404) {
        toast.error('Bill not found. It may have already been processed.');
        // Remove from local state if bill doesn't exist
        setPendingBills((prev) => prev.filter((bill) => bill.id !== selectedBill.id));
      } else {
        toast.error('Failed to process payment. Please try again.');
      }
    } finally {
      setProcessingPayment(false);
    }
  };

  // 🔥 OPTIMIZED: Memoized utility functions with proper number conversion
  const calculateTotal = useCallback((bill: Order): number => {
    if (bill.total_price && typeof bill.total_price === 'number') {
      return bill.total_price;
    }
    
    return bill.order_items.reduce((total, item) => {
      const price = Number(item.price) || 0;
      return total + price * item.quantity;
    }, 0);
  }, []);

  const getTimeElapsed = useCallback((createdAt: string): string => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? 's' : ''} ago`;
  }, []);

  const toggleBillExpansion = useCallback((billId: number) => {
    setExpandedBills(prev => {
      const newSet = new Set(prev);
      if (newSet.has(billId)) {
        newSet.delete(billId);
      } else {
        newSet.add(billId);
      }
      return newSet;
    });
  }, []);

  // 🔥 OPTIMIZED: Memoized filtered bills
  const filteredBills = useMemo(() => {
    if (!searchQuery.trim()) return pendingBills;
    
    const query = searchQuery.toLowerCase();
    return pendingBills.filter(bill => 
      bill.id.toString().includes(query) ||
      bill.table_number.toLowerCase().includes(query) ||
      (bill.customer_name && bill.customer_name.toLowerCase().includes(query)) ||
      bill.order_items.some(item => item.name.toLowerCase().includes(query))
    );
  }, [pendingBills, searchQuery]);

  // 🔥 OPTIMIZED: Memoized stats calculations
  const statsData = useMemo(() => {
    const totalAmount = filteredBills.reduce((sum, bill) => sum + calculateTotal(bill), 0);
    const avgBillAmount = filteredBills.length > 0 ? totalAmount / filteredBills.length : 0;
    const activeTables = [...new Set(filteredBills.map(bill => bill.table_number))].length;

    return {
      totalBills: filteredBills.length,
      totalAmount,
      avgBillAmount,
      activeTables
    };
  }, [filteredBills, calculateTotal]);

  const StatsSummary = useMemo(() => (
                <Grid container spacing={isMobile ? 1.5 : 2} sx={{ mb: 3 }}>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatsCard
          title="Pending Bills"
          value={statsData.totalBills}
          icon={<ShoppingBag />}
          gradient={`linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`}
          isMobile={isMobile}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatsCard
          title="Total Pending"
          value={`₹${statsData.totalAmount.toFixed(0)}`}
          icon={<AttachMoney />}
          gradient={`linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`}
          isMobile={isMobile}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatsCard
          title="Average Bill"
          value={`₹${statsData.avgBillAmount.toFixed(0)}`}
          icon={<TrendingUp />}
          gradient={`linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`}
          isMobile={isMobile}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <StatsCard
          title="Active Tables"
          value={statsData.activeTables}
          icon={<TableRestaurant />}
          gradient={`linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`}
          isMobile={isMobile}
        />
      </Grid>
    </Grid>
  ), [statsData, theme, isMobile]);

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
                    Cashier Dashboard
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Process payments and manage billing
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
              onClick={fetchPendingBills}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Refresh Bills
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
              placeholder="Search bills by ID, table number, customer name, or item..."
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
                Found {filteredBills.length} bill{filteredBills.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </Typography>
            )}
          </Box>
        )}

        {/* Main Content */}
        {loading ? (
          <LoadingSkeleton />
        ) : filteredBills.length === 0 ? (
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
            <ReceiptLong sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom color="text.secondary">
              {searchQuery ? 'No Bills Found' : 'No Pending Bills'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery 
                ? 'Try adjusting your search terms or clear the search to see all bills.' 
                : 'All bills have been processed. New orders will appear here automatically.'
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
          <Grid container spacing={2}>
            {filteredBills.map((bill) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 3 }} key={bill.id}>
                <BillCard
                  bill={bill}
                  onPaymentClick={handlePaymentClick}
                  onToggleExpand={toggleBillExpansion}
                  isExpanded={expandedBills.has(bill.id)}
                  calculateTotal={calculateTotal}
                  getTimeElapsed={getTimeElapsed}
                  theme={theme}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Payment Dialog */}
        <PaymentDialog
          open={paymentDialogOpen}
          onClose={() => !processingPayment && setPaymentDialogOpen(false)}
          selectedBill={selectedBill}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          onProcessPayment={handleProcessPayment}
          processingPayment={processingPayment}
          calculateTotal={calculateTotal}
          getTimeElapsed={getTimeElapsed}
          theme={theme}
        />
      </Container>
    </Box>
  );
};

export default React.memo(CashierDashboard);