// src/pages/Cashier/CashierDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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
  Alert,
} from '@mui/material';
import { Payment, Receipt } from '@mui/icons-material';
import { useWebSocket } from '@/hooks/useWebSocket';
import billingService from '@/services/api/billing.service';
import authService from '@/services/api/auth.service';
import { Order, PaymentMethod, CashierNotification } from '@/types/billing.types';
import toast from 'react-hot-toast';

const CashierDashboard: React.FC = () => {
  const [pendingBills, setPendingBills] = useState<Order[]>([]);
  const [selectedBill, setSelectedBill] = useState<Order | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('OFFLINE');
  const [loading, setLoading] = useState(true);

  const user = authService.getCurrentUser();
  const restaurantSlug = 'test-restaurant'; // Should come from context

  const handleWebSocketMessage = (data: CashierNotification) => {
    // Check if this is an order ready for payment notification
    if (data.table_number && data.items) {
      // Add to pending bills
      const newBill: Order = {
        id: data.id,
        table_number: data.table_number,
        customer_name: '', // Not provided in cashier notification
        created_at: new Date().toISOString(),
        order_items: data.items.map((item, index) => ({
          id: index,
          name: item.name,
          variant_name: item.variant_name,
          quantity: item.quantity,
          status: 'COMPLETED',
          price: item.price,
        })),
        payment_status: 'PENDING',
        total_price: data.totalAmount,
      };
      
      setPendingBills((prev) => [...prev, newBill]);
      toast.success(`Order ready for payment - Table ${data.table_number}`);
    }
  };

  useWebSocket({
    role: 'CASHIER',
    restaurantSlug,
    onMessage: handleWebSocketMessage,
  });

  useEffect(() => {
    fetchPendingBills();
  }, []);

  const fetchPendingBills = async () => {
    try {
      setLoading(true);
      const bills = await billingService.getPendingBills();
      setPendingBills(bills);
    } catch (error) {
      toast.error('Failed to fetch pending bills');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentClick = (bill: Order) => {
    setSelectedBill(bill);
    setPaymentDialogOpen(true);
  };

  const processPayment = async () => {
    if (!selectedBill) return;

    try {
      await billingService.markBillAsPaid(selectedBill.id, paymentMethod);
      
      // Remove from pending bills
      setPendingBills((prev) => prev.filter((bill) => bill.id !== selectedBill.id));
      
      setPaymentDialogOpen(false);
      setSelectedBill(null);
      toast.success('Payment processed successfully');
    } catch (error) {
      toast.error('Failed to process payment');
    }
  };

  const calculateTotal = (bill: Order): number => {
    if (bill.total_price) return bill.total_price;
    
    return bill.order_items.reduce((total, item) => {
      return total + (item.price || 0) * item.quantity;
    }, 0);
  };

  if (loading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Cashier Dashboard
      </Typography>

      {pendingBills.length === 0 ? (
        <Alert severity="info">No pending bills</Alert>
      ) : (
        <Grid container spacing={3}>
          {pendingBills.map((bill) => (
            <Grid item xs={12} md={6} key={bill.id}>
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography variant="h6">
                        Table {bill.table_number}
                      </Typography>
                      <Typography color="textSecondary" variant="body2">
                        {bill.customer_name}
                      </Typography>
                    </Box>
                    <Chip
                      icon={<Receipt />}
                      label={`Bill #${bill.id}`}
                      color="primary"
                    />
                  </Box>

                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="center">Qty</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bill.order_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.name}
                            <Typography variant="caption" display="block" color="textSecondary">
                              {item.variant_name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="right">₹{item.price}</TableCell>
                          <TableCell align="right">
                            ₹{((item.price || 0) * item.quantity).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Total
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle1" fontWeight="bold">
                            ₹{calculateTotal(bill).toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    startIcon={<Payment />}
                    onClick={() => handlePaymentClick(bill)}
                    sx={{ mt: 2 }}
                  >
                    Process Payment
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)}>
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300 }}>
            <Typography variant="h6" gutterBottom>
              Total Amount: ₹{selectedBill && calculateTotal(selectedBill).toFixed(2)}
            </Typography>
            
            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <FormLabel component="legend">Payment Method</FormLabel>
              <RadioGroup
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <FormControlLabel value="OFFLINE" control={<Radio />} label="Offline / Cash / Card " />
                <FormControlLabel value="ONLINE" control={<Radio />} label="Online / UPI" />
              </RadioGroup>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button onClick={processPayment} variant="contained" color="success">
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CashierDashboard;