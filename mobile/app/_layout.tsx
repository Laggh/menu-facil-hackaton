import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Alert } from 'react-native';
import { useEffect, useRef } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { CartProvider } from '@/context/cart-context';
import { UserProvider } from '@/context/user-context';
import api from '@/lib/api';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const aiUnavailablePopupShown = useRef(false);

  useEffect(() => {
    const checkAiQuotaState = async () => {
      try {
        const status = await api.ai.ping();
        if (status.aiFunctionsMayBeUnavailable && !aiUnavailablePopupShown.current) {
          aiUnavailablePopupShown.current = true;
          Alert.alert('Aviso', 'funções de IA podem estar indisponiveis');
        }
      } catch (error) {
        console.error('Falha ao consultar status de IA', error);
      }
    };

    checkAiQuotaState();
  }, []);

  return (
    <UserProvider>
      <CartProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="cart" options={{ headerShown: false }} />
            <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="auth/login" options={{ headerShown: false }} />
            <Stack.Screen name="auth/register" options={{ headerShown: false }} />
            <Stack.Screen name="auth/profile" options={{ headerShown: false }} />
            <Stack.Screen name="orders" options={{ headerShown: false }} />
            <Stack.Screen name="order-detail" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </CartProvider>
    </UserProvider>
  );
}
