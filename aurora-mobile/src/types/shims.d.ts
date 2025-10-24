declare module 'react-native-vector-icons/MaterialIcons' {
  import type {ComponentType} from 'react';

  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
  }

  const Icon: ComponentType<IconProps>;
  export default Icon;
}

declare module 'react-native-push-notification' {
  export type FetchResult = 'NoData' | 'ResultFailed' | 'ResultNewData';

  export interface PushNotification {
    finish?(fetchResult?: FetchResult): void;
  }

  interface ConfigureOptions {
    onRegister?: (token: {token: string}) => void;
    onNotification?: (notification: PushNotification) => void;
    requestPermissions?: boolean;
  }

  interface PushNotificationAPI {
    configure(options: ConfigureOptions): void;
    FetchResult: {
      NoData: FetchResult;
      ResultFailed: FetchResult;
      ResultNewData: FetchResult;
    };
  }

  const PushNotification: PushNotificationAPI;
  export default PushNotification;
}
