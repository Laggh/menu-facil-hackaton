import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
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

      // Poll every 5 seconds (silent refresh)
      const interval = setInterval(() => {
        refetchOrderSilently();
      }, 5000);

      return () => clearInterval(interval);
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

  const refetchOrderSilently = async () => {
    try {
      const result = await api.orders.getById(id as string);
      setOrder(result.order);
    } catch (error) {
      console.error('Erro ao refetch pedido:', error);
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
      <View>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={ACCENT_COLOR} />
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View>
        <View style={styles.container}>
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
        </View>
        </View>

    );
  }

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/orders')} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedidos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card com Data/Hora */}
        <View style={styles.statusCard}>
          <View style={styles.statusTopSection}>
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

          <View style={[styles.dateTimeRow, { backgroundColor: getStatusColor(order.status) }]}>
            <View style={styles.dateTimeBlock}>
              <MaterialIcons name="event" size={16} color="#fff" />
              <Text style={styles.dateTimeLabel}>Data</Text>
              <Text style={styles.dateTimeValue}>
                {new Date(order.criado_em).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            <View style={styles.dateTimeDivider} />
            <View style={styles.dateTimeBlock}>
              <MaterialIcons name="schedule" size={16} color="#fff" />
              <Text style={styles.dateTimeLabel}>Horário</Text>
              <Text style={styles.dateTimeValue}>{order.horario}</Text>
            </View>
            {order.completado_em && (
              <>
                <View style={styles.dateTimeDivider} />
                <View style={styles.dateTimeBlock}>
                  <MaterialIcons name="check-circle" size={16} color="#fff" />
                  <Text style={styles.dateTimeLabel}>Pronto</Text>
                  <Text style={styles.dateTimeValue}>
                    {new Date(order.completado_em).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Products */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Itens do Pedido</Text>
          {order.produtos.map((item, idx) => (
            <View key={idx} style={styles.productItemLarge}>
              {item.produto.imagem_url ? (
                <Image 
                  source={{ uri: item.produto.imagem_url }} 
                  style={styles.productImage} 
                />
              ) : (
                <View style={[styles.productImage, { backgroundColor: '#E0E0E0' }]} />
              )}
              <View style={styles.productDetailsContainer}>
                <View style={styles.productDetails}>
                  <Text style={styles.productNameDetail}>{item.produto.nome}</Text>
                  <Text style={styles.productDescDetail}>
                    {item.quantidade}x • R$ {item.preco.toFixed(2).replace('.', ',')}
                  </Text>
                  {item.observacao && (
                    <Text style={styles.observacaoText}>Obs: {item.observacao}</Text>
                  )}
                </View>
              </View>
              <Text style={styles.productPriceDetail}>
                R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
              </Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <Text style={styles.totalTextCompact}>
            Total:{' '}
            <Text style={styles.totalPriceCompact}>
              R$ {order.preco_total.toFixed(2).replace('.', ',')}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1 },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statusTopSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
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
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  dateTimeBlock: {
    alignItems: 'center',
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  dateTimeValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginTop: 2,
  },
  dateTimeDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
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
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  productDetailsContainer: {
    flex: 1,
    marginHorizontal: 8,
    justifyContent: 'center',
  },
  productDetails: {
    justifyContent: 'center',
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
    minWidth: 70,
    textAlign: 'right',
  },
  totalSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  totalTextCompact: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  totalPriceCompact: {
    fontSize: 16,
    fontWeight: '700',
    color: ACCENT_COLOR,
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
