import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { SocketProvider } from '@/providers/SocketProvider';
import { addNotificationResponseListener } from '@/lib/push';
import { initSentry } from '@/lib/sentry';

initSentry();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();

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
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const sub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | null;
      const route = data && typeof data.route === 'string' ? data.route : null;
      if (!route) return;
      try {
        router.push(route as never);
      } catch {
        /* invalid route — ignore */
      }
    });
    return () => sub.remove();
  }, [router]);

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
            name="property/new"
            options={{ title: 'List a property', headerBackTitle: 'Back' }}
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
          <Stack.Screen
            name="become-dealer"
            options={{ title: 'Become a Dealer', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="settings/delete-account"
            options={{ title: 'Delete Account', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="settings/consent"
            options={{ title: 'Manage Consent', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="settings/data-export"
            options={{ title: 'Export Data', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="settings/grievance"
            options={{ title: 'Data Grievance', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="grievances/index"
            options={{ title: 'Grievances', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="grievances/new"
            options={{ title: 'Raise a grievance', headerBackTitle: 'Back' }}
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
