import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useUser } from '@/context/user-context';

const ACCENT_COLOR = '#FF9800';
const PRICE_COLOR = '#00BFA5';

export default function LoginScreen() {
  const router = useRouter();
  const { user, login, isLoading } = useUser();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Se já está logado, redireciona para home
  useEffect(() => {
    if (user && !isLoading) {
      router.replace('/(tabs)/');
    }
  }, [user, isLoading, router]);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor, insira seu email');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Erro', 'Insira um email válido');
      return;
    }

    setLoading(true);
    try {
      await login(email);
      router.replace('/(tabs)/');
    } catch (error) {
      Alert.alert('Erro ao fazer login', String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    router.replace('/(tabs)/');
  };

  return (
    <View style={styles.container}>
      <View>
        <View style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Login</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="person" size={56} color={ACCENT_COLOR} />
          </View>

          <Text style={styles.title}>Bem-vindo de volta!</Text>
          <Text style={styles.subtitle}>
            Faça login para acessar suas preferências e histórico de pedidos
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              editable={!loading}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonLoading]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push('/auth/register')}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>Criar uma conta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleContinueAsGuest}
            disabled={loading}
          >
            <Text style={styles.guestButtonText}>Continuar como convidado</Text>
          </TouchableOpacity>
        </View>
        </View>
      </View>
    </View>
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

  content: { flex: 1, paddingHorizontal: 24, paddingVertical: 32 },

  iconContainer: {
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  title: { fontSize: 28, fontWeight: '700', color: '#111', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32, lineHeight: 20 },

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
  },

  button: {
    backgroundColor: ACCENT_COLOR,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonLoading: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#fff' },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#ddd' },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: '#999' },

  registerButton: {
    borderWidth: 1.5,
    borderColor: ACCENT_COLOR,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  registerButtonText: { fontSize: 14, fontWeight: '600', color: ACCENT_COLOR },

  guestButton: { paddingVertical: 12, alignItems: 'center' },
  guestButtonText: { fontSize: 14, color: '#666' },
});
