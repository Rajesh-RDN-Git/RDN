import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { notificationsApi } from '@/lib/api/notifications';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await notificationsApi.list();
      const result = data.data || data;
      setNotifications(result.data || []);
      setUnreadCount(result.unreadCount || 0);
    } catch {
      /\* ignore \*/;
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })),
      );
      setUnreadCount(0);
    } catch {
      /\* ignore \*/;
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
      /\* ignore \*/;
    }
  };

  const renderNotification = ({ item }: { item: any }) => {
    const isUnread = !item.readAt;
    return (
      <TouchableOpacity onPress={() => isUnread && markRead(item.id)}>
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
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
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
