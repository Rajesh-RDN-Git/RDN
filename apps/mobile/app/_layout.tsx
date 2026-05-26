import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { SocketProvider } from '@/providers/SocketProvider';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inPublicRoute = segments[0] === 'property' || segments[0] === 'society';

    if (!isAuthenticated && !inAuthGroup && !inPublicRoute) {
      // Allow tabs for browsing but restrict certain actions
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthGate>
      <SocketProvider>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen
            name="property/[id]"
            options={{ title: 'Property Details', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="society/[slug]"
            options={{ title: 'Society', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="lead/[id]"
            options={{ title: 'Lead Details', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="conversation/[id]"
            options={{ title: 'Chat', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="notifications"
            options={{ title: 'Notifications', headerBackTitle: 'Back' }}
          />
        </Stack>
      </SocketProvider>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
