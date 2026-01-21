import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function ConnectionSuccessScreen({ navigation, route }: any) {
  const { deviceName, ipAddress } = route.params ?? {};

  const handleStart = () => {
    // Navegar a la siguiente pantalla o volver al inicio
    navigation.navigate('Test');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.pinkCircle}>
            <Ionicons name="checkmark" size={60} color="#fff" />
          </View>
          <View style={styles.starTopRight}>
            <Text style={styles.starIcon}>✨</Text>
          </View>
          <View style={styles.dotBottomLeft}>
            <View style={styles.smallDot} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>¡Todo listo!</Text>
        <Text style={styles.subtitle}>
          Tu amigo está conectado y{'\n'}esperando jugar.
        </Text>

        {/* Connection Info */}
        {ipAddress && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Dispositivo conectado</Text>
            <Text style={styles.infoValue}>{deviceName || 'Teddy-ESP32'}</Text>
            <Text style={styles.infoIp}>IP: {ipAddress}</Text>
          </View>
        )}

        {/* Action Cards */}
        <View style={styles.actionsContainer}>
          <View style={styles.actionCard}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionEmoji}>👍</Text>
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Actívalo</Text>
              <Text style={styles.actionDescription}>
                Dale un abrazo fuerte para{'\n'}encenderlo.
              </Text>
            </View>
          </View>

          <View style={styles.actionCard}>
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons name="chat-outline" size={28} color="#5dd5e1" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Háblale</Text>
              <Text style={styles.actionDescription}>
                Di "Hola Amigo" para empezar a{'\n'}charlar.
              </Text>
            </View>
          </View>

          <View style={styles.actionCard}>
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons name="chart-line" size={28} color="#ff9aa2" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Monitorea</Text>
              <Text style={styles.actionDescription}>
                Revisa el progreso diario en la app.
              </Text>
            </View>
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>Empezar</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.arrowIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  pinkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffb3ba',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ffb3ba',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  starTopRight: {
    position: 'absolute',
    top: -10,
    right: -15,
  },
  starIcon: {
    fontSize: 32,
  },
  dotBottomLeft: {
    position: 'absolute',
    bottom: 10,
    left: -20,
  },
  smallDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#b3e5fc',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c2c2c',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#7d7d7d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  infoCard: {
    backgroundColor: '#f5f9fa',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#5dd5e1',
  },
  infoLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#2c2c2c',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoIp: {
    fontSize: 13,
    color: '#5dd5e1',
    fontWeight: '500',
  },
  actionsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionEmoji: {
    fontSize: 28,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#7d7d7d',
    lineHeight: 18,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffb3ba',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    width: '100%',
    shadowColor: '#ffb3ba',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  arrowIcon: {
    marginTop: 2,
  },
});
