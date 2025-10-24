import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  type ActionReducerMapBuilder,
} from '@reduxjs/toolkit';
import {API_BASE_URL} from '../../config/api';
import type {Draft} from 'immer';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  rating: number;
  reviews: number;
  isActive: boolean;
}

interface ProductsState {
  products: Product[];
  featuredProducts: Product[];
  searchResults: Product[];
  currentProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filters: {
    category: string;
    priceRange: [number, number];
    rating: number;
  };
}

interface ProductsResponse {
  products?: Product[];
  featured?: Product[];
}

interface SearchResponse {
  products?: Product[];
}

const initialState: ProductsState = {
  products: [],
  featuredProducts: [],
  searchResults: [],
  currentProduct: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  filters: {
    category: '',
    priceRange: [0, 1000],
    rating: 0,
  },
};

const serializeParams = (
  params?: {category?: string; limit?: number},
): string => {
  if (!params) {
    return '';
  }

  const searchParams = new URLSearchParams();
  if (params.category) {
    searchParams.set('category', params.category);
  }
  if (typeof params.limit === 'number') {
    searchParams.set('limit', String(params.limit));
  }
  return searchParams.toString();
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

export const fetchProducts = createAsyncThunk<
  ProductsResponse,
  {category?: string; limit?: number} | undefined,
  {rejectValue: string}
>('products/fetchProducts', async (params, {rejectWithValue}) => {
  try {
    const query = serializeParams(params);
    const url = query
      ? `${API_BASE_URL}/products?${query}`
      : `${API_BASE_URL}/products`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    return (await response.json()) as ProductsResponse;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const searchProducts = createAsyncThunk<
  SearchResponse,
  string,
  {rejectValue: string}
>('products/searchProducts', async (query, {rejectWithValue}) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`,
    );
    if (!response.ok) {
      throw new Error('Failed to search products');
    }
    return (await response.json()) as SearchResponse;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const fetchProductById = createAsyncThunk<
  Product,
  string,
  {rejectValue: string}
>('products/fetchProductById', async (id, {rejectWithValue}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }
    return (await response.json()) as Product;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearSearchResults: (state: Draft<ProductsState>) => {
      state.searchResults = [];
      state.searchQuery = '';
    },
    setSearchQuery: (state: Draft<ProductsState>, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setFilters: (
      state: Draft<ProductsState>,
      action: PayloadAction<Partial<ProductsState['filters']>>,
    ) => {
      state.filters = {...state.filters, ...action.payload};
    },
    clearCurrentProduct: (state: Draft<ProductsState>) => {
      state.currentProduct = null;
    },
  },
  extraReducers: (builder: ActionReducerMapBuilder<ProductsState>) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.products ?? [];
        state.featuredProducts = action.payload.featured ?? [];
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch products';
      })
      .addCase(searchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload.products ?? [];
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to search products';
      })
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Failed to fetch product';
      });
  },
});

export const {
  clearSearchResults,
  setSearchQuery,
  setFilters,
  clearCurrentProduct,
} = productsSlice.actions;

export default productsSlice.reducer;
