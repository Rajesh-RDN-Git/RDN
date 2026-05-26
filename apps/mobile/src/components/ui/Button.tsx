import type { ViewStyle, TextStyle } from 'react-native';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  disabled?: boolean;
  isLoading?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  style,
  disabled,
  isLoading,
}: ButtonProps) {
  const inactive = disabled || isLoading;
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], inactive && styles.disabled, style]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={inactive}
    >
      <Text style={[styles.text, variant === 'outline' && styles.outlineText]}>
        {isLoading ? 'Loading…' : title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  primary: { backgroundColor: '#2563eb' },
  secondary: { backgroundColor: '#f3f4f6' },
  outline: { borderWidth: 1, borderColor: '#d1d5db', backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  text: { color: '#fff', fontWeight: '600', fontSize: 16 } as TextStyle,
  outlineText: { color: '#374151' } as TextStyle,
});
