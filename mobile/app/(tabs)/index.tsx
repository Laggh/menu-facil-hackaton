import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SectionList,
  ScrollView,
  StyleSheet,
  Image,
  Modal,
  Animated,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter, useFocusEffect } from 'expo-router';
import type { Produto, Categoria, Pedido } from '@shared/types';
import api from '@/lib/api';
import { useCart } from '@/context/cart-context';
import { useUser } from '@/context/user-context';

const PRICE_COLOR = '#00BFA5';
const ACCENT_COLOR = '#6C63FF';

const CATEGORIAS: { key: Categoria; label: string; sectionLabel: string }[] = [
  { key: 'PRATO_PRINCIPAL',  label: 'Pratos',           sectionLabel: 'Pratos Principais' },
  { key: 'ACOMPANHAMENTOS',  label: 'Acompanhamentos',  sectionLabel: 'Acompanhamentos'   },
  { key: 'BEBIDAS',          label: 'Bebidas',          sectionLabel: 'Bebidas'            },
  { key: 'SOBREMESA',        label: 'Sobremesas',       sectionLabel: 'Sobremesas'         },
  { key: 'OUTROS',           label: 'Outros',           sectionLabel: 'Outros'             },
];

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const translateX = useRef(new Animated.Value(width)).current;
  const router = useRouter();
  const { cart } = useCart();
  const { user } = useUser();
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : width,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, width]);

  useEffect(() => {
    if (visible && user) {
      loadPendingOrders();
    }
  }, [visible, user]);

  const loadPendingOrders = async () => {
    try {
      const result = await import('@/lib/api').then(m => m.default.orders.getByUser());
      setPendingOrdersCount(result.pendentes?.length || 0);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
  };

  if (!visible) return null;

  const cartCount = cart.reduce((sum, i) => sum + i.quantidade, 0);

  const handleProfilePress = () => {
    onClose();
    if (user) {
      router.push('/auth/profile');
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <TouchableOpacity style={styles.sidebarOverlay} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.sidebar, { transform: [{ translateX }] }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <Text style={styles.sidebarTitle}>Menu</Text>
            <TouchableOpacity onPress={handleProfilePress}>
              {user ? (
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: ACCENT_COLOR, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>
                    {user.nome.charAt(0).toUpperCase()}
                  </Text>
                </View>
              ) : (
                <MaterialIcons name="person" size={48} color="#333" />
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => { onClose(); router.push('/cart'); }}
          >
            <MaterialIcons name="shopping-cart" size={22} color="#333" style={{ marginRight: 16 }} />
            <Text style={styles.sidebarItemText}>Carrinho</Text>
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sidebarItem}
            onPress={() => { onClose(); router.push('/orders'); }}
          >
            <MaterialIcons name="receipt-long" size={22} color="#333" style={{ marginRight: 16 }} />
            <Text style={styles.sidebarItemText}>Meus Pedidos</Text>
            {pendingOrdersCount > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{pendingOrdersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Produto }) {
  const router = useRouter();

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => router.push(`/product/${product.id}`)}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{product.nome}</Text>
        <Text style={styles.cardPrice}>
          R$ {product.preco.toFixed(2).replace('.', ',')}
        </Text>
      </View>
      {product.imagem_url ? (
        <Image source={{ uri: product.imagem_url }} style={styles.cardImage} />
      ) : (
        <View style={styles.cardImagePlaceholder} />
      )}
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Categoria>('PRATO_PRINCIPAL');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<Pedido | null>(null);
  const [showRepeatOrder, setShowRepeatOrder] = useState(true);
  const sectionListRef = useRef<SectionList>(null);
  const { addToCart: contextAddToCart } = useCart();
  const { user } = useUser();

  // Category chips auto-scroll
  const categoryScrollRef = useRef<ScrollView>(null);
  const chipLayouts = useRef<Record<string, { x: number; width: number }>>({});
  const categoryScrollViewWidth = useRef(0);
  const categoryScrollOffset = useRef(0);

  useEffect(() => {
    api.products.getAll()
      .then(data => setProducts(data.products ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fetch last completed order
  useEffect(() => {
    if (user) {
      loadLastOrder();
    }
  }, [user]);

  const loadLastOrder = async () => {
    try {
      const result = await api.orders.getLastOrder();
      setLastOrder(result.order);
      setShowRepeatOrder(true);
    } catch (error) {
      // No last order found
      setLastOrder(null);
    }
  };

  // Wrapper around addToCart to hide repeat order card
  const addToCart = (produto: Produto, observacao?: string) => {
    setShowRepeatOrder(false);
    contextAddToCart(produto, observacao);
  };

  // Limpa o estado ao voltar para a home
  useFocusEffect(
    useCallback(() => {
      // Reload last order when screen comes into focus
      if (user) {
        loadLastOrder();
      }
    }, [user])
  );

  const scrollChipsToShow = (cat: Categoria) => {
    const layout = chipLayouts.current[cat];
    if (!layout || !categoryScrollRef.current) return;
    const visStart = categoryScrollOffset.current;
    const visEnd = visStart + categoryScrollViewWidth.current;
    if (layout.x < visStart) {
      categoryScrollRef.current.scrollTo({ x: layout.x - 16, animated: true });
    } else if (layout.x + layout.width > visEnd) {
      categoryScrollRef.current.scrollTo({
        x: layout.x + layout.width - categoryScrollViewWidth.current + 16,
        animated: true,
      });
    }
  };

  const sections = CATEGORIAS
    .map(c => ({
      key: c.key,
      title: c.sectionLabel,
      data: products.filter(p => p.categoria === c.key),
    }))
    .filter(s => s.data.length > 0);

  const handleCategoryPress = (cat: Categoria) => {
    setActiveCategory(cat);
    const idx = sections.findIndex(s => s.key === cat);
    if (idx !== -1) {
      sectionListRef.current?.scrollToLocation({ sectionIndex: idx, itemIndex: 0, animated: true });
    }
  };

  const handleRepeatOrder = async () => {
    if (!lastOrder) return;
    
    try {
      for (const pedidoProduto of lastOrder.produtos) {
        // Add each item to cart with its quantity
        for (let i = 0; i < pedidoProduto.quantidade; i++) {
          addToCart(pedidoProduto.produto, pedidoProduto.observacao);
        }
      }
      
      // Dismiss the card and navigate to cart
      setShowRepeatOrder(false);
      // Small delay to show action completed
      setTimeout(() => {
        router.push('/cart');
      }, 300);
    } catch (error) {
      console.error('Erro ao repetir pedido:', error);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.topSafeArea}>
        <Sidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Search bar */}
      <View style={styles.searchRow}>
        <TouchableOpacity 
          style={styles.searchBox}
          onPress={() => {
            setShowRepeatOrder(false);
            router.push('/(tabs)/search');
          }}
          activeOpacity={0.65}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="search" size={18} color="#999" style={{ marginRight: 8 }} />
          <Text style={styles.searchPlaceholder}>Pesquisa com IA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuButton} onPress={() => setSidebarOpen(true)}>
          <MaterialIcons name="menu" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Category chips */}
      <ScrollView
        ref={categoryScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
        onLayout={e => { categoryScrollViewWidth.current = e.nativeEvent.layout.width; }}
        onScroll={e => { categoryScrollOffset.current = e.nativeEvent.contentOffset.x; }}
        scrollEventThrottle={16}
      >
        {CATEGORIAS.map(c => (
          <TouchableOpacity
            key={c.key}
            onPress={() => handleCategoryPress(c.key)}
            style={styles.categoryChip}
            onLayout={e => {
              chipLayouts.current[c.key] = { x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width };
            }}
          >
            <Text style={[styles.categoryLabel, activeCategory === c.key && styles.categoryLabelActive]}>
              {c.label}
            </Text>
            {activeCategory === c.key && <View style={styles.categoryUnderline} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      </SafeAreaView>

      {/* Repeat Last Order */}
      {lastOrder && showRepeatOrder && (
        <View style={styles.repeatOrderContainer}>
          <View style={styles.repeatOrderHeader}>
            <Text style={styles.repeatOrderTitle}>Repetir último pedido?</Text>
            <TouchableOpacity 
              onPress={() => setShowRepeatOrder(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="close" size={20} color="#999" />
            </TouchableOpacity>
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
              onPress={handleRepeatOrder}
            >
              <MaterialIcons name="add-shopping-cart" size={18} color="#fff" />
              <Text style={styles.repeatOrderButtonText}>Repetir</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Product list */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={ACCENT_COLOR} />
      ) : (
        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => <ProductCard product={item} />}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: 32 }}
          stickySectionHeadersEnabled={false}
          onViewableItemsChanged={({ viewableItems }) => {
            const first = viewableItems.find(v => v.section);
            if (first?.section) {
              const cat = (first.section as any).key as Categoria;
              setActiveCategory(cat);
              scrollChipsToShow(cat);
            }
          }}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topSafeArea: { backgroundColor: '#fff' },

  // Search
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 12, height: 40 },

  searchPlaceholder: { flex: 1, fontSize: 14, color: '#999', paddingVertical: 8 },
  menuButton: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },


  // Categories
  categoryScroll: { borderBottomWidth: 1, borderBottomColor: '#eee' },
  categoryContent: { paddingHorizontal: 16, gap: 8 },
  categoryChip: { paddingHorizontal: 4, paddingBottom: 6, marginRight: 16, alignItems: 'center' },
  categoryLabel: { fontSize: 14, color: '#888', paddingVertical: 6 },
  categoryLabelActive: { color: ACCENT_COLOR, fontWeight: '600' },
  categoryUnderline: { height: 2, width: '100%', backgroundColor: ACCENT_COLOR, borderRadius: 2 },

  // Section header
  sectionHeader: { fontSize: 18, fontWeight: '700', color: '#111', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, backgroundColor: '#fff' },

  // Card
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  cardInfo: { flex: 1, marginRight: 12 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 6 },
  cardPrice: { fontSize: 15, fontWeight: '700', color: PRICE_COLOR },
  cardImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#eee' },
  cardImagePlaceholder: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#E0E0E0' },

  // Separator
  separator: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 16 },

  // Sidebar
  sidebarOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sidebar: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '70%', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: -2, height: 0 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 10, padding: 20 },
  sidebarTitle: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 32, marginTop: 16 },
  sidebarItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  sidebarItemText: { fontSize: 16, color: '#333' },
  cartBadge: { marginLeft: 'auto', backgroundColor: ACCENT_COLOR, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  cartBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  pendingBadge: { marginLeft: 'auto', backgroundColor: '#FF9800', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  pendingBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Repeat Last Order
  repeatOrderContainer: { paddingHorizontal: 16, paddingVertical: 16, paddingTop: 20 },
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
  repeatOrderItemName: { 
    fontSize: 13, 
    color: '#333',
    fontWeight: '500',
    flex: 1
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
    color: '#111'
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
