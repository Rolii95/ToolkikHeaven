import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {
  createBottomTabNavigator,
  type BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type {RouteProp} from '@react-navigation/native';

import {Colors} from '../constants/Colors';
import {useAppSelector} from '../store/hooks';
import type {RootState} from '../store/store';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import BiometricSetupScreen from '../screens/auth/BiometricSetupScreen';

// Main Screens
import HomeScreen from '../screens/home/HomeScreen';
import ProductListScreen from '../screens/products/ProductListScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import SearchScreen from '../screens/search/SearchScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/checkout/CheckoutScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ProductDetail: {productId: string};
  Search: undefined;
  Checkout: undefined;
  OrderDetail: {orderId: string};
  Notifications: undefined;
  Settings: undefined;
  BiometricSetup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Products: undefined;
  Cart: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};
const AuthStack = createStackNavigator<AuthStackParamList>();

const getTabBarIcon = (
  route: RouteProp<MainTabParamList, keyof MainTabParamList>,
): NonNullable<BottomTabNavigationOptions['tabBarIcon']> => {
  return ({color, size}) => {
    let iconName: string = 'home';

    switch (route.name) {
      case 'Products':
        iconName = 'shopping-bag';
        break;
      case 'Cart':
        iconName = 'shopping-cart';
        break;
      case 'Profile':
        iconName = 'person';
        break;
      default:
        iconName = 'home';
    }

    return (
      <Icon
        name={iconName}
        size={size ?? 24}
        color={color ?? Colors.text}
      />
    );
  };
};

const selectCartItemCount = (state: RootState) => state.cart.itemCount;
const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;

const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: {backgroundColor: Colors.background},
      }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

const MainTabs = () => {
  const cartItemCount = useAppSelector(selectCartItemCount);

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: getTabBarIcon(route),
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
        },
        headerShown: false,
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Products" component={ProductListScreen} />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen}
        options={{
          tabBarBadge: cartItemCount > 0 ? cartItemCount : undefined,
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.background,
        cardStyle: {backgroundColor: Colors.background},
      }}>
      {!isAuthenticated ? (
        <Stack.Screen 
          name="Auth" 
          component={AuthNavigator}
          options={{headerShown: false}}
        />
      ) : (
        <>
          <Stack.Screen 
            name="Main" 
            component={MainTabs}
            options={{headerShown: false}}
          />
          <Stack.Screen 
            name="ProductDetail" 
            component={ProductDetailScreen}
            options={{title: 'Product Details'}}
          />
          <Stack.Screen 
            name="Search" 
            component={SearchScreen}
            options={{title: 'Search Products'}}
          />
          <Stack.Screen 
            name="Checkout" 
            component={CheckoutScreen}
            options={{title: 'Checkout'}}
          />
          <Stack.Screen 
            name="OrderDetail" 
            component={OrderDetailScreen}
            options={{title: 'Order Details'}}
          />
          <Stack.Screen 
            name="Notifications" 
            component={NotificationsScreen}
            options={{title: 'Notifications'}}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{title: 'Settings'}}
          />
          <Stack.Screen 
            name="BiometricSetup" 
            component={BiometricSetupScreen}
            options={{title: 'Biometric Setup'}}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
