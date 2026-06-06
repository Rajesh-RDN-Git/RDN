import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Grievances index — placeholder that redirects to the profile tab.
 * A full grievance list screen will be built in a future iteration.
 */
export default function GrievancesIndexScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(tabs)/profile');
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
});
