import React, { createContext, useContext, useRef, ReactNode } from 'react';
import { BleManager } from 'react-native-ble-plx';

interface BluetoothContextType {
  bleManager: BleManager | null;
}

const BluetoothContext = createContext<BluetoothContextType>({
  bleManager: null,
});

export const BluetoothProvider = ({ children }: { children: ReactNode }) => {
  const bleManagerRef = useRef<BleManager>(new BleManager());

  return (
    <BluetoothContext.Provider value={{ bleManager: bleManagerRef.current }}>
      {children}
    </BluetoothContext.Provider>
  );
};

export const useBluetooth = () => {
  const context = useContext(BluetoothContext);
  if (!context) {
    throw new Error('useBluetooth must be used within BluetoothProvider');
  }
  return context;
};
