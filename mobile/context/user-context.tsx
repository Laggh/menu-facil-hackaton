import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Usuario } from '@shared/types';
import api, { setUserId, getUserId } from '@/lib/api';

interface UserContextType {
  user: Usuario | null;
  isLoading: boolean;
  login: (email: string) => Promise<{ user: Usuario; token: string }>;
  register: (nome: string, email: string, idade: number) => Promise<{ user: Usuario }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Omit<Usuario, 'id'>>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar usuário do AsyncStorage ao iniciar
  useEffect(() => {
    const restoreUser = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          setUserId(userId);
          const { user: userData } = await api.user.getMe();
          setUser(userData);
        }
      } catch (error) {
        console.error('Erro ao restaurar usuário:', error);
        await AsyncStorage.removeItem('userId');
      } finally {
        setIsLoading(false);
      }
    };

    restoreUser();
  }, []);

  const login = async (email: string) => {
    try {
      const response = await api.user.login(email);
      const { user: userData, token } = response;

      // Salvar userId no AsyncStorage
      await AsyncStorage.setItem('userId', userData.id.toString());
      setUserId(userData.id.toString());

      setUser(userData);
      return response;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const register = async (nome: string, email: string, idade: number) => {
    try {
      const response = await api.user.register(nome, email, idade);
      const { user: userData } = response;

      // Salvar userId no AsyncStorage
      await AsyncStorage.setItem('userId', userData.id.toString());
      setUserId(userData.id.toString());

      setUser(userData);
      return response;
    } catch (error) {
      console.error('Erro ao registrar:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logout iniciado...');
      await AsyncStorage.removeItem('userId');
      setUserId(''); // Use empty string instead of null
      setUser(null);
      console.log('Logout completo');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<Omit<Usuario, 'id'>>) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const response = await api.user.update(data);
      const { user: updatedUser } = response;

      setUser(updatedUser);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ user, isLoading, login, register, logout, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser deve ser usado dentro de UserProvider');
  }
  return context;
}
