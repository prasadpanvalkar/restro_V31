// src/components/common/DataTable/DataTable.tsx
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TableSortLabel,
  Checkbox,
  IconButton,
  Toolbar,
  Typography,
  Tooltip,
  Box,
} from '@mui/material';
import { Delete, Edit, Visibility } from '@mui/icons-material';

interface Column {
  id: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  format?: (value: any) => string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column[];
  data: T[];
  title?: string;
  selectable?: boolean;
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  onSelectionChange?: (selected: T[]) => void;
  loading?: boolean;
}

export function DataTable<T extends { id: number | string }>({
  columns,
  data,
  title,
  selectable = false,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  onSelectionChange,
  loading = false,
}: DataTableProps<T>) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [selected, setSelected] = React.useState<(number | string)[]>([]);
  const [orderBy, setOrderBy] = React.useState<string>('');
  const [order, setOrder] = React.useState<'asc' | 'desc'>('asc');

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = data.map((n) => n.id);
      setSelected(newSelected);
      if (onSelectionChange) {
        onSelectionChange(data);
      }
    } else {
      setSelected([]);
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    }
  };

  const handleSelectOne = (id: number | string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: (number | string)[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
    if (onSelectionChange) {
      const selectedRows = data.filter((row) => newSelected.includes(row.id));
      onSelectionChange(selectedRows);
    }
  };

  const handleSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedData = React.useMemo(() => {
    if (!orderBy) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as any)[orderBy];
      const bValue = (b as any)[orderBy];

      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [data, orderBy, order]);

  const paginatedData = sortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper elevation={2}>
      {(title || selected.length > 0) && (
        <Toolbar>
          {selected.length > 0 ? (
            <Typography color="inherit" variant="subtitle1" component="div">
              {selected.length} selected
            </Typography>
          ) : (
            <Typography variant="h6" component="div">
              {title}
            </Typography>
          )}
        </Toolbar>
      )}
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selected.length > 0 && selected.length < data.length
                    }
                    checked={data.length > 0 && selected.length === data.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sortDirection={orderBy === column.id ? order : false}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {(onView || onEdit || onDelete) && (
                <TableCell align="center">Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row) => {
              const isSelected = selected.includes(row.id);
              return (
                <TableRow
                  key={row.id}
                  hover
                  onClick={() => onRowClick && onRowClick(row)}
                  selected={isSelected}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectOne(row.id);
                        }}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => {
                    const value = (row as any)[column.id];
                    return (
                      <TableCell key={column.id} align={column.align}>
                        {column.format ? column.format(value) : value}
                      </TableCell>
                    );
                  })}
                  {(onView || onEdit || onDelete) && (
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={1}>
                        {onView && (
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onView(row);
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onEdit && (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(row);
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onDelete && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(row);
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
    </Paper>
  );
}