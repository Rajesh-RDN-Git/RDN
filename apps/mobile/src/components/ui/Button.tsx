import type { ViewStyle, TextStyle } from 'react-native';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', style }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, variant === 'outline' && styles.outlineText]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  primary: { backgroundColor: '#2563eb' },
  secondary: { backgroundColor: '#f3f4f6' },
  outline: { borderWidth: 1, borderColor: '#d1d5db', backgroundColor: 'transparent' },
  text: { color: '#fff', fontWeight: '600', fontSize: 16 } as TextStyle,
  outlineText: { color: '#374151' } as TextStyle,
});
