import React from 'react';
import {Provider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StatusBar} from 'react-native';

import {store} from './store/store';
import AppNavigator from './navigation/AppNavigator';
import NetworkProvider from './providers/NetworkProvider';
import NotificationProvider from './providers/NotificationProvider';
import {Colors} from './constants/Colors';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          <NetworkProvider>
            <NotificationProvider>
              <StatusBar 
                barStyle="light-content" 
                backgroundColor={Colors.primary} 
              />
              <AppNavigator />
            </NotificationProvider>
          </NetworkProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
};

export default App;