import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { RestricaoInfo } from '@/constants/restricoes';

const ACCENT_COLOR = '#6C63FF';

interface RestricaoModalProps {
  visible: boolean;
  restricao: RestricaoInfo | null;
  onClose: () => void;
}

export function RestricaoModal({ visible, restricao, onClose }: RestricaoModalProps) {
  if (!restricao) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop overlay */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Modal content */}
      <View>
        <View style={styles.container}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons
              name="warning"
              size={32}
              color="#D32F2F"
              style={{ marginRight: 12 }}
            />
            <Text style={styles.title}>{restricao.label}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.description}>
            {restricao.descricao}
          </Text>

          {/* Close button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onClose}
          >
            <Text style={styles.actionButtonText}>Entendi</Text>
          </TouchableOpacity>
        </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  closeButton: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 21,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
