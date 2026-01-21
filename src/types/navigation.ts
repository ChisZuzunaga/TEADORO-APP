export type RootStackParamList = {
  ConnectDevice: undefined;
  ConnectWifi: {
    deviceId: string;
    deviceName: string;
  };
  ConnectionSuccess: {
    deviceName: string;
    ipAddress: string;
  };
  Test: undefined;
};
