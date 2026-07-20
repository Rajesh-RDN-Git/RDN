import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { SocketProvider } from '@/providers/SocketProvider';
import { addNotificationResponseListener } from '@/lib/push';
import { initSentry } from '@/lib/sentry';

initSentry();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuthStore();

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
    <SafeAreaProvider>
      <AuthGate>
        <SocketProvider>
          <StatusBar style="auto" />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen
              name="property/[id]/index"
              options={{ title: 'Property Details', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="property/[id]/edit"
              options={{ title: 'Edit Property', headerBackTitle: 'Back' }}
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
              name="settings/edit-profile"
              options={{ title: 'Edit Profile', headerBackTitle: 'Back' }}
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
              name="settings/notification-preferences"
              options={{ title: 'Notification Preferences', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="settings/security"
              options={{ title: 'Security', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="saved/index"
              options={{ title: 'Shortlist', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="grievances/index"
              options={{ title: 'Grievances', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="manage/societies/index"
              options={{ title: 'Manage Societies', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="manage/societies/new"
              options={{ title: 'New Society', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="manage/societies/[id]"
              options={{ title: 'Society Details', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="manage/properties/index"
              options={{ title: 'Manage Properties', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="manage/dealers/index"
              options={{ title: 'Manage Dealers', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="manage/dealers/[id]"
              options={{ title: 'Dealer Details', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="manage/verification-queue/index"
              options={{ title: 'Verification Queue', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="manage/users/index"
              options={{ title: 'Manage Users', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="manage/users/[id]"
              options={{ title: 'User Details', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="grievances/new"
              options={{ title: 'Raise a grievance', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="grievances/[id]"
              options={{ title: 'Grievance Details', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="commissions/index"
              options={{ title: 'Commissions', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="commissions/[id]"
              options={{ title: 'Commission Details', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="transactions/index"
              options={{ title: 'Transactions', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="transactions/[id]"
              options={{ title: 'Transaction Details', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="reports/index"
              options={{ title: 'Reports & Analytics', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="legal/[doc]"
              options={{ title: 'Legal', headerBackTitle: 'Back' }}
            />
          </Stack>
        </SocketProvider>
      </AuthGate>
    </SafeAreaProvider>
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
