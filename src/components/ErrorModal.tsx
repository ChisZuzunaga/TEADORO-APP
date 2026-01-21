import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: 'error' | 'warning' | 'info';
}

export default function ErrorModal({
  visible,
  title,
  message,
  onClose,
  type = 'error',
}: ErrorModalProps) {
  const getIconConfig = () => {
    switch (type) {
      case 'error':
        return { name: 'close-circle', color: '#ff6b6b' };
      case 'warning':
        return { name: 'warning-outline', color: '#ffa726' };
      case 'info':
        return { name: 'information-circle', color: '#5dd5e1' };
      default:
        return { name: 'close-circle', color: '#ff6b6b' };
    }
  };

  const iconConfig = getIconConfig();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${iconConfig.color}15` }]}>
            <Ionicons name={iconConfig.name as any} size={48} color={iconConfig.color} />
          </View>

          <Text style={styles.title}>{title || 'Error'}</Text>
          <Text style={styles.message}>{message || 'Ocurrió un error inesperado'}</Text>

          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => {
              try {
                onClose();
              } catch (error) {
                console.log('Error cerrando modal:', error);
              }
            }}
          >
            <Text style={styles.closeButtonText}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c2c2c',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#7d7d7d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: '#5dd5e1',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#5dd5e1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
