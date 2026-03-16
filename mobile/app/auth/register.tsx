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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useUser } from '@/context/user-context';

const ACCENT_COLOR = '#6C63FF';

export default function RegisterScreen() {
  const router = useRouter();
  const { user, register, isLoading } = useUser();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [idade, setIdade] = useState('');
  const [loading, setLoading] = useState(false);

  // Se já está logado, redireciona para home
  useEffect(() => {
    if (user && !isLoading) {
      router.replace('/(tabs)/');
    }
  }, [user, isLoading, router]);

  const handleRegister = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'Por favor, insira seu nome');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Erro', 'Insira um email válido');
      return;
    }

    const idadeNum = parseInt(idade, 10);
    if (isNaN(idadeNum) || idadeNum < 13) {
      Alert.alert('Erro', 'Insira uma idade válida (mínimo 13 anos)');
      return;
    }

    setLoading(true);
    try {
      await register(nome, email, idadeNum);
      Alert.alert('Sucesso', 'Conta criada com sucesso!');
      router.replace('/(tabs)/');
    } catch (error) {
      Alert.alert('Erro ao criar conta', String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Registrar</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="person-add" size={56} color={ACCENT_COLOR} />
          </View>

          <Text style={styles.title}>Crie sua conta</Text>
          <Text style={styles.subtitle}>
            Registre-se para obter recomendações personalizadas
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor="#999"
              value={nome}
              onChangeText={setNome}
              editable={!loading}
              autoCorrect={false}
            />

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

            <Text style={styles.label}>Idade</Text>
            <TextInput
              style={styles.input}
              placeholder="18"
              placeholderTextColor="#999"
              value={idade}
              onChangeText={setIdade}
              keyboardType="number-pad"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonLoading]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Criar Conta</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')} disabled={loading}>
              <Text style={styles.footerLink}>Fazer login</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    marginBottom: 16,
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

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14, color: '#666' },
  footerLink: { fontSize: 14, fontWeight: '600', color: ACCENT_COLOR },
});
