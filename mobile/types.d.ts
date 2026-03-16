/*
Esse arqiovo é para declarar os tipos de componentes do React Native
e do Expo Router, já que o TypeScript não tem as definições de tipo
para esses módulos. Ele serve para evitar erros de tipo ao usar esses
componentes e funções em nosso código.

Quase enlouqueci pra fazer isso aqui, puta q pariu
*/

declare module 'react-native' {
  export = ReactNative;
}

declare namespace ReactNative {
  interface View extends React.Component<any> {}
  interface Text extends React.Component<any> {}
  interface ScrollView extends React.Component<any> {}
  interface TextInput extends React.Component<any> {}
  interface TouchableOpacity extends React.Component<any> {}
  interface Image extends React.Component<any> {}
  interface SafeAreaView extends React.Component<any> {}
  interface FlatList extends React.Component<any> {}
  interface SectionList extends React.Component<any> {}
  interface Modal extends React.Component<any> {}
  interface Pressable extends React.Component<any> {}
  interface Switch extends React.Component<any> {}
  interface ActivityIndicator extends React.Component<any> {}

  export const View: any;
  export const Text: any;
  export const ScrollView: any;
  export const TextInput: any;
  export const TouchableOpacity: any;
  export const Image: any;
  export const SafeAreaView: any;
  export const FlatList: any;
  export const SectionList: any;
  export const Modal: any;
  export const Pressable: any;
  export const Switch: any;
  export const ActivityIndicator: any;
  
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


