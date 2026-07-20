import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';

interface ScreenStateProps {
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  emptyText?: string;
  errorText?: string;
}

/**
 * Standard loading / error+retry / empty placeholder for list screens. Use as a
 * FlatList `ListEmptyComponent` so a network failure shows a real error + Retry
 * instead of looking identical to a genuine empty result.
 */
export function ScreenState({
  loading,
  error,
  onRetry,
  emptyText = 'Nothing here yet.',
  errorText = "Couldn't load. Please try again.",
}: ScreenStateProps) {
  if (loading) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.text}>{errorText}</Text>
        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            style={styles.retry}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{emptyText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  text: { fontSize: 15, color: '#9ca3af', textAlign: 'center' },
  retry: {
    marginTop: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  retryText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
});
