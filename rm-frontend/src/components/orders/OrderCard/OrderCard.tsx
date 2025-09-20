// src/components/orders/OrderCard/OrderCard.tsx
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
} from '@mui/material';
import { AccessTime, Person, TableBar } from '@mui/icons-material';
import { Order } from '@/types/order.types';
import { format } from 'date-fns';

interface OrderCardProps {
  order: Order;
  showActions?: boolean;
  onAction?: (orderId: number, action: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  showActions = false,
  onAction,
}) => {
  const calculateTotal = () => {
    return order.order_items.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0
    );
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6">Order #{order.id}</Typography>
            <Box display="flex" gap={1} mt={1}>
              <Chip
                icon={<TableBar />}
                label={`Table ${order.table_number}`}
                size="small"
              />
              <Chip
                icon={<Person />}
                label={order.customer_name}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
          <Box textAlign="right">
            <Chip
              label={order.payment_status}
              color={order.payment_status === 'PAID' ? 'success' : 'warning'}
              size="small"
            />
            <Typography variant="caption" display="block" mt={1}>
              <AccessTime fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              {format(new Date(order.created_at), 'HH:mm')}
            </Typography>
          </Box>
        </Box>

        <Divider />

        <List dense>
          {order.order_items.map((item) => (
            <ListItem key={item.id}>
              <ListItemText
                primary={`${item.name} (${item.variant_name})`}
                secondary={`Qty: ${item.quantity} × ₹${item.price || 0}`}
              />
              <Chip
                label={item.status}
                size="small"
                color={
                  item.status === 'COMPLETED' ? 'success' :
                  item.status === 'ACCEPTED' ? 'info' :
                  item.status === 'PENDING' ? 'warning' : 'error'
                }
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Total: ₹{order.total_price || calculateTotal()}
          </Typography>
          
          {showActions && onAction && (
            <Box display="flex" gap={1}>
              {order.payment_status === 'PENDING' && (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  onClick={() => onAction(order.id, 'pay')}
                >
                  Process Payment
                </Button>
              )}
              <Button
                size="small"
                variant="outlined"
                onClick={() => onAction(order.id, 'view')}
              >
                View Details
              </Button>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};