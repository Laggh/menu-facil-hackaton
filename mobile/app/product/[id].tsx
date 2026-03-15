import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Produto } from '@shared/types';
import api from '@/lib/api';
import { useCart } from '@/context/cart-context';

const PRICE_COLOR = '#00BFA5';
const ACCENT_COLOR = '#6C63FF';

const RESTRICAO_LABELS: Record<string, string> = {
  VEGETARIANO: '🌱 Vegetariano',
  VEGANO: '🌿 Vegano',
  SEM_ACUCAR: '🚫 Sem Açúcar',
  SEM_SODIO: '🧂 Sem Sódio',
  CETOGENICO: '🥑 Cetogênico',
  SEM_GLUTEN: '🌾 Sem Glúten',
  SEM_LACTOSE: '🥛 Sem Lactose',
  APLV: '🐄 APLV',
  SEM_OLEAGINOSAS: '🥜 Sem Oleaginosas',
  SEM_FRUTOS_DO_MAR: '🦐 Sem Frutos do Mar',
  OUTROS: 'Outros',
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    api.products.getById(Number(id))
      .then(data => setProduct(data.product))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < qty; i++) {
      addToCart(product, observacao || undefined);
    }
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} size="large" color={ACCENT_COLOR} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={{ textAlign: 'center', marginTop: 40, color: '#999' }}>
          Produto não encontrado.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero image */}
        {product.imagem_url ? (
          <Image source={{ uri: product.imagem_url }} style={styles.heroImage} />
        ) : (
          <View style={styles.heroImagePlaceholder} />
        )}

        {/* Back button overlaid on image */}
        <SafeAreaView style={styles.backOverlay}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{product.nome}</Text>
            <Text style={styles.price}>R$ {product.preco.toFixed(2).replace('.', ',')}</Text>
          </View>

          <Text style={styles.description}>{product.descricao}</Text>

          {product.ingredientes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredientes</Text>
              <View style={styles.tagRow}>
                {product.ingredientes.map((ing, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{ing}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {product.restricoes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Restrições alimentares</Text>
              <View style={styles.tagRow}>
                {product.restricoes.map((r, i) => (
                  <View key={i} style={[styles.tag, styles.restricaoTag]}>
                    <Text style={[styles.tagText, styles.restricaoTagText]}>
                      {RESTRICAO_LABELS[r] ?? r}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <TextInput
              style={styles.observacaoInput}
              placeholder="Ex: Sem cebola, retirar a salsa..."
              placeholderTextColor="#999"
              value={observacao}
              onChangeText={setObservacao}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      {/* Add to cart footer */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
        <View style={styles.qtyControl}>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => setQty(Math.max(1, qty - 1))}
          >
            <Text style={styles.qtyButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyDisplay}>{qty}</Text>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => setQty(qty + 1)}
          >
            <Text style={styles.qtyButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
          <Text style={styles.addButtonText}>Adicionar</Text>
          <Text style={styles.addButtonPrice}>
            R$ {(product!.preco * qty).toFixed(2).replace('.', ',')}
          </Text>
        </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  heroImage: { width: '100%', height: 260, backgroundColor: '#eee' },
  heroImagePlaceholder: { width: '100%', height: 260, backgroundColor: '#E0E0E0' },

  backOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  backButton: {
    margin: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { padding: 20 },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  name: { flex: 1, fontSize: 22, fontWeight: '700', color: '#111' },
  price: { fontSize: 20, fontWeight: '700', color: PRICE_COLOR },
  description: { fontSize: 15, color: '#555', lineHeight: 22, marginBottom: 24 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontSize: 13, color: '#555' },
  restricaoTag: { backgroundColor: '#E8F5E9' },
  restricaoTagText: { color: '#2E7D32' },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    paddingBottom: 24,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  qtyButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: { fontSize: 18, fontWeight: '600', color: ACCENT_COLOR },
  qtyDisplay: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    minWidth: 32,
    textAlign: 'center',
    paddingVertical: 4,
  },
  addButton: {
    flex: 1,
    backgroundColor: ACCENT_COLOR,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  addButtonPrice: { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 2 },
    observacaoInput: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: '#111',
      backgroundColor: '#fafafa',
      textAlignVertical: 'top',
    },
});
