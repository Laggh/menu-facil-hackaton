/*
Esse arqiovo é para declarar os tipos de componentes do React Native
e do Expo Router, já que o TypeScript não tem as definições de tipo
para esses módulos. Ele serve para evitar erros de tipo ao usar esses
componentes e funções em nosso código.

Quase enlouqueci pra fazer isso aqui, puta q pariu
*/

declare module 'react-native' {
  interface ViewStyle {
    [key: string]: any;
  }
  
  interface NativeSafeAreaViewProps {
    style?: ViewStyle | any;
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  export const SafeAreaView: React.ComponentType<NativeSafeAreaViewProps & { children?: React.ReactNode; style?: any }>;

  export = ReactNative;
}

declare namespace ReactNative {
  interface View extends React.Component<any> {}
  interface Text extends React.Component<any> {}
  interface ScrollView extends React.Component<any> {
    scrollTo(options: { x?: number; y?: number; animated?: boolean }): void;
  }
  interface TextInput extends React.Component<any> {}
  interface TouchableOpacity extends React.Component<any> {}
  interface Image extends React.Component<any> {}
  interface SafeAreaView extends React.Component<any> {}
  interface FlatList extends React.Component<any> {}
  interface SectionList extends React.Component<any> {
    scrollToLocation(options: { sectionIndex: number; itemIndex: number; animated?: boolean }): void;
  }
  interface Modal extends React.Component<any> {}
  interface Pressable extends React.Component<any> {}
  interface Switch extends React.Component<any> {}
  interface ActivityIndicator extends React.Component<any> {}
  
  interface ViewProps {
    style?: any;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export const View: React.ComponentType<any>;
  export const Text: React.ComponentType<any>;
  export const ScrollView: React.ComponentType<any & { style?: any }>;
  export const TextInput: React.ComponentType<any>;
  export const TouchableOpacity: React.ComponentType<any>;
  export const Image: React.ComponentType<any>;
  export const SafeAreaView: React.ComponentType<any & { style?: any }>;
  export const FlatList: React.ComponentType<any>;
  export const SectionList: React.ComponentType<any>;
  export const Modal: React.ComponentType<any>;
  export const Pressable: React.ComponentType<any>;
  export const Switch: React.ComponentType<any>;
  export const ActivityIndicator: React.ComponentType<any>;
  
  export const StyleSheet: any;
  export const Alert: any;
  export const Dimensions: any;
  export const Platform: any;
  export const Animated: any;
  export function useWindowDimensions(): any;
}

declare module 'expo-router' {
  export const useRouter: any;
  export const useLocalSearchParams: any;
  export const useSearchParams: any;
  export const useFocusEffect: any;
  export const usePath: any;
  export const usePathname: any;
  export const useSegments: any;
  export const Link: any;
  export const Stack: any;
  export const Tabs: any;
  export const Slot: any;
}

declare module 'react-native-safe-area-context' {
  export const SafeAreaView: React.ComponentType<any & { style?: any; children?: React.ReactNode }>;
  export const useSafeAreaInsets: any;
  export const SafeAreaProvider: any;
}

declare module 'react-native-reanimated' {
  import type { ComponentType, ReactNode } from 'react';
  
  export interface AnimatedScrollViewProps {
    style?: any;
    children?: ReactNode;
    scrollEventThrottle?: number;
    ref?: any;
    [key: string]: any;
  }
  
  export interface AnimatedViewProps {
    style?: any;
    children?: ReactNode;
    [key: string]: any;
  }
  
  // Types for animated component instances
  export interface AnimatedScrollViewInstance {
    scrollTo(options: { x?: number; y?: number; animated?: boolean }): void;
  }

  export interface AnimatedViewInstance {
    [key: string]: any;
  }
  
  namespace Animated {
    const ScrollView: ComponentType<AnimatedScrollViewProps>;
    const View: ComponentType<AnimatedViewProps>;
  }
  
  const Animated: {
    ScrollView: ComponentType<AnimatedScrollViewProps>;
    View: ComponentType<AnimatedViewProps>;
  };
  
  export default Animated;
  export const interpolate: (
    value: number,
    input: number[],
    output: number[]
  ) => number;
  
  export function useAnimatedRef<T = any>(): React.MutableRefObject<T>;
  export function useAnimatedStyle(callback: () => any): any;
  export function useScrollOffset(ref: any): { value: number };
}


