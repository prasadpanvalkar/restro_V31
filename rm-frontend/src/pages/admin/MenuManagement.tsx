// src/pages/Admin/MenuManagement.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem,
  OutlinedInput,
  FormControlLabel,
  Switch,
  Typography,
  Stack,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Tooltip,
  
} from '@mui/material';
import { 
  Edit, 
  Delete, 
  Add, 
  Remove, 
  Settings,
  Category,
  Restaurant as RestaurantIcon,
  LocalDining,
  Info,
  
} from '@mui/icons-material';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import menuService from '@/services/api/menu.service';
import { 
  MenuItem, 
  Category as CategoryType, 
  FoodType, 
  Cuisine, 
  MenuItemCreateRequest 
} from '@/types/menu.types';
import toast from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const MenuManagement: React.FC = () => {
  // State for menu items
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [attributeDialogOpen, setAttributeDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Attribute creation states
  const [newCategory, setNewCategory] = useState('');
  const [newFoodType, setNewFoodType] = useState('');
  const [newCuisine, setNewCuisine] = useState('');

  // Form for menu items
  const { control, handleSubmit, reset, watch } = useForm<MenuItemCreateRequest>({
    defaultValues: {
      name: '',
      description: '',
      category: 0,
      is_available: true,
      food_types: [],
      cuisines: [],
      variants: [{ variant_name: 'Regular', price: 0, preparation_time: 15 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsData, categoriesData, foodTypesData, cuisinesData] = await Promise.all([
        menuService.getMenuItems(),
        menuService.getCategories(),
        menuService.getFoodTypes(),
        menuService.getCuisines(),
      ]);
      
      setMenuItems(itemsData);
      setCategories(categoriesData);
      setFoodTypes(foodTypesData);
      setCuisines(cuisinesData);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Category Management
  const handleCreateCategory = async () => {
    if (!newCategory.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const response = await menuService.createCategory(newCategory);
      setCategories([...categories, response]);
      setNewCategory('');
      toast.success('Category created successfully');
    } catch (error: any) {
      if (error.response?.data?.name) {
        toast.error('Category already exists');
      } else {
        toast.error('Failed to create category');
      }
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (window.confirm('Are you sure? This will affect menu items using this category.')) {
      try {
        await menuService.deleteCategory(id);
        setCategories(categories.filter(c => c.id !== id));
        toast.success('Category deleted successfully');
        fetchData(); // Refresh menu items
      } catch (error) {
        toast.error('Failed to delete category. It may be in use.');
      }
    }
  };

  // Food Type Management
  const handleCreateFoodType = async () => {
    if (!newFoodType.trim()) {
      toast.error('Food type name is required');
      return;
    }

    try {
      const response = await menuService.createFoodType(newFoodType);
      setFoodTypes([...foodTypes, response]);
      setNewFoodType('');
      toast.success('Food type created successfully');
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error('Food type already exists');
      } else {
        toast.error('Failed to create food type');
      }
    }
  };

  const handleDeleteFoodType = async (id: number) => {
    if (window.confirm('Are you sure? This is a global attribute.')) {
      try {
        await menuService.deleteFoodType(id);
        setFoodTypes(foodTypes.filter(f => f.id !== id));
        toast.success('Food type deleted successfully');
      } catch (error) {
        toast.error('Failed to delete food type');
      }
    }
  };

  // Cuisine Management
  const handleCreateCuisine = async () => {
    if (!newCuisine.trim()) {
      toast.error('Cuisine name is required');
      return;
    }

    try {
      const response = await menuService.createCuisine(newCuisine);
      setCuisines([...cuisines, response]);
      setNewCuisine('');
      toast.success('Cuisine created successfully');
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error('Cuisine already exists');
      } else {
        toast.error('Failed to create cuisine');
      }
    }
  };

  const handleDeleteCuisine = async (id: number) => {
    if (window.confirm('Are you sure? This is a global attribute.')) {
      try {
        await menuService.deleteCuisine(id);
        setCuisines(cuisines.filter(c => c.id !== id));
        toast.success('Cuisine deleted successfully');
      } catch (error) {
        toast.error('Failed to delete cuisine');
      }
    }
  };

  // Menu Item Management
  const onSubmit = async (data: MenuItemCreateRequest) => {
    try {
      if (editingItem) {
        await menuService.updateMenuItem(editingItem.id, data);
        toast.success('Menu item updated successfully');
      } else {
        await menuService.createMenuItem(data);
        toast.success('Menu item created successfully');
      }
      setMenuDialogOpen(false);
      reset();
      setEditingItem(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to save menu item');
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    reset({
      name: item.name,
      description: item.description,
      category: item.category,
      is_available: item.is_available,
      food_types: item.food_types,
      cuisines: item.cuisines,
      variants: item.variants,
    });
    setMenuDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await menuService.deleteMenuItem(id);
        toast.success('Menu item deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete menu item');
      }
    }
  };

  const handleAddNew = () => {
    // Check if we have required attributes
    if (categories.length === 0) {
      toast.error('Please create at least one category first');
      setAttributeDialogOpen(true);
      return;
    }
    
    setEditingItem(null);
    reset();
    setMenuDialogOpen(true);
  };

  // Styled Form Components for Dark Theme
  const StyledDarkTextField = (props: any) => (
    <TextField
      {...props}
      variant="outlined"
      sx={{
        '& .MuiInputBase-root': {
          color: '#c9d1d9',
          backgroundColor: 'rgba(22, 27, 34, 0.5)',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: '#30363d',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: '#8b949e',
        },
        '& .MuiInputLabel-root': {
          color: '#8b949e',
        },
        '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#58a6ff',
        },
        '& .Mui-focused .MuiInputLabel-root': {
          color: '#58a6ff',
        },
      }}
    />
  );
  
 const StyledDarkSelect = React.forwardRef((props: any, ref) => (
  <Select
    ref={ref}
    {...props}
    MenuProps={{
      PaperProps: {
        sx: {
          backgroundColor: '#161b22',
          border: '1px solid #30363d',
          color: '#c9d1d9',
          minHeight: '40px', // Ensures dropdown has a minimum height
        },
      },
      // You can add this for better positioning if needed, though usually default is fine
      // anchorOrigin: {
      //   vertical: 'bottom',
      //   horizontal: 'left',
      // },
      // transformOrigin: {
      //   vertical: 'top',
      //   horizontal: 'left',
      // },
    }}
    sx={{
      color: '#c9d1d9',
      backgroundColor: 'rgba(22, 27, 34, 0.5)',
      '.MuiOutlinedInput-notchedOutline': {
        borderColor: '#30363d',
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#8b949e',
      },
      '.MuiSvgIcon-root': {
        color: '#8b949e',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#58a6ff',
      },
      '.MuiInputBase-input': { // Target the input itself for text color
        color: '#c9d1d9',
      },
    }}
  />
));

  if (loading) {
    return <Box sx={{ width: '100%', minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box component="span" sx={{ display: 'inline-block', width: 40, height: 40, border: '4px solid #30363d', borderTop: '4px solid #58a6ff', borderRadius: '50%', animation: 'spin 1s linear infinite',
          '@keyframes spin': {
            '0%': {
              transform: 'rotate(0deg)',
            },
            '100%': {
              transform: 'rotate(360deg)',  
            },
          }
        }} />
      </Box>;
  }

  return (
    <Box sx={{ 
        width: '100%', minHeight: '100vh', background: '#0d1117', color: '#c9d1d9',
        '&::before': { content: '""', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 15% 50%, rgba(3, 169, 244, 0.1) 0%, transparent 40%), radial-gradient(circle at 85% 30%, rgba(13, 71, 161, 0.1) 0%, transparent 40%)', zIndex: 0, pointerEvents: 'none' },
        p: { xs: 2, sm: 3, md: 4 }
    }}>
      <Box sx={{ maxWidth: '1600px', mx: 'auto', position: 'relative', zIndex: 1 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#f0f6fc' }}>Menu Management</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<Settings />} onClick={() => setAttributeDialogOpen(true)}
              sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#30363d', color: '#58a6ff', '&:hover': { borderColor: '#8b949e', backgroundColor: 'rgba(88, 166, 255, 0.1)' }}}
            >
              Manage Attributes
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={handleAddNew}
              sx={{ textTransform: 'none', fontWeight: 600, backgroundColor: '#238636', '&:hover': { backgroundColor: '#2ea043' }}}
            >
              Add Menu Item
            </Button>
          </Box>
        </Box>

        {categories.length === 0 && (
          <Alert severity="warning" sx={{ mb: 2, background: 'rgba(210, 153, 34, 0.15)', color: '#d29922', border: '1px solid rgba(210, 153, 34, 0.4)' }}>
            <strong>No categories found!</strong> Please create one before adding menu items.
            <Button size="small" onClick={() => { setAttributeDialogOpen(true); setTabValue(0); }} sx={{ ml: 2, color: '#d29922' }}>
              Create Category
            </Button>
          </Alert>
        )}

        <TableContainer component={Paper} sx={{ background: 'rgba(22, 27, 34, 0.8)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: '1px solid #30363d' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid #30363d' }}}>
                <TableCell sx={{ fontWeight: 600, color: '#8b949e' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#8b949e' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#8b949e' }}>Variants</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#8b949e' }}>Attributes</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#8b949e' }}>Available</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#8b949e' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {menuItems.map((item) => (
                <TableRow key={item.id} sx={{ '&:hover': { backgroundColor: 'rgba(139, 148, 158, 0.1)' }, '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ color: '#c9d1d9', fontWeight: 500, borderBottom: '1px solid #21262d' }}>{item.name}</TableCell>
                  <TableCell sx={{ color: '#c9d1d9', borderBottom: '1px solid #21262d' }}>{categories.find((c) => c.id === item.category)?.name || 'N/A'}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #21262d' }}>
                    {item.variants.map((v) => (<Chip key={v.variant_name} label={`${v.variant_name}: ₹${v.price}`} size="small" sx={{ mr: 0.5, mb: 0.5, bgcolor: '#01579b', color: 'white' }} />))}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #21262d' }}>
                    {item.food_types.map((ft) => (<Chip key={ft} label={foodTypes.find((f) => f.id === ft)?.name || ft} size="small" sx={{ mr: 0.5, mb: 0.5, color: '#3fb950', bgcolor: 'rgba(63, 185, 80, 0.15)', border: '1px solid rgba(63, 185, 80, 0.4)' }} />))}
                    {item.cuisines.map((c) => (<Chip key={c} label={cuisines.find((cu) => cu.id === c)?.name || c} size="small" sx={{ mr: 0.5, mb: 0.5, color: '#58a6ff', bgcolor: 'rgba(88, 166, 255, 0.1)', border: '1px solid rgba(88, 166, 255, 0.4)' }} />))}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #21262d' }}><Chip label={item.is_available ? 'Yes' : 'No'} size="small" sx={{ fontWeight: 500, color: item.is_available ? '#3fb950' : '#8b949e', backgroundColor: item.is_available ? 'rgba(63, 185, 80, 0.15)' : 'rgba(139, 148, 158, 0.15)', border: `1px solid ${item.is_available ? 'rgba(63, 185, 80, 0.4)' : 'rgba(139, 148, 158, 0.4)'}` }} /></TableCell>
                  <TableCell sx={{ borderBottom: '1px solid #21262d' }}>
                    <IconButton onClick={() => handleEdit(item)} sx={{ color: '#8b949e' }}><Edit /></IconButton>
                    <IconButton onClick={() => handleDelete(item.id)} sx={{ color: '#f85149' }}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Attribute Management Dialog */}
        <Dialog open={attributeDialogOpen} onClose={() => setAttributeDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { background: '#161b22', border: '1px solid #30363d', color: '#c9d1d9' } }}>
          <DialogTitle sx={{ fontWeight: 600, borderBottom: '1px solid #30363d' }}>Manage Menu Attributes</DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: '#30363d', '& .MuiTab-root': { color: '#8b949e', textTransform: 'none' }, '& .Mui-selected': { color: '#58a6ff !important' }, '& .MuiTabs-indicator': { backgroundColor: '#58a6ff' } }}>
              <Tab label={`Categories (${categories.length})`} icon={<Category />} iconPosition="start" />
              <Tab label={`Food Types (${foodTypes.length})`} icon={<RestaurantIcon />} iconPosition="start" />
              <Tab label={`Cuisines (${cuisines.length})`} icon={<LocalDining />} iconPosition="start" />
            </Tabs>
            <Box sx={{ p: 3 }}>
              <TabPanel value={tabValue} index={0}>
                <Alert severity="info" sx={{ mb: 2, background: 'rgba(88, 166, 255, 0.1)', color: '#58a6ff', border: '1px solid rgba(88, 166, 255, 0.4)' }}>Categories are specific to your restaurant.</Alert>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <StyledDarkTextField fullWidth label="New Category Name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()} />
                  <Button variant="contained" onClick={handleCreateCategory} disabled={!newCategory.trim()} sx={{ bgcolor: '#238636', '&:hover': { bgcolor: '#2ea043' } }}>Add</Button>
                </Box>
                <List>{categories.map((cat) => (<ListItem key={cat.id}><ListItemText primary={cat.name} /><ListItemSecondaryAction><IconButton edge="end" onClick={() => handleDeleteCategory(cat.id)} sx={{ color: '#f85149' }}><Delete /></IconButton></ListItemSecondaryAction></ListItem>))}</List>
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                <Alert severity="info" sx={{ mb: 2, background: 'rgba(88, 166, 255, 0.1)', color: '#58a6ff', border: '1px solid rgba(88, 166, 255, 0.4)' }}>Food types are global (e.g., Veg, Non-Veg).</Alert>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <StyledDarkTextField fullWidth label="New Food Type" value={newFoodType} onChange={(e) => setNewFoodType(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCreateFoodType()} />
                  <Button variant="contained" onClick={handleCreateFoodType} disabled={!newFoodType.trim()} sx={{ bgcolor: '#238636', '&:hover': { bgcolor: '#2ea043' } }}>Add</Button>
                </Box>
                <Grid container spacing={1}>{foodTypes.map((ft) => (<Grid item key={ft.id}><Chip label={ft.name} onDelete={() => handleDeleteFoodType(ft.id)} sx={{ bgcolor: 'rgba(63, 185, 80, 0.15)', color: '#3fb950' }} /></Grid>))}</Grid>
              </TabPanel>
              <TabPanel value={tabValue} index={2}>
                <Alert severity="info" sx={{ mb: 2, background: 'rgba(88, 166, 255, 0.1)', color: '#58a6ff', border: '1px solid rgba(88, 166, 255, 0.4)' }}>Cuisines are global (e.g., Italian, Chinese).</Alert>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <StyledDarkTextField fullWidth label="New Cuisine" value={newCuisine} onChange={(e) => setNewCuisine(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCreateCuisine()} />
                  <Button variant="contained" onClick={handleCreateCuisine} disabled={!newCuisine.trim()} sx={{ bgcolor: '#238636', '&:hover': { bgcolor: '#2ea043' } }}>Add</Button>
                </Box>
                <Grid container spacing={1}>{cuisines.map((c) => (<Grid item key={c.id}><Chip label={c.name} onDelete={() => handleDeleteCuisine(c.id)} sx={{ bgcolor: 'rgba(88, 166, 255, 0.1)', color: '#58a6ff' }} /></Grid>))}</Grid>
              </TabPanel>
            </Box>
          </DialogContent>
          <DialogActions sx={{ borderTop: '1px solid #30363d' }}><Button onClick={() => setAttributeDialogOpen(false)} sx={{ color: '#8b949e' }}>Close</Button></DialogActions>
        </Dialog>

        {/* Menu Item Dialog */}
        <Dialog open={menuDialogOpen} onClose={() => setMenuDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { background: '#161b22', border: '1px solid #30363d', color: '#c9d1d9' } }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogTitle sx={{ fontWeight: 600, borderBottom: '1px solid #30363d' }}>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ pt: 2 }}>
                <Controller name="name" control={control} rules={{ required: 'Name is required' }} render={({ field, fieldState }) => (<StyledDarkTextField {...field} label="Name" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />)} />
                <Controller name="description" control={control} render={({ field }) => (<StyledDarkTextField {...field} label="Description" fullWidth multiline rows={3} />)} />
                <Controller name="category" control={control} rules={{ required: 'Category is required', validate: value => value !== 0 || 'Please select a category' }}
                  render={({ field, fieldState }) => (
                    <FormControl fullWidth error={!!fieldState.error}>
                      <InputLabel sx={{ color: '#8b949e' }}>Category</InputLabel>
                      <StyledDarkSelect {...field} label="Category">
                        <MuiMenuItem value={0} disabled><em>Select a category</em></MuiMenuItem>
                        {categories.map((cat) => (<MuiMenuItem key={cat.id} value={cat.id}>{cat.name}</MuiMenuItem>))}
                      </StyledDarkSelect>
                      {fieldState.error && (<Typography variant="caption" color="error.main" sx={{ mt: 0.5, ml: 1.5 }}>{fieldState.error.message}</Typography>)}
                    </FormControl>
                  )}
                />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller name="food_types" control={control} render={({ field }) => (
                      <FormControl fullWidth variant="outlined">
                        <InputLabel id="food-types-label" sx={{ color: '#8b949e' }} notched={!!field.value && field.value.length > 0}>Food Types</InputLabel>
                        <StyledDarkSelect
                          labelId="food-types-label"
                          id="food-types-select"
                          {...field}
                          multiple
                          // The label prop should be on Select itself for proper styling
                          label="Food Types" 
                          renderValue={(selected: number[]) =>
                            selected
                              .map((id) => foodTypes.find((ft) => ft.id === id)?.name)
                              .filter(Boolean)
                              .join(', ')
                          }
                        >
                          {foodTypes.map((ft) => (
                            <MuiMenuItem key={ft.id} value={ft.id} sx={{ color: '#c9d1d9' }}>{ft.name}</MuiMenuItem>
                          ))}
                        </StyledDarkSelect>
                      </FormControl>
                    )} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller name="cuisines" control={control} render={({ field }) => (
                      <FormControl fullWidth variant="outlined">
                        <InputLabel id="cuisines-label" sx={{ color: '#8b949e' }} notched={!!field.value && field.value.length > 0}>Cuisines</InputLabel>
                        <StyledDarkSelect
                          labelId="cuisines-label"
                          id="cuisines-select"
                          {...field}
                          multiple
                          label="Cuisines"
                          renderValue={(selected: number[]) =>
                            selected
                              .map((id) => cuisines.find((c) => c.id === id)?.name)
                              .filter(Boolean)
                              .join(', ')
                          }
                        >
                          {cuisines.map((c) => (
                            <MuiMenuItem key={c.id} value={c.id} sx={{ color: '#c9d1d9' }}>{c.name}</MuiMenuItem>
                          ))}
                        </StyledDarkSelect>
                      </FormControl>
                    )} />
                  </Grid>
                </Grid>
                <Controller name="is_available" control={control} render={({ field }) => (<FormControlLabel control={<Switch {...field} checked={field.value} />} label="Available for ordering" />)} />
                <Divider sx={{ borderColor: '#30363d' }} />
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#f0f6fc' }}>Variants <Tooltip title="Add different sizes or options (e.g., Small, Medium, Large)"><Info fontSize="small" sx={{ ml: 1, verticalAlign: 'middle', color: '#8b949e' }} /></Tooltip></Typography>
                  {fields.map((field, index) => (
                    <Box key={field.id} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
                      <Controller name={`variants.${index}.variant_name`} control={control} rules={{ required: 'Name required' }} render={({ field, fieldState }) => (<StyledDarkTextField {...field} label="Variant Name" size="small" error={!!fieldState.error} helperText={fieldState.error?.message} />)} />
                      <Controller name={`variants.${index}.price`} control={control} rules={{ required: 'Price required', min: { value: 0, message: '>= 0' } }} render={({ field, fieldState }) => (<StyledDarkTextField {...field} label="Price (₹)" type="number" size="small" error={!!fieldState.error} helperText={fieldState.error?.message} onChange={(e) => field.onChange(parseFloat(e.target.value))} />)} />
                      <Controller name={`variants.${index}.preparation_time`} control={control} rules={{ required: 'Time required', min: { value: 1, message: '>= 1' } }} render={({ field, fieldState }) => (<StyledDarkTextField {...field} label="Prep Time (min)" type="number" size="small" error={!!fieldState.error} helperText={fieldState.error?.message} onChange={(e) => field.onChange(parseInt(e.target.value))} />)} />
                      <IconButton onClick={() => remove(index)} sx={{ color: '#f85149', mt: 1 }} disabled={fields.length === 1}><Remove /></IconButton>
                    </Box>
                  ))}
                  <Button startIcon={<Add />} onClick={() => append({ variant_name: '', price: 0, preparation_time: 15 })} sx={{ mt: 1, textTransform: 'none', color: '#58a6ff' }}>Add Variant</Button>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid #30363d', p: 2 }}>
              <Button onClick={() => setMenuDialogOpen(false)} sx={{ color: '#8b949e' }}>Cancel</Button>
              <Button type="submit" variant="contained" sx={{ bgcolor: '#238636', '&:hover': { bgcolor: '#2ea043' } }}>{editingItem ? 'Update Item' : 'Create Item'}</Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </Box>
  );
};

export default MenuManagement;