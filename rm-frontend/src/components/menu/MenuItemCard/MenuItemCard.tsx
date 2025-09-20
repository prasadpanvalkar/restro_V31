// src/components/menu/MenuItemCard/MenuItemCard.tsx
import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Edit,
  Delete,
  ExpandMore,
  ExpandLess,
  LocalOffer,
} from '@mui/icons-material';
import { MenuItem } from '@/types/menu.types';

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
  onToggleAvailability: (id: number, available: boolean) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" gutterBottom>
              {item.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              {item.description}
            </Typography>
          </Box>
          <Chip
            label={item.is_available ? 'Available' : 'Unavailable'}
            color={item.is_available ? 'success' : 'default'}
            size="small"
            onClick={() => onToggleAvailability(item.id, !item.is_available)}
          />
        </Box>

        <Box display="flex" gap={0.5} flexWrap="wrap" mb={1}>
          {item.food_types?.map((type) => (
            <Chip key={type} label={type} size="small" variant="outlined" />
          ))}
          {item.cuisines?.map((cuisine) => (
            <Chip
              key={cuisine}
              label={cuisine}
              size="small"
              variant="outlined"
              color="primary"
            />
          ))}
        </Box>

        <Button
          size="small"
          onClick={() => setExpanded(!expanded)}
          endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
        >
          {item.variants.length} Variants
        </Button>

        <Collapse in={expanded}>
          <Box mt={2}>
            {item.variants.map((variant) => (
              <Box
                key={variant.variant_name}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                p={1}
                borderBottom="1px solid #e0e0e0"
              >
                <Typography variant="body2">{variant.variant_name}</Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Chip
                    icon={<LocalOffer />}
                    label={`₹${variant.price}`}
                    size="small"
                    color="primary"
                  />
                  <Typography variant="caption" color="textSecondary">
                    {variant.preparation_time} min
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Collapse>
      </CardContent>
      <CardActions>
        <IconButton size="small" onClick={() => onEdit(item)}>
          <Edit />
        </IconButton>
        <IconButton size="small" color="error" onClick={() => onDelete(item.id)}>
          <Delete />
        </IconButton>
      </CardActions>
    </Card>
  );
};