import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import type { PedidoProduto, Pedido } from '@shared/types';
import api from '@/lib/api';
import { useCart } from '@/context/cart-context';
import { useUser } from '@/context/user-context';
import { ConfirmModal } from '@/components/ConfirmModal';

const PRICE_COLOR = '#00BFA5';
const ACCENT_COLOR = '#FF9800';

export default function CartScreen() {
  const { cart, updateQty, removeFromCart, updateObservacao, clearCart, addToCart, suggestions, loadingSuggestions } = useCart();
  const { user } = useUser();
  const [editing, setEditing] = useState<PedidoProduto | null>(null);
  const [editObs, setEditObs] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [lastOrder, setLastOrder] = useState<Pedido | null>(null);
  const [loadingLastOrder, setLoadingLastOrder] = useState(false);
  const router = useRouter();

  // Fetch last order when cart is empty
  useEffect(() => {
    if (cart.length === 0 && user) {
      loadLastOrder();
    } else {
      setLastOrder(null);
    }
  }, [cart.length, user]);

  const loadLastOrder = async () => {
    try {
      setLoadingLastOrder(true);
      const result = await api.orders.getLastOrder();
      setLastOrder(result.order);
    } catch (error) {
      setLastOrder(null);
    } finally {
      setLoadingLastOrder(false);
    }
  };

  const handleRepeatLastOrder = () => {
    if (!lastOrder) return;
    
    try {
      for (const pedidoProduto of lastOrder.produtos) {
        for (let i = 0; i < pedidoProduto.quantidade; i++) {
          addToCart(pedidoProduto.produto, pedidoProduto.observacao);
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar os itens do último pedido.');
    }
  };

  const openEdit = (item: PedidoProduto) => {
    setEditing(item);
    setEditObs(item.observacao ?? '');
  };

  const saveEdit = () => {
    if (editing) updateObservacao(editing.produto.id, editObs);
    setEditing(null);
  };

  const total = cart.reduce((sum, i) => sum + i.preco * i.quantidade, 0);

  const handleConfirmOrder = async () => {
    try {
      setPlacing(true);
      clearCart();
      setShowConfirmModal(false);
      Alert.alert('Funcao indisponivel na demo', 'Por seguranca, realizar pedidos nao esta disponivel nesta demonstracao. O carrinho foi limpo.');
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível realizar o pedido.');
    } finally {
      setPlacing(false);
    }
  };

  const handlePlaceOrder = () => {
    setShowConfirmModal(true);
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Carrinho</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: cart.length > 0 ? 140 : 32 }}>
        {/* Cart items */}
        {cart.length === 0 ? (
          <View>
            {/* Repeat Last Order */}
            {lastOrder && (
              <View style={styles.repeatOrderContainer}>
                <View style={styles.repeatOrderHeader}>
                  <Text style={styles.repeatOrderTitle}>Repetir último pedido?</Text>
                </View>

                <View style={styles.repeatOrderProducts}>
                  {lastOrder.produtos.map((item, idx) => (
                    <View key={idx} style={styles.repeatOrderItem}>
                      <View style={styles.repeatOrderItemInfo}>
                        <Text style={styles.repeatOrderItemName}>{item.produto.nome}</Text>
                        {item.quantidade > 1 && (
                          <Text style={styles.repeatOrderItemQty}>x{item.quantidade}</Text>
                        )}
                      </View>
                      <Text style={styles.repeatOrderItemPrice}>
                        R$ {(item.preco * item.quantidade).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.repeatOrderFooter}>
                  <Text style={styles.repeatOrderTotalPrice}>
                    Total: R$ {lastOrder.preco_total.toFixed(2)}
                  </Text>
                  <TouchableOpacity 
                    style={styles.repeatOrderButton}
                    onPress={handleRepeatLastOrder}
                  >
                    <MaterialIcons name="add-shopping-cart" size={18} color="#fff" />
                    <Text style={styles.repeatOrderButtonText}>Repetir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            <Text style={styles.empty}>Nenhum item no carrinho.</Text>
          </View>
        ) : (
          cart.map(item => (
            <TouchableOpacity key={item.produto.id} style={styles.cartItem} activeOpacity={0.85} onPress={() => openEdit(item)}>
              {item.produto.imagem_url ? (
                <Image source={{ uri: item.produto.imagem_url }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, { backgroundColor: '#E0E0E0' }]} />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.produto.nome}</Text>
                {item.observacao ? (
                  <Text style={styles.itemObs} numberOfLines={1}>{item.observacao}</Text>
                ) : null}
                <Text style={styles.itemPrice}>
                  R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                </Text>
              </View>
              <View style={styles.itemControls}>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => updateQty(item.produto.id, item.quantidade - 1)}
                >
                  <MaterialIcons name="remove" size={16} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantidade}</Text>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => updateQty(item.produto.id, item.quantidade + 1)}
                >
                  <MaterialIcons name="add" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Edit item modal */}
        <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditing(null)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{editing?.produto.nome}</Text>
              <TouchableOpacity
                onPress={() => {
                  if (editing) removeFromCart(editing.produto.id);
                  setEditing(null);
                }}
              >
                <MaterialIcons name="delete-outline" size={24} color="#E53935" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Observações</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Sem cebola, retirar a salsa..."
              placeholderTextColor="#999"
              value={editObs}
              onChangeText={setEditObs}
              multiline
              numberOfLines={3}
              autoFocus
            />
            <TouchableOpacity style={styles.modalSaveButton} onPress={saveEdit}>
              <Text style={styles.modalSaveText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Suggestions */}
        {cart.length > 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestionsTitle}>Sugestões</Text>
            {loadingSuggestions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={ACCENT_COLOR} />
                <Text style={styles.loadingText}>Gerando sugestões...</Text>
              </View>
            ) : suggestions.length > 0 ? (
              suggestions.map(p => {
                const inCart = cart.find(i => i.produto.id === p.id);
                return (
                  <View key={p.id} style={styles.suggestionCard}>
                    {p.imagem_url ? (
                      <Image source={{ uri: p.imagem_url }} style={styles.suggestionImage} />
                    ) : (
                      <View style={[styles.suggestionImage, { backgroundColor: '#E0E0E0' }]} />
                    )}
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionName} numberOfLines={1}>{p.nome}</Text>
                      <Text style={styles.suggestionPrice}>
                        R$ {p.preco.toFixed(2).replace('.', ',')}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.suggestionAdd} onPress={() => addToCart(p)}>
                      {inCart ? (
                        <Text style={styles.suggestionAddText}>{inCart.quantidade}×</Text>
                      ) : (
                        <MaterialIcons name="add" size={18} color="#fff" />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View style={styles.noSuggestionsContainer}>
                <Text style={styles.noSuggestionsText}>Nenhuma sugestão</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      {cart.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>R$ {total.toFixed(2).replace('.', ',')}</Text>
          </View>
          <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder} disabled={placing}>
            <Text style={styles.placeOrderText}>Realizar Pedido</Text>
          </TouchableOpacity>
        </View>
      )}

      <ConfirmModal
        visible={showConfirmModal}
        title="Deseja realizar o pedido?"
        message={`Total: R$ ${total.toFixed(2).replace('.', ',')}\n${cart.length} ${cart.length === 1 ? 'item' : 'itens'} no carrinho`}
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={handleConfirmOrder}
        onCancel={() => setShowConfirmModal(false)}
        loading={placing}
        confirmColor={ACCENT_COLOR}
      />
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },

  empty: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 48 },

  // Cart items
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  itemImage: { width: 64, height: 64, borderRadius: 8 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111' },
  itemObs: { fontSize: 12, color: '#999', marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: PRICE_COLOR, marginTop: 4 },
  itemControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ACCENT_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 14, fontWeight: '700', color: '#111', minWidth: 20, textAlign: 'center' },

  // Suggestions
  suggestionsSection: { paddingTop: 24, paddingHorizontal: 16 },
  suggestionsTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 16 },
  loadingContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: '#666', fontWeight: '500' },
  noSuggestionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  noSuggestionsText: { fontSize: 14, color: '#999', fontWeight: '500' },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  suggestionImage: { width: 56, height: 56, borderRadius: 8 },
  suggestionInfo: { flex: 1 },
  suggestionName: { fontSize: 14, fontWeight: '600', color: '#111' },
  suggestionPrice: { fontSize: 13, fontWeight: '700', color: PRICE_COLOR, marginTop: 4 },
  suggestionAdd: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ACCENT_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionAddText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  // Edit modal
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    gap: 14,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#111', marginRight: 12 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#666' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111',
    backgroundColor: '#fafafa',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  modalSaveButton: {
    backgroundColor: ACCENT_COLOR,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  totalValue: { fontSize: 18, fontWeight: '700', color: PRICE_COLOR },
  placeOrderButton: {
    backgroundColor: ACCENT_COLOR,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  placeOrderText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Repeat Last Order
  repeatOrderContainer: { paddingHorizontal: 16, paddingVertical: 16, marginTop: 8 },
  repeatOrderHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 12
  },
  repeatOrderTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#111'
  },
  repeatOrderProducts: { 
    marginBottom: 12
  },
  repeatOrderItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  repeatOrderItemInfo: { 
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  repeatOrderItemQty: { 
    fontSize: 12, 
    color: '#999',
    backgroundColor: '#EFEFEF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden'
  },
  repeatOrderItemName: { 
    fontSize: 13, 
    color: '#333',
    fontWeight: '500',
    flex: 1
  },
  repeatOrderItemPrice: { 
    fontSize: 12, 
    fontWeight: '600',
    color: PRICE_COLOR,
    marginLeft: 8
  },
  repeatOrderFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  repeatOrderTotalPrice: { 
    fontSize: 14, 
    fontWeight: '700',
    color: PRICE_COLOR
  },
  repeatOrderButton: { 
    backgroundColor: ACCENT_COLOR, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6
  },
  repeatOrderButtonText: { 
    color: '#fff', 
    fontSize: 13,
    fontWeight: '600'
  },
});
