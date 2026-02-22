import { View, Text, StyleSheet } from 'react-native';

export default function LeadsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Leads</Text>
      <Text style={styles.placeholder}>Lead management coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  placeholder: { color: '#666' },
});
