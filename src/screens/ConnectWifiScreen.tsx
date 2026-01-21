import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

// Intentar importar WifiManager, pero manejar si no está disponible (Expo Go)
let WifiManager: any = null;
try {
  WifiManager = require('react-native-wifi-reborn').default;
} catch (e) {
  console.log('WiFi Manager not available - using mock data');
}

interface WifiNetwork {
  SSID: string;
  BSSID: string;
  level: number;
  frequency: number;
  capabilities: string;
}

// Datos de prueba para Expo Go
const mockNetworks: WifiNetwork[] = [
  {
    SSID: 'Home_Network_5G',
    BSSID: '00:11:22:33:44:55',
    level: -45,
    frequency: 5180,
    capabilities: '[WPA2-PSK-CCMP][ESS]',
  },
  {
    SSID: 'Guest_Network',
    BSSID: '00:11:22:33:44:56',
    level: -65,
    frequency: 2437,
    capabilities: '[WPA2-PSK-CCMP][ESS]',
  },
  {
    SSID: 'Neighbor_WiFi',
    BSSID: '00:11:22:33:44:57',
    level: -75,
    frequency: 2462,
    capabilities: '[WPA2-PSK-CCMP][ESS]',
  },
];

export default function ConnectWifiScreen({ navigation }: any) {
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    requestPermissionsAndScan();
  }, []);

  const requestPermissionsAndScan = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );

        if (allGranted) {
          scanNetworks();
        } else {
          Alert.alert('Permisos requeridos', 'La app necesita permisos para escanear redes WiFi');
          setLoading(false);
        }
      } else {
        scanNetworks();
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setLoading(false);
    }
  };

  const scanNetworks = async () => {
    try {
      setScanning(true);
      
      // Si no hay WifiManager disponible (Expo Go), usar datos mock
      if (!WifiManager) {
        console.log('Using mock WiFi data for Expo Go');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
        setNetworks(mockNetworks);
        setLoading(false);
        setScanning(false);
        return;
      }

      // Usar WifiManager real si está disponible
      const wifiList = await WifiManager.loadWifiList();
      
      // Eliminar duplicados basándose en SSID
      const uniqueNetworks = wifiList.reduce((acc: WifiNetwork[], current: WifiNetwork) => {
        const exists = acc.find(network => network.SSID === current.SSID);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      const sortedNetworks = uniqueNetworks.sort((a: WifiNetwork, b: WifiNetwork) => b.level - a.level);
      setNetworks(sortedNetworks);
      setLoading(false);
      setScanning(false);
    } catch (error) {
      console.error('Error scanning networks:', error);
      // En caso de error, usar datos mock
      setNetworks(mockNetworks);
      setLoading(false);
      setScanning(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedNetwork || !password) return;

    try {
      // Si no hay WifiManager disponible (Expo Go), simular conexión
      if (!WifiManager) {
        console.log('Simulating WiFi connection for Expo Go');
        await new Promise(resolve => setTimeout(resolve, 1500));
        Alert.alert('Conectado (Simulado)', `Conectado exitosamente a ${selectedNetwork}\n\nNota: Esto es una simulación. Compila la app nativamente para conectarte realmente.`);
        return;
      }

      // Conexión real con WifiManager
      await WifiManager.connectToProtectedSSID(selectedNetwork, password, false, false);
      Alert.alert('Conectado', `Conectado exitosamente a ${selectedNetwork}`);
    } catch (error) {
      console.error('Error connecting:', error);
      Alert.alert('Error', 'No se pudo conectar a la red. Verifica la contraseña.');
    }
  };

  const getSignalStrength = (level: number): 'excellent' | 'good' | 'weak' => {
    if (level > -50) return 'excellent';
    if (level > -70) return 'good';
    return 'weak';
  };

  const getSignalIcon = (level: number) => {
    // Usar iconos con diferentes barras según la intensidad
    if (level > -50) return 'wifi-strength-4'; // Excelente - 4 barras
    if (level > -60) return 'wifi-strength-3'; // Buena - 3 barras
    if (level > -70) return 'wifi-strength-2'; // Media - 2 barras
    return 'wifi-strength-1'; // Débil - 1 barra
  };

  const getSignalColor = (level: number) => {
    const strength = getSignalStrength(level);
    if (strength === 'excellent') return '#5dd5e1';
    if (strength === 'good') return '#7dd5e1';
    return '#9dd5e1'; // Color turquesa más claro para señal débil
  };

  const isSecured = (capabilities: string) => {
    return capabilities.includes('WPA') || capabilities.includes('WEP');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect Wi-Fi</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>

        {/* Fluffy Icon */}
        <View style={styles.fluffyContainer}>
          <View style={styles.fluffyCircle}>
            <Text style={styles.fluffyIcon}>🧸</Text>
          </View>
          <View style={styles.wifiIndicator}>
            <Ionicons name="wifi" size={18} color="#5dd5e1" />
          </View>
        </View>

        {/* Title and Description */}
        <Text style={styles.title}>Let's get Fluffy online</Text>
        <Text style={styles.description}>
          Select your home network so the{'\n'}plush can download updates and{'\n'}stories.
        </Text>

        {/* Nearby Networks Section */}
        <View style={styles.networksSection}>
          <View style={styles.networksSectionHeader}>
            <Text style={styles.networksSectionTitle}>NEARBY NETWORKS</Text>
            <TouchableOpacity onPress={scanNetworks} disabled={scanning}>
              {scanning ? (
                <ActivityIndicator size="small" color="#5dd5e1" />
              ) : (
                <Ionicons name="refresh" size={20} color="#b0b0b0" />
              )}
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4dd0e1" />
              <Text style={styles.loadingText}>Escaneando redes...</Text>
            </View>
          ) : networks.length === 0 ? (
            <Text style={styles.noNetworksText}>No se encontraron redes WiFi</Text>
          ) : (
            networks.map((network, index) => {
              const signalStrength = getSignalStrength(network.level);
              const secured = isSecured(network.capabilities);
              const isSelected = selectedNetwork === network.SSID;
              
              return (
                <View key={`${network.BSSID}-${index}`} style={isSelected ? styles.selectedNetworkCard : null}>
                  <TouchableOpacity
                    style={[
                      styles.networkItem,
                      isSelected && styles.networkItemSelected
                    ]}
                    onPress={() => setSelectedNetwork(network.SSID)}
                  >
                    <View style={styles.networkInfo}>
                      <View style={[
                        styles.wifiIconContainer,
                        isSelected ? styles.wifiIconContainerSelected : styles.wifiIconContainerDefault
                      ]}>
                        <MaterialCommunityIcons 
                          name={getSignalIcon(network.level)} 
                          size={24} 
                          color={isSelected ? getSignalColor(network.level) : '#b0b0b0'}
                        />
                      </View>
                      <View style={styles.networkDetails}>
                        <Text style={styles.networkName}>{network.SSID}</Text>
                        <View style={styles.signalBadge}>
                          <View style={styles.signalDot} />
                          <Text style={styles.signalText}>
                            {signalStrength === 'excellent' && 'Excellent Signal'}
                            {signalStrength === 'good' && 'Good Signal'}
                            {signalStrength === 'weak' && 'Weak Signal'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.networkActions}>
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={28} color="#5dd5e1" />
                      ) : (
                        <Ionicons name="wifi-outline" size={22} color="#d0d0d0" />
                      )}
                    </View>
                  </TouchableOpacity>
                  
                  {/* Password Input y botón - dentro de la tarjeta seleccionada */}
                  {isSelected && (
                    <View style={styles.selectedNetworkContent}>
                      <View style={styles.passwordSectionInline}>
                        <Text style={styles.passwordLabel}>PASSWORD</Text>
                        <View style={styles.passwordInputContainer}>
                          <TextInput
                            style={styles.passwordInput}
                            placeholder="Enter network password"
                            placeholderTextColor="#b0b0b0"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                          />
                          <TouchableOpacity 
                            style={styles.eyeButton}
                            onPress={() => setShowPassword(!showPassword)}
                          >
                            <Ionicons 
                              name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                              size={22} 
                              color="#b0b0b0" 
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      <TouchableOpacity
                        style={[
                          styles.connectButtonInline,
                          !password && styles.connectButtonDisabled
                        ]}
                        onPress={handleConnect}
                        disabled={!password}
                      >
                        <Text style={styles.connectButtonText}>Connect to Internet →</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Connect Button */}
        <TouchableOpacity
          style={[
            styles.connectButton,
            (!selectedNetwork || !password) && styles.connectButtonDisabled
          ]}
          onPress={handleConnect}
          disabled={!selectedNetwork || !password}
        >
          <Text style={styles.connectButtonText}>Connect to Internet →</Text>
        </TouchableOpacity>

        {/* Join Hidden Network */}
        <TouchableOpacity style={styles.hiddenNetworkButton}>
          <Ionicons name="lock-open-outline" size={16} color="#5dd5e1" style={styles.hiddenNetworkIcon} />
          <Text style={styles.hiddenNetworkText}>Join hidden network</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
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
  backIcon: {
    fontSize: 24,
    color: '#333',
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
  progressBar: {
    height: 3,
    backgroundColor: '#e8f5f7',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '25%',
    backgroundColor: '#5dd5e1',
    borderRadius: 2,
  },
  fluffyContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 35,
    position: 'relative',
  },
  fluffyCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#b8d8d8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  fluffyIcon: {
    fontSize: 65,
  },
  wifiIndicator: {
    position: 'absolute',
    right: '30%',
    bottom: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c2c2c',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  description: {
    fontSize: 13,
    color: '#7d7d7d',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 35,
    paddingHorizontal: 20,
  },
  networksSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  networksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  networksSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b0b0b0',
    letterSpacing: 0.8,
  },
  refreshIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  selectedNetworkCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#5dd5e1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#5dd5e1',
  },
  networkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  networkItemSelected: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginBottom: 0,
    paddingHorizontal: 0,
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  wifiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  wifiIconContainerDefault: {
    backgroundColor: '#f0f0f0',
  },
  wifiIconContainerSelected: {
    backgroundColor: '#e8f7f8',
  },
  signalIcon: {
    marginRight: 12,
  },
  networkDetails: {
    flex: 1,
  },
  networkName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 4,
  },
  signalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#5dd5e1',
    marginRight: 6,
  },
  signalText: {
    fontSize: 11,
    color: '#5dd5e1',
    fontWeight: '600',
  },
  signalTextGray: {
    fontSize: 11,
    color: '#b0b0b0',
  },
  networkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lockIcon: {
    marginRight: 8,
  },
  selectedNetworkContent: {
    marginTop: 20,
  },
  passwordSectionInline: {
    marginBottom: 16,
  },
  passwordSection: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  passwordLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5dd5e1',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: '#2c2c2c',
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 18,
    opacity: 0.5,
  },
  connectButtonInline: {
    backgroundColor: '#5dd5e1',
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#5dd5e1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  connectButton: {
    backgroundColor: '#5dd5e1',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#5dd5e1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  connectButtonDisabled: {
    backgroundColor: '#d0d0d0',
    shadowOpacity: 0,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  hiddenNetworkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    paddingVertical: 12,
  },
  hiddenNetworkIcon: {
    marginRight: 6,
  },
  hiddenNetworkText: {
    fontSize: 13,
    color: '#5dd5e1',
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  noNetworksText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 20,
  },
});
