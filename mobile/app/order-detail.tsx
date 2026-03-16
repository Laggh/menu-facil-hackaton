import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { Pedido } from '@shared/types';
import api from '@/lib/api';

const ACCENT_COLOR = '#6C63FF';
const SUCCESS_COLOR = '#00BFA5';
const PENDING_COLOR = '#FF9800';
const CANCELLED_COLOR = '#E53935';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Pedido | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const result = await api.orders.getById(id as string);
      setOrder(result.order);
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return PENDING_COLOR;
      case 'COMPLETO':
        return SUCCESS_COLOR;
      case 'CANCELADO':
        return CANCELLED_COLOR;
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return 'Em Preparação';
      case 'COMPLETO':
        return 'Pronto para Retirada';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="error-outline" size={48} color="#CCC" />
          <Text style={styles.emptyText}>Pedido não encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusIconContainer,
              { backgroundColor: getStatusColor(order.status) },
            ]}
          >
            <MaterialIcons
              name={
                order.status === 'COMPLETO'
                  ? 'check-circle'
                  : order.status === 'PENDENTE'
                    ? 'schedule'
                    : 'cancel'
              }
              size={40}
              color="#fff"
            />
          </View>
          <Text style={styles.statusLabelLarge}>{getStatusLabel(order.status)}</Text>
          <Text style={styles.orderIDText}>Pedido #{order.id.slice(-6)}</Text>
        </View>

        {/* Order Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <MaterialIcons name="event" size={18} color={ACCENT_COLOR} />
              <Text style={styles.infoLabelText}>Data</Text>
            </View>
            <Text style={styles.infoValue}>
              {new Date(order.criado_em).toLocaleDateString('pt-BR')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <MaterialIcons name="schedule" size={18} color={ACCENT_COLOR} />
              <Text style={styles.infoLabelText}>Horário</Text>
            </View>
            <Text style={styles.infoValue}>{order.horario}</Text>
          </View>
          {order.completado_em && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <MaterialIcons name="check-circle" size={18} color={SUCCESS_COLOR} />
                <Text style={styles.infoLabelText}>Pronto em</Text>
              </View>
              <Text style={styles.infoValue}>
                {new Date(order.completado_em).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Products */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Itens do Pedido</Text>
          {order.produtos.map((item, idx) => (
            <View key={idx} style={styles.productItemLarge}>
              <View style={styles.productDetails}>
                <Text style={styles.productNameDetail}>{item.produto.nome}</Text>
                <Text style={styles.productDescDetail}>
                  {item.quantidade}x • R$ {item.preco.toFixed(2).replace('.', ',')}
                </Text>
                {item.observacao && (
                  <Text style={styles.observacaoText}>Obs: {item.observacao}</Text>
                )}
              </View>
              <Text style={styles.productPriceDetail}>
                R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
              </Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabelDetail}>Total do Pedido</Text>
          <Text style={styles.totalPriceDetail}>
            R$ {order.preco_total.toFixed(2).replace('.', ',')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusLabelLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  orderIDText: {
    fontSize: 13,
    color: '#999',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9F9F9',
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabelText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  productsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 12,
  },
  productItemLarge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  productDetails: {
    flex: 1,
  },
  productNameDetail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productDescDetail: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  observacaoText: {
    fontSize: 11,
    color: ACCENT_COLOR,
    fontStyle: 'italic',
    marginTop: 4,
  },
  productPriceDetail: {
    fontSize: 14,
    fontWeight: '700',
    color: ACCENT_COLOR,
    marginLeft: 8,
  },
  totalCard: {
    backgroundColor: ACCENT_COLOR,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  totalLabelDetail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  totalPriceDetail: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 16,
  },
});
