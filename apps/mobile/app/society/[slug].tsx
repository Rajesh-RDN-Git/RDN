import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function SocietyScreen() {
  const { slug } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Society</Text>
      <Text style={styles.placeholder}>Society {slug} details coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  placeholder: { color: '#666' },
});
