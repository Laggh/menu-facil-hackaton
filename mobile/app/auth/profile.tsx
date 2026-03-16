import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useUser } from '@/context/user-context';

const ACCENT_COLOR = '#6C63FF';
const PRICE_COLOR = '#00BFA5';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    idade: user?.idade?.toString() || '',
  });

  // Redirecionar para home se logout foi feito
  useEffect(() => {
    if (!user) {
      console.log('User é null, redirecionando para home');
      router.replace('/(tabs)/');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const idade = parseInt(formData.idade, 10);
      if (isNaN(idade) || idade < 13) {
        Alert.alert('Erro', 'Insira uma idade válida (mínimo 13 anos)');
        return;
      }

      await updateProfile({
        nome: formData.nome,
        email: formData.email,
        idade,
      });

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Erro', String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('HandleLogout chamado');
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    console.log('Confirmou logout, chamando logout()');
    setShowLogoutModal(false);
    try {
      await logout();
      console.log('Logout bem-sucedido');
    } catch (error) {
      console.error('Erro no logout:', error);
      Alert.alert('Erro', 'Erro ao fazer logout: ' + String(error));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.logoutModalOverlay}>
          <View style={styles.logoutModalContent}>
            <Text style={styles.logoutModalTitle}>Sair da Conta?</Text>
            <Text style={styles.logoutModalMessage}>Tem certeza que deseja sair?</Text>
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity
                style={styles.logoutModalCancel}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.6}
              >
                <Text style={styles.logoutModalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutModalConfirm}
                onPress={confirmLogout}
                activeOpacity={0.6}
              >
                <Text style={styles.logoutModalConfirmText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
          {!isEditing ? (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <MaterialIcons name="edit" size={24} color={ACCENT_COLOR} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 24 }} />
          )}
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.profileSection}>
            <View style={styles.userIcon}>
              <MaterialIcons name="person" size={56} color="#fff" />
            </View>
            <Text style={styles.userName}>{user?.nome || 'Usuário'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>

          {isEditing ? (
            // Edit mode
            <View style={styles.form}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                placeholder="Seu nome"
                value={formData.nome}
                onChangeText={(text) => setFormData({ ...formData, nome: text })}
                editable={!loading}
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                editable={!loading}
                autoCapitalize="none"
              />

              <Text style={styles.label}>Idade</Text>
              <TextInput
                style={styles.input}
                placeholder="18"
                value={formData.idade}
                onChangeText={(text) => setFormData({ ...formData, idade: text })}
                keyboardType="number-pad"
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonLoading]}
                onPress={handleSaveProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Salvar Alterações</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsEditing(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // View mode
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <MaterialIcons name="person" size={20} color={ACCENT_COLOR} />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.infoLabel}>Nome</Text>
                  <Text style={styles.infoValue}>{user?.nome}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons name="email" size={20} color={ACCENT_COLOR} />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user?.email}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons name="cake" size={20} color={ACCENT_COLOR} />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.infoLabel}>Idade</Text>
                  <Text style={styles.infoValue}>{user?.idade} anos</Text>
                </View>
              </View>

              {user?.etiqueta && (
                <View style={styles.etiquetaSection}>
                  <Text style={styles.etiquetaLabel}>Tuas Preferências (IA)</Text>
                  <Text style={styles.etiquetaValue}>{user.etiqueta}</Text>
                </View>
              )}
            </View>
          )}

          {!isEditing && (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.6}>
              <MaterialIcons name="logout" size={20} color="#D32F2F" />
              <Text style={styles.logoutButtonText}>Sair da Conta</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },

  content: { flex: 1, paddingHorizontal: 24, paddingVertical: 24 },

  profileSection: { alignItems: 'center', marginBottom: 32, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#eee' },
  userIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: ACCENT_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#666' },

  infoSection: { marginBottom: 24 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: { fontSize: 12, color: '#999', fontWeight: '500' },
  infoValue: { fontSize: 16, color: '#333', fontWeight: '500', marginTop: 4 },

  etiquetaSection: {
    backgroundColor: '#F0F0FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  etiquetaLabel: { fontSize: 12, color: '#999', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  etiquetaValue: { fontSize: 14, color: '#333', lineHeight: 20 },

  form: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
  },

  button: {
    backgroundColor: ACCENT_COLOR,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonLoading: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#fff' },

  cancelButton: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: '#666' },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 24,
  },
  logoutButtonText: { fontSize: 16, fontWeight: '600', color: '#D32F2F', marginLeft: 8 },

  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 24,
    width: '80%',
    maxWidth: 300,
  },
  logoutModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  logoutModalMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  logoutModalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  logoutModalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  logoutModalConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
  },
  logoutModalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
