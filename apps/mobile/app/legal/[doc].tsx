import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';

const URLS: Record<string, string> = {
  privacy: 'https://www.rdnetwork.in/privacy',
  terms: 'https://www.rdnetwork.in/terms',
};

// Renders the live web legal pages inside the app so Privacy Policy / Terms are a
// single source of truth (store requirement) and never drift from the website.
export default function LegalScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const uri = URLS[doc ?? 'privacy'] ?? URLS.privacy;

  return (
    <WebView
      source={{ uri }}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
