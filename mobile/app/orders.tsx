import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import type { Pedido } from '@shared/types';
import api from '@/lib/api';

const ACCENT_COLOR = '#6C63FF';
const SUCCESS_COLOR = '#00BFA5';
const PENDING_COLOR = '#FF9800';
const CANCELLED_COLOR = '#E53935';

export default function OrdersScreen() {
  const [loading, setLoading] = useState(true);
  const [pendentes, setPendentes] = useState<Pedido[]>([]);
  const [completos, setCompletos] = useState<Pedido[]>([]);
  const [cancelados, setCancelados] = useState<Pedido[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'cancelled'>('pending');
  const router = useRouter();

  useEffect(() => {
    loadOrders();

    // Poll every 5 seconds
    const interval = setInterval(() => {
      loadOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const result = await api.orders.getByUser();
      setPendentes(result.pendentes || []);
      setCompletos(result.completos || []);
      setCancelados(result.cancelados || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
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

  const renderOrder = (order: Pedido) => (
    <TouchableOpacity 
      key={order.id} 
      style={styles.orderCard} 
      activeOpacity={0.85}
      onPress={() => router.replace({ pathname: '/order-detail', params: { id: order.id } })}
    >
      <View style={styles.orderCardContent}>
        <View style={styles.orderHeaderRow}>
          <View>
            <Text style={styles.orderNumberLarge}>Pedido #{order.id.slice(-6)}</Text>
            <Text style={styles.orderTimeSmall}>
              {new Date(order.criado_em).toLocaleDateString('pt-BR')} às{' '}
              {order.horario}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadgeLarge,
              { backgroundColor: getStatusColor(order.status) },
            ]}
          >
            <Text style={styles.statusTextLarge}>{getStatusLabel(order.status)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.orderProductsList}>
          {order.produtos.map((item, idx) => (
            <View key={idx} style={styles.productItem}>
              <View style={styles.productContent}>
                <Text style={styles.productNameLarge} numberOfLines={2}>
                  {item.produto.nome}
                </Text>
                <Text style={styles.productDetail}>
                  {item.quantidade}x • R$ {item.preco.toFixed(2).replace('.', ',')}
                </Text>
              </View>
              <Text style={styles.productSubtotal}>
                R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.orderTotalRow}>
          <Text style={styles.totalLabelLarge}>Total do Pedido</Text>
          <Text style={styles.totalPriceLarge}>
            R$ {order.preco_total.toFixed(2).replace('.', ',')}
          </Text>
        </View>

        {order.completado_em && (
          <Text style={styles.completedAtLarge}>
            ✓ Pronto desde {new Date(order.completado_em).toLocaleTimeString(
              'pt-BR',
              {
                hour: '2-digit',
                minute: '2-digit',
              }
            )}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const currentOrders =
    activeTab === 'pending' ? pendentes : activeTab === 'completed' ? completos : cancelados;

  return (
    <View style={styles.outerContainer}>
    <View style={styles.container}>
    <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/')} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'pending' && styles.tabLabelActive,
            ]}
          >
            Pendentes ({pendentes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'completed' && styles.tabLabelActive,
            ]}
          >
            Prontos ({completos.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cancelled' && styles.tabActive]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'cancelled' && styles.tabLabelActive,
            ]}
          >
            Cancelados ({cancelados.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT_COLOR} />
        </View>
      ) : currentOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="receipt-long" size={48} color="#CCC" />
          <Text style={styles.emptyText}>Nenhum pedido nesta categoria</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {currentOrders.map(renderOrder)}
        </ScrollView>
      )}
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: ACCENT_COLOR,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  tabLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 32,
  },
  orderCard: {
    marginBottom: 16,
  },
  orderCardContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumberLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  orderTimeSmall: {
    fontSize: 12,
    color: '#999',
  },
  statusBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusTextLarge: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  orderProductsList: {
    marginVertical: 4,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9F9F9',
  },
  productContent: {
    flex: 1,
    marginRight: 8,
  },
  productNameLarge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productDetail: {
    fontSize: 12,
    color: '#999',
  },
  productSubtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: ACCENT_COLOR,
    minWidth: 80,
    textAlign: 'right',
  },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabelLarge: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  totalPriceLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: ACCENT_COLOR,
  },
  completedAtLarge: {
    fontSize: 12,
    color: SUCCESS_COLOR,
    marginTop: 12,
    fontStyle: 'italic',
    fontWeight: '500',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
});

