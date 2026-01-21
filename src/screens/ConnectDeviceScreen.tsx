import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BleManager, Device as BleDevice } from 'react-native-ble-plx';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useBluetooth } from '../contexts/BluetoothContext';

interface Device {
  id: string;
  name: string;
  rssi: number;
}

export default function ConnectDeviceScreen({ navigation }: any) {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const { bleManager } = useBluetooth();
  const bleManagerRef = useRef(bleManager);

  useEffect(() => {
    // Animación de escaneo rotatorio
    Animated.loop(
      Animated.timing(scanAnimation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Animación de pulso
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Solicitar permisos y empezar escaneo
    requestPermissionsAndStartScan();

    // Cleanup
    return () => {
      bleManagerRef.current?.stopDeviceScan();
    };
  }, []);

  const requestPermissionsAndStartScan = async () => {
    try {
      if (Platform.OS === 'android') {
        try {
          // Intentar solicitar permisos para Android 12+
          const permissions = [];
          
          // Para Android 12+ (API 31+) necesitamos BLUETOOTH_SCAN y BLUETOOTH_CONNECT
          if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN) {
            permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
          }
          if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT) {
            permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
          }
          
          // Siempre solicitar ubicación (necesario para versiones antiguas)
          permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

          if (permissions.length > 0) {
            const results = await PermissionsAndroid.requestMultiple(permissions);
            console.log('Permission results:', results);
          }
        } catch (permError) {
          console.log('Permission request failed, continuing anyway:', permError);
          // Continuar de todos modos - algunos dispositivos no necesitan permisos explícitos
        }
      }

      // Intentar iniciar escaneo independientemente de los permisos
      startScanning();
    } catch (error) {
      console.error('Error in requestPermissionsAndStartScan:', error);
      Alert.alert('Error', 'Hubo un problema al inicializar Bluetooth. Intenta nuevamente.');
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setDevices([]);

    bleManagerRef.current?.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        setIsScanning(false);
        return;
      }

      if (device && device.name) {
        setDevices(prevDevices => {
          // Evitar duplicados
          const exists = prevDevices.find(d => d.id === device.id);
          if (exists) {
            // Actualizar RSSI si el dispositivo ya existe
            return prevDevices.map(d =>
              d.id === device.id ? { ...d, rssi: device.rssi || 0 } : d
            );
          }

          // Agregar nuevo dispositivo
          return [
            ...prevDevices,
            {
              id: device.id,
              name: device.name || 'Unknown Device',
              rssi: device.rssi || 0,
            },
          ];
        });
      }
    });

    // Detener escaneo después de 10 segundos
    setTimeout(() => {
      bleManagerRef.current?.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  };

  const handleConnect = async (deviceId: string, deviceName: string) => {
    try {
      // Detener escaneo si está activo
      bleManagerRef.current?.stopDeviceScan();
      setIsScanning(false);

      Alert.alert(
        'Conectando',
        `Estableciendo conexión con ${deviceName}...`
      );

      // Conectar al dispositivo BLE
      const device = await bleManagerRef.current?.connectToDevice(deviceId, {
        timeout: 10000,
      });
      
      if (device) {
        console.log('Device connected:', deviceId);
        
        // Solicitar MTU más grande para mensajes largos (512 bytes)
        try {
          const mtu = await device.requestMTU(512);
          console.log('MTU negociado:', mtu);
        } catch (mtuError) {
          console.log('MTU request failed, usando default:', mtuError);
        }
        
        // Descubrir servicios y características
        await device.discoverAllServicesAndCharacteristics();
        console.log('Services discovered');
        
        setConnectedDevice(deviceId);
        
        Alert.alert(
          'Dispositivo Conectado',
          `${deviceName} conectado exitosamente.\n\nAhora puedes configurar la red WiFi del dispositivo.`,
          [
            {
              text: 'Más tarde',
              style: 'cancel',
            },
            {
              text: 'Configurar WiFi',
              onPress: () => {
                // Navegar con la información del dispositivo conectado
                navigation.navigate('ConnectWifi', {
                  deviceId: deviceId,
                  deviceName: deviceName,
                });
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      setConnectedDevice(null);
      
      Alert.alert(
        'Error de Conexión',
        `No se pudo conectar a ${deviceName}.\n\nError: ${error.message || 'Desconocido'}\n\nAsegúrate de que:\n• El dispositivo está encendido\n• El dispositivo está en modo de vinculación\n• No está conectado a otro teléfono`
      );
    }
  };

  const handleDisconnect = async (deviceId: string) => {
    try {
      await bleManagerRef.current?.cancelDeviceConnection(deviceId);
      setConnectedDevice(null);
      Alert.alert('Desconectado', 'Dispositivo desconectado exitosamente');
    } catch (error) {
      console.error('Disconnection error:', error);
      setConnectedDevice(null);
    }
  };

  const getSignalStrength = (rssi: number): 'strong' | 'medium' | 'weak' => {
    if (rssi > -50) return 'strong';
    if (rssi > -70) return 'medium';
    return 'weak';
  };

  const spin = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderDeviceIcon = () => {
    return (
      <View style={[styles.deviceIcon, styles.bluetoothIcon]}>
        <MaterialCommunityIcons name="bluetooth" size={24} color="#4dd0e1" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect Device</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Scanning Animation */}
        <View style={styles.scanningContainer}>
          {/* Círculos de fondo animados */}
          <Animated.View 
            style={[
              styles.scanCircle, 
              styles.scanCircle1,
              { transform: [{ scale: pulseAnimation }] }
            ]} 
          />
          <Animated.View 
            style={[
              styles.scanCircle, 
              styles.scanCircle2,
              { transform: [{ scale: pulseAnimation }] }
            ]} 
          />
          <Animated.View 
            style={[
              styles.scanCircle, 
              styles.scanCircle3,
              { transform: [{ scale: pulseAnimation }] }
            ]} 
          />

          {/* Bluetooth Icon */}
          <View style={styles.teddyContainer}>
            <Ionicons name="bluetooth" size={50} color="#4dd0e1" />
          </View>

          {/* Scanning Indicator */}
          {isScanning && (
            <Animated.View 
              style={[
                styles.scanningIndicator,
                { transform: [{ rotate: spin }] }
              ]}
            >
              <View style={styles.scanningArc} />
            </Animated.View>
          )}

          {/* Scanning Text */}
          {isScanning && (
            <View style={styles.scanningTextContainer}>
              <View style={styles.scanningDot} />
              <Text style={styles.scanningText}>SCANNING</Text>
            </View>
          )}
        </View>

        {/* Looking for Text */}
        <Text style={styles.lookingText}>Busca tu dispositivo Teddy...</Text>
        <Text style={styles.instructionText}>
          Asegúrate de que tu dispositivo esté encendido y {'\n'}dentro del alcance de tu teléfono.
        </Text>

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={startScanning}
          disabled={isScanning}
        >
          {!isScanning && (
            <Ionicons name="refresh" size={18} color="#fff" style={styles.refreshIcon} />
          )}
          <Text style={styles.refreshButtonText}>
            {isScanning ? 'Scanning...' : 'Scan Again'}
          </Text>
        </TouchableOpacity>

        {/* Devices Found Section */}
        {devices.length > 0 && (
          <View style={styles.devicesSection}>
            <View style={styles.devicesHeader}>
              <Text style={styles.devicesSectionTitle}>
                DEVICES FOUND ({devices.length})
              </Text>
              <View style={styles.dotsMenu}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </View>

            {/* Device List */}
            {devices.map((device) => {
              const signalStrength = getSignalStrength(device.rssi);
              const isConnected = connectedDevice === device.id;
              
              return (
                <View key={device.id} style={styles.deviceCard}>
                  <View style={styles.deviceInfo}>
                    {renderDeviceIcon()}
                    <View style={styles.deviceDetails}>
                      <Text style={styles.deviceName}>{device.name}</Text>
                      <View style={styles.signalContainer}>
                        <View 
                          style={[
                            styles.signalDot,
                            signalStrength === 'strong' && styles.signalStrong,
                            signalStrength === 'medium' && styles.signalMedium,
                            signalStrength === 'weak' && styles.signalWeak,
                          ]}
                        />
                        <Text 
                          style={[
                            styles.signalText,
                            signalStrength === 'strong' && styles.signalStrongText,
                            signalStrength === 'medium' && styles.signalMediumText,
                            signalStrength === 'weak' && styles.signalWeakText,
                          ]}
                        >
                          {signalStrength === 'strong' && 'Signal Strong'}
                          {signalStrength === 'medium' && 'Signal Medium'}
                          {signalStrength === 'weak' && 'Signal Weak'}
                          {` (${device.rssi} dBm)`}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.connectButton,
                      isConnected 
                        ? styles.connectButtonConnected 
                        : styles.connectButtonPrimary
                    ]}
                    onPress={() => 
                      isConnected 
                        ? handleDisconnect(device.id) 
                        : handleConnect(device.id, device.name)
                    }
                  >
                    <Text style={styles.connectButtonText}>
                      {isConnected ? 'Desconectar' : 'Conectar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* No Devices Message */}
        {!isScanning && devices.length === 0 && (
          <View style={styles.noDevicesContainer}>
            <Text style={styles.noDevicesText}>
              No se encontraron dispositivos Bluetooth
            </Text>
            <Text style={styles.noDevicesSubtext}>
              Asegúrate de que el Bluetooth esté activado
            </Text>
          </View>
        )}

        {/* Continue to WiFi Button */}
        {connectedDevice && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => {
              const device = devices.find(d => d.id === connectedDevice);
              navigation.navigate('ConnectWifi', {
                deviceId: connectedDevice,
                deviceName: device?.name || 'Device',
              });
            }}
          >
            <Text style={styles.continueButtonText}>Continuar a configuración WiFi →</Text>
          </TouchableOpacity>
        )}

        {/* Trouble Connecting Link */}
        <TouchableOpacity style={styles.troubleLink}>
          <Ionicons name="construct-outline" size={16} color="#4dd0e1" style={styles.troubleIcon} />
          <Text style={styles.troubleText}>Trouble connecting?</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  scanningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 30,
    position: 'relative',
    height: 280,
  },
  scanCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(178, 235, 242, 0.15)',
  },
  scanCircle1: {
    width: 280,
    height: 280,
  },
  scanCircle2: {
    width: 220,
    height: 220,
    backgroundColor: 'rgba(178, 235, 242, 0.25)',
  },
  scanCircle3: {
    width: 160,
    height: 160,
    backgroundColor: 'rgba(178, 235, 242, 0.35)',
  },
  teddyContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  scanningIndicator: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#4dd0e1',
    borderRightColor: '#4dd0e1',
  },
  scanningArc: {
    width: '100%',
    height: '100%',
  },
  scanningTextContainer: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scanningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4dd0e1',
    marginRight: 6,
  },
  scanningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4dd0e1',
    letterSpacing: 1,
  },
  lookingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  devicesSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  devicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  devicesSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4dd0e1',
    letterSpacing: 1,
  },
  dotsMenu: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4dd0e1',
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  teddyIcon: {
    backgroundColor: '#e0f7fa',
  },
  tvIcon: {
    backgroundColor: '#f5f5f5',
  },
  bluetoothIcon: {
    backgroundColor: '#e3f2fd',
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  signalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  signalStrong: {
    backgroundColor: '#4dd0e1',
  },
  signalMedium: {
    backgroundColor: '#ffa726',
  },
  signalWeak: {
    backgroundColor: '#ccc',
  },
  signalText: {
    fontSize: 11,
  },
  signalStrongText: {
    color: '#4dd0e1',
    fontWeight: '600',
  },
  signalMediumText: {
    color: '#ffa726',
    fontWeight: '600',
  },
  signalWeakText: {
    color: '#999',
  },
  connectButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  connectButtonPrimary: {
    backgroundColor: '#4dd0e1',
  },
  connectButtonConnected: {
    backgroundColor: '#ff6b6b',
  },
  connectButtonSecondary: {
    backgroundColor: '#f0f0f0',
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  refreshButton: {
    backgroundColor: '#4dd0e1',
    marginHorizontal: 60,
    marginBottom: 20,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    marginRight: 6,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  noDevicesContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 40,
  },
  noDevicesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  noDevicesSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#4dd0e1',
    marginHorizontal: 40,
    marginTop: 30,
    marginBottom: 10,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#4dd0e1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  troubleLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },
  troubleIcon: {
    marginRight: 6,
  },
  troubleText: {
    fontSize: 14,
    color: '#4dd0e1',
    fontWeight: '600',
  },
});
