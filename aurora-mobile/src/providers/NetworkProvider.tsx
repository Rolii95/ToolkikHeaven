import React, {useEffect, useState} from 'react';
import NetInfo, {type NetInfoState} from '@react-native-community/netinfo';

interface NetworkProviderProps {
  children: React.ReactNode;
}

const NetworkProvider: React.FC<NetworkProviderProps> = ({children}) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // In a production app we could render an offline banner when !isConnected
  return <>{children}</>;
};

export default NetworkProvider;
