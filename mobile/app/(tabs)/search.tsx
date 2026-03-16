import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import type { Produto } from '@shared/types';
import api from '@/lib/api';

const PRICE_COLOR = '#00BFA5';
const ACCENT_COLOR = '#6C63FF';

function ProductCard({ product }: { product: Produto }) {
  const router = useRouter();

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.85} 
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{product.nome}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {product.descricao}
        </Text>
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

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState(params.q ? String(params.q) : '');
  const [results, setResults] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Se houver query param inicial, pesquisa automaticamente
    if (params.q) {
      performSearch(String(params.q));
    }
  }, []);

  // Focus quando a tela ganha foco (mais confiável que useEffect com setTimeout)
  useFocusEffect(
    useCallback(() => {
      // Tira o focus do teclado se já estava aberto
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
      
      return () => clearTimeout(timer);
    }, [])
  );

  // Limpa o estado quando sai da tela
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Limpa tudo quando volta para a home
        setSearchQuery('');
        setResults([]);
        setHasSearched(false);
      };
    }, [])
  );

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    setLoading(true);
    try {
      const data = await api.products.search(query);
      setResults(data.products ?? []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    performSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setHasSearched(false);
    searchInputRef.current?.focus();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with search bar */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="O que você quer comer hoje?"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus={true}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={handleClearSearch}
            >
              <MaterialIcons name="close" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <MaterialIcons name="arrow-forward" size={24} color={ACCENT_COLOR} />
        </TouchableOpacity>
      </View>

      {/* Results or empty state */}
      {!hasSearched ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search" size={64} color="#ddd" />
          <Text style={styles.emptyText}>
            Comece a digitar para buscar produtos
          </Text>
          <Text style={styles.emptySubtext}>
            Você pode descrever o que quer (ex: "algo leve sem lactose")
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT_COLOR} />
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <ProductCard product={item} />}
          contentContainerStyle={styles.listContent}
          scrollIndicatorInsets={{ right: 1 }}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="inventory-2" size={64} color="#ddd" />
          <Text style={styles.emptyText}>
            Nenhum produto encontrado
          </Text>
          <Text style={styles.emptySubtext}>
            Tente outro termo de busca
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  backButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    padding: 0,
    height: '100%',
    minHeight: 48,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  searchButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: PRICE_COLOR,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  cardImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
});
