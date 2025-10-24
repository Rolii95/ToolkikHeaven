import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  type ActionReducerMapBuilder,
} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '../../config/api';
import type {Draft} from 'immer';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  biometricEnabled: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  biometricEnabled: false,
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

export const loginUser = createAsyncThunk<
  {user: User; token: string},
  {email: string; password: string},
  {rejectValue: string}
>(
  'auth/loginUser',
  async (credentials, {rejectWithValue}) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = (await response.json()) as {user: User; token: string};

      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const biometricLogin = createAsyncThunk<
  {user: User; token: string},
  void,
  {rejectValue: string}
>(
  'auth/biometricLogin',
  async (_unused, {rejectWithValue}) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userStr = await AsyncStorage.getItem('user');

      if (!token || !userStr) {
        throw new Error('No stored credentials');
      }

      const user = JSON.parse(userStr) as User;
      return {user, token};
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const logoutUser = createAsyncThunk<
  void,
  void,
  {rejectValue: string}
>('auth/logoutUser', async (_unused, {rejectWithValue}) => {
  try {
    await AsyncStorage.multiRemove(['userToken', 'user']);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state: Draft<AuthState>) => {
      state.error = null;
    },
    setBiometricEnabled: (
      state: Draft<AuthState>,
      action: PayloadAction<boolean>,
    ) => {
      state.biometricEnabled = action.payload;
    },
    setUser: (state: Draft<AuthState>, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder: ActionReducerMapBuilder<AuthState>) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Login failed';
        state.isAuthenticated = false;
      })
      .addCase(biometricLogin.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload ?? 'Logout failed';
      });
  },
});

export const {clearError, setBiometricEnabled, setUser} = authSlice.actions;
export default authSlice.reducer;
