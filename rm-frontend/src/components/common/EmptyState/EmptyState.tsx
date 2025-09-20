// src/components/common/EmptyState/EmptyState.tsx
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

interface EmptyStateProps {
  icon?: SvgIconComponent;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={8}
      px={3}
      textAlign="center"
    >
      {Icon && (
        <Icon
          sx={{
            fontSize: 64,
            color: 'text.secondary',
            mb: 2,
          }}
        />
      )}
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="textSecondary" paragraph>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ mt: 2 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};