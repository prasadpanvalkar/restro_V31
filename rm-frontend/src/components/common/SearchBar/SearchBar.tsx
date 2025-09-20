// src/components/common/SearchBar/SearchBar.tsx
import React, { useState } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Chip,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  Search,
  Clear,
  FilterList,
} from '@mui/icons-material';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  filters?: {
    label: string;
    value: string;
    options: { label: string; value: any }[];
  }[];
  onFilterChange?: (filterKey: string, value: any) => void;
  activeFilters?: Record<string, any>;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  onSearch,
  filters = [],
  onFilterChange,
  activeFilters = {},
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <Box display="flex" gap={1} alignItems="center">
      <TextField
        fullWidth
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClear}>
                <Clear />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      
      {filters.length > 0 && (
        <>
          <Badge badgeContent={activeFilterCount} color="primary">
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <FilterList />
            </IconButton>
          </Badge>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            {filters.map((filter) => (
              <Box key={filter.value} sx={{ px: 2, py: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  {filter.label}
                </Typography>
                <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
                  {filter.options.map((option) => (
                    <Chip
                      key={option.value}
                      label={option.label}
                      size="small"
                      color={
                        activeFilters[filter.value] === option.value
                          ? 'primary'
                          : 'default'
                      }
                      onClick={() => {
                        if (onFilterChange) {
                          onFilterChange(
                            filter.value,
                            activeFilters[filter.value] === option.value
                              ? null
                              : option.value
                          );
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Menu>
        </>
      )}
    </Box>
  );
};