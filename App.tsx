import "react-native-gesture-handler";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./src/types/navigation";
import { BluetoothProvider } from "./src/contexts/BluetoothContext";

// Importar las pantallas
import TestScreen from "./src/screens/TestScreen";
import ConnectWifiScreen from "./src/screens/ConnectWifiScreen";
import ConnectDevice from "./src/screens/ConnectDeviceScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BluetoothProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="ConnectDevice" component={ConnectDevice} />
              <Stack.Screen name="ConnectWifi" component={ConnectWifiScreen} />
              <Stack.Screen name="Test" component={TestScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </BluetoothProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
