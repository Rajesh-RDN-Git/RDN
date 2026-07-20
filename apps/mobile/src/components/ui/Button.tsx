import type { ViewStyle, TextStyle } from 'react-native';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  style?: ViewStyle;
  disabled?: boolean;
  isLoading?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  style,
  disabled,
  isLoading,
}: ButtonProps) {
  const inactive = disabled || isLoading;
  const solid = variant === 'primary' || variant === 'danger';
  return (
    <TouchableOpacity
      style={[styles.base, sizes[size], styles[variant], inactive && styles.disabled, style]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive }}
    >
      <View style={styles.row}>
        {isLoading && (
          <ActivityIndicator
            size="small"
            color={solid ? '#fff' : '#2563eb'}
            style={{ marginRight: 8 }}
          />
        )}
        <Text style={[styles.text, textSizes[size], textColors[variant]]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  primary: { backgroundColor: '#2563eb' },
  secondary: { backgroundColor: '#f3f4f6' },
  outline: { borderWidth: 1, borderColor: '#d1d5db', backgroundColor: 'transparent' },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: '#ef4444' },
  disabled: { opacity: 0.5 },
  text: { fontWeight: '600' } as TextStyle,
});

const sizes: Record<Size, ViewStyle> = {
  sm: { paddingHorizontal: 16, paddingVertical: 8, minHeight: 36 },
  md: { paddingHorizontal: 24, paddingVertical: 12, minHeight: 44 },
  lg: { paddingHorizontal: 28, paddingVertical: 14, minHeight: 48 },
};

const textSizes: Record<Size, TextStyle> = {
  sm: { fontSize: 14 },
  md: { fontSize: 16 },
  lg: { fontSize: 16 },
};

const textColors: Record<Variant, TextStyle> = {
  primary: { color: '#fff' },
  danger: { color: '#fff' },
  secondary: { color: '#374151' },
  outline: { color: '#374151' },
  ghost: { color: '#2563eb' },
};
