// src/components/customer/TrackOrderButton.tsx
import React from 'react';
import { Fab, Badge, Tooltip } from '@mui/material';
import { Receipt } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { OrderSessionManager } from '@/utils/orderSession';

export const TrackOrderButton: React.FC = () => {
  const navigate = useNavigate();
  const activeOrder = OrderSessionManager.getOrder();

  if (!activeOrder) return null;

  const pendingItems = activeOrder.items.filter(i => i.status !== 'COMPLETED').length;

  return (
    <Tooltip title="Track your order">
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          zIndex: 1000,
        }}
        onClick={() => navigate(`/track/${activeOrder.restaurantSlug}`)}
      >
        <Badge badgeContent={pendingItems} color="error">
          <Receipt />
        </Badge>
      </Fab>
    </Tooltip>
  );
};