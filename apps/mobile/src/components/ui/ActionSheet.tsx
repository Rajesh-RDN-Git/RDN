import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheet } from './BottomSheet';

export type SheetAction = { label: string; onPress: () => void; destructive?: boolean };

export function ActionSheet({
  visible,
  onClose,
  title,
  actions,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions: SheetAction[];
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      {actions.map((a) => (
        <TouchableOpacity
          key={a.label}
          style={styles.row}
          onPress={() => {
            onClose();
            a.onPress();
          }}
        >
          <Text style={[styles.label, a.destructive && styles.destructive]}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  label: { fontSize: 16, color: '#111827' },
  destructive: { color: '#ef4444' },
});
