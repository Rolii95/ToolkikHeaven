import React, {useEffect} from 'react';
import PushNotification, {
  type PushNotification as PushNotificationEvent,
} from 'react-native-push-notification';

interface NotificationProviderProps {
  children: React.ReactNode;
}

const NotificationProvider: React.FC<NotificationProviderProps> = ({children}) => {
  useEffect(() => {
    PushNotification.configure({
      onRegister: () => {
        // Registration handled elsewhere in the app if needed
      },
      onNotification: (notification: PushNotificationEvent) => {
        notification.finish?.(PushNotification.FetchResult.NoData);
      },
      requestPermissions: false,
    });
  }, []);

  return <>{children}</>;
};

export default NotificationProvider;
