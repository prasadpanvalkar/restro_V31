// src/components/cart/CartDrawer/CartDrawer.tsx
import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Divider,
  TextField,
  Badge,
} from '@mui/material';
import {
  Close,
  Add,
  Remove,
  Delete,
  ShoppingCart,
} from '@mui/icons-material';

export interface CartItem {
  id: string;
  name: string;
  variant: string;
  price: number;
  quantity: number;
}

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  customerInfo?: {
    name: string;
    table: string;
  };
  onCustomerInfoChange?: (info: { name: string; table: string }) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  open,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  customerInfo = { name: '', table: '' },
  onCustomerInfoChange,
}) => {
  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <Badge badgeContent={getTotalItems()} color="primary">
              <ShoppingCart />
            </Badge>
            <Typography variant="h6">Order Cart</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        {onCustomerInfoChange && (
          <>
            <TextField
              fullWidth
              label="Customer Name"
              value={customerInfo.name}
              onChange={(e) =>
                onCustomerInfoChange({ ...customerInfo, name: e.target.value })
              }
              margin="normal"
              size="small"
            />
            <TextField
              fullWidth
              label="Table Number"
              value={customerInfo.table}
              onChange={(e) =>
                onCustomerInfoChange({ ...customerInfo, table: e.target.value })
              }
              margin="normal"
              size="small"
            />
            <Divider sx={{ my: 2 }} />
          </>
        )}

        {items.length === 0 ? (
          <Typography color="textSecondary" align="center" sx={{ my: 4 }}>
            Cart is empty
          </Typography>
        ) : (
          <>
            <List>
              {items.map((item) => (
                <ListItem key={item.id} sx={{ px: 0 }}>
                  <ListItemText
                    primary={item.name}
                    secondary={
                      <>
                        {item.variant} - ₹{item.price}
                        <br />
                        Subtotal: ₹{(item.price * item.quantity).toFixed(2)}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box display="flex" alignItems="center">
                      <IconButton
                        size="small"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Remove fontSize="small" />
                      </IconButton>
                      <Typography sx={{ mx: 1, minWidth: 20, textAlign: 'center' }}>
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Add fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between" mb={3}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6" color="primary">
                ₹{calculateTotal().toFixed(2)}
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={onCheckout}
              disabled={
                items.length === 0 ||
                (onCustomerInfoChange &&
                  (!customerInfo.name || !customerInfo.table))
              }
            >
              Place Order
            </Button>
          </>
        )}
      </Box>
    </Drawer>
  );
};