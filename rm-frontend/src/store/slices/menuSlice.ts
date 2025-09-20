// src/store/slices/menuSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import menuService from '@/services/api/menu.service';
import { MenuItem, Category, FoodType, Cuisine } from '@/types/menu.types';

interface MenuState {
  items: MenuItem[];
  categories: Category[];
  foodTypes: FoodType[];
  cuisines: Cuisine[];
  loading: boolean;
  error: string | null;
}

const initialState: MenuState = {
  items: [],
  categories: [],
  foodTypes: [],
  cuisines: [],
  loading: false,
  error: null,
};

export const fetchMenuData = createAsyncThunk(
  'menu/fetchAll',
  async () => {
    const [items, categories, foodTypes, cuisines] = await Promise.all([
      menuService.getMenuItems(),
      menuService.getCategories(),
      menuService.getFoodTypes(),
      menuService.getCuisines(),
    ]);
    return { items, categories, foodTypes, cuisines };
  }
);

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    clearMenuError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenuData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenuData.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.categories = action.payload.categories;
        state.foodTypes = action.payload.foodTypes;
        state.cuisines = action.payload.cuisines;
      })
      .addCase(fetchMenuData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch menu data';
      });
  },
});

export const { clearMenuError } = menuSlice.actions;
export default menuSlice.reducer;