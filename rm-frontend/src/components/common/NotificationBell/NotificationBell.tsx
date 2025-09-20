// src/components/common/NotificationBell/NotificationBell.tsx
import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Button,
} from '@mui/material';
import { Notifications, NotificationsNone } from '@mui/icons-material';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationBellProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? <Notifications /> : <NotificationsNone />}
        </Badge>
      </IconButton>
      
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ width: 320, maxHeight: 400 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Notifications</Typography>
          </Box>
          
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No notifications
              </Typography>
            </Box>
          ) : (
            <>
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {notifications.map((notification) => (
                  <ListItem
                    key={notification.id}
                    button
                    onClick={() => onMarkAsRead(notification.id)}
                    sx={{
                      backgroundColor: notification.read ? 'transparent' : 'action.hover',
                    }}
                  >
                    <ListItemText
                      primary={notification.title}
                      secondary={
                        <>
                          {notification.message}
                          <Typography variant="caption" display="block">
                            {notification.time}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
                <Button fullWidth size="small" onClick={onClearAll}>
                  Clear All
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Popover>
    </>
  );
};