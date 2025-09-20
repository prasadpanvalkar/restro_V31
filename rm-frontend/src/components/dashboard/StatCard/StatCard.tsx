// src/components/dashboard/StatCard/StatCard.tsx
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  loading?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
  trendValue,
  loading = false,
  onClick,
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp fontSize="small" sx={{ color: 'success.main' }} />;
      case 'down':
        return <TrendingDown fontSize="small" sx={{ color: 'error.main' }} />;
      case 'flat':
        return <TrendingFlat fontSize="small" sx={{ color: 'warning.main' }} />;
      default:
        return null;
    }
  };

  return (
    <Card
      elevation={2}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s',
        '&:hover': onClick
          ? {
              transform: 'translateY(-4px)',
              boxShadow: 4,
            }
          : {},
      }}
      onClick={onClick}
    >
      {loading && <LinearProgress color={color} />}
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography color="textSecondary" variant="caption" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
            {trend && trendValue && (
              <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                {getTrendIcon()}
                <Typography variant="caption" color="textSecondary">
                  {trendValue}
                </Typography>
              </Box>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                backgroundColor: `${color}.lighter`,
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};