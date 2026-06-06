import { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { isSaved, toggleSaved } from '@/lib/shortlist';

export function SaveButton({ propertyId }: { propertyId: string }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    isSaved(propertyId).then(setSaved);
  }, [propertyId]);
  return (
    <TouchableOpacity
      style={styles.btn}
      hitSlop={10}
      onPress={async () => setSaved(await toggleSaved(propertyId))}
    >
      <Text style={[styles.heart, saved && styles.heartOn]}>{saved ? '♥' : '♡'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 6 },
  heart: { fontSize: 22, color: '#9ca3af' },
  heartOn: { color: '#ef4444' },
});
