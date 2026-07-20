import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { notificationsApi } from '@/lib/api/notifications';
import { ScreenState } from '@/components/ui/ScreenState';

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
};

const PAGE_SIZE = 20;

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (targetPage: number, append: boolean) => {
    if (!append) setError(false);
    try {
      const { data } = await notificationsApi.list({
        page: String(targetPage),
        limit: String(PAGE_SIZE),
      });
      const result = data.data || data;
      const rows: Notif[] = result.data || [];
      setUnreadCount(result.unreadCount || 0);
      setHasMore(rows.length >= PAGE_SIZE);
      setNotifications((prev) => (append ? [...prev, ...rows] : rows));
    } catch {
      if (!append) setError(true);
    }
    if (!append) setLoading(false);
  }, []);

  useEffect(() => {
    load(1, false);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await load(1, false);
    setRefreshing(false);
  };

  const onEndReached = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    await load(next, true);
    setPage(next);
    setLoadingMore(false);
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || now })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  const markRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* ignore */
    }
  };

  const onPress = (item: Notif) => {
    if (!item.readAt) markRead(item.id);
    const route =
      item.data && typeof item.data.route === 'string' ? (item.data.route as string) : null;
    if (route) {
      try {
        router.push(route as never);
      } catch {
        /* invalid route */
      }
    }
  };

  const renderNotification = ({ item }: { item: Notif }) => {
    const isUnread = !item.readAt;
    return (
      <TouchableOpacity onPress={() => onPress(item)}>
        <Card style={[styles.notifCard, isUnread && styles.unreadCard]}>
          <View style={styles.notifHeader}>
            <Text style={styles.notifType}>{item.type}</Text>
            <Text style={styles.notifDate}>
              {new Date(item.createdAt).toLocaleDateString('en-IN')}
            </Text>
          </View>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.notifBody}>{item.body}</Text>
          {isUnread && <View style={styles.unreadDot} />}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <View style={styles.markAllRow}>
          <Text style={styles.unreadLabel}>{unreadCount} unread</Text>
          <Button title="Mark All Read" onPress={markAllRead} variant="outline" />
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color="#2563eb" style={{ marginVertical: 16 }} /> : null
        }
        ListEmptyComponent={
          <ScreenState
            loading={loading}
            error={error}
            onRetry={() => load(1, false)}
            emptyText="No notifications"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  markAllRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  unreadLabel: { fontSize: 14, fontWeight: '600', color: '#2563eb' },
  list: { padding: 16 },
  notifCard: { marginBottom: 8, position: 'relative' },
  unreadCard: { backgroundColor: '#eff6ff' },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  notifType: { fontSize: 11, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
  notifDate: { fontSize: 11, color: '#9ca3af' },
  notifTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  notifBody: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  emptyText: { fontSize: 16, color: '#9ca3af' },
});
