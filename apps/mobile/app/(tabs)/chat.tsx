import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth-store';
import { communicationApi } from '@/lib/api/communication';
import { ScreenState } from '@/components/ui/ScreenState';

export default function ChatScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    setError(false);
    try {
      const { data } = await communicationApi.getConversations();
      const result = data.data || data;
      setConversations(result.data || []);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Sign in to view messages</Text>
        <Button title="Login" onPress={() => router.push('/(auth)/login')} />
      </View>
    );
  }

  const renderConversation = ({ item }: { item: any }) => {
    const lastMessage = item.messages?.[0];
    const property = item.lead?.property;

    return (
      <TouchableOpacity onPress={() => router.push(`/conversation/${item.id}`)}>
        <Card style={styles.convCard}>
          <View style={styles.convRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{property?.flatNumber?.[0] || '?'}</Text>
            </View>
            <View style={styles.convInfo}>
              <Text style={styles.convTitle} numberOfLines={1}>
                {property ? `${property.flatNumber}, ${property.towerBlock}` : 'Conversation'}
              </Text>
              {lastMessage && (
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {lastMessage.content}
                </Text>
              )}
            </View>
            {lastMessage && (
              <Text style={styles.timestamp}>
                {new Date(lastMessage.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={conversations}
      renderItem={renderConversation}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <ScreenState
          loading={loading}
          error={error}
          onRetry={loadConversations}
          emptyText="No conversations yet. Enquire about a property to start chatting."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 16 },
  list: { padding: 16, flexGrow: 1 },
  convCard: { marginBottom: 8 },
  convRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#2563eb' },
  convInfo: { flex: 1, marginRight: 8 },
  convTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  lastMessage: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  timestamp: { fontSize: 11, color: '#9ca3af' },
  emptyText: { fontSize: 16, color: '#6b7280', marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
});
