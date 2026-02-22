import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="property/[id]" options={{ title: 'Property Details' }} />
        <Stack.Screen name="society/[slug]" options={{ title: 'Society' }} />
      </Stack>
    </>
  );
}
