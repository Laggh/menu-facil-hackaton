import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import type { Produto, PedidoProduto } from '@shared/types';
import { useCart } from '@/context/cart-context';
import api from '@/lib/api';

const PRICE_COLOR = '#00BFA5';
const ACCENT_COLOR = '#6C63FF';

export default function CartScreen() {
  const { cart, updateQty, removeFromCart, updateObservacao, placeOrder, addToCart } = useCart();
  const [suggestions, setSuggestions] = useState<Produto[]>([]);
  const [editing, setEditing] = useState<PedidoProduto | null>(null);
  const [editObs, setEditObs] = useState('');
  const router = useRouter();

  const openEdit = (item: PedidoProduto) => {
    setEditing(item);
    setEditObs(item.observacao ?? '');
  };

  const saveEdit = () => {
    if (editing) updateObservacao(editing.produto.id, editObs);
    setEditing(null);
  };

  useEffect(() => {
    api.products.getAll()
      .then(data => setSuggestions((data.products ?? []).slice(0, 2)))
      .catch(console.error);
  }, []);

  const total = cart.reduce((sum, i) => sum + i.preco * i.quantidade, 0);

  const handlePlaceOrder = async () => {
    try {
      await placeOrder(1);
      Alert.alert('Pedido realizado!', 'Seu pedido foi enviado com sucesso.');
      router.back();
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível realizar o pedido.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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
          <Text style={styles.empty}>Nenhum item no carrinho.</Text>
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
        {suggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestionsTitle}>Sugestões</Text>
            {suggestions.map(p => {
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
            })}
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
          <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
            <Text style={styles.placeOrderText}>Realizar Pedido</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

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
});
