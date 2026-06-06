import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { communicationApi } from '@/lib/api/communication';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  type: string;
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id) return;
    communicationApi
      .getConversation(id)
      .then(({ data }) => {
        const result = data.data || data;
        setMessages((result.messages || []).reverse());
        // Derive the other participant's id from the participants array
        const participants: string[] = result.conversation?.participants ?? [];
        const otherId = participants.find((p) => p !== user?.id) ?? participants[0] ?? null;
        setReceiverId(otherId);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const sendMessage = async () => {
    if (!inputText.trim() || !id || !receiverId) return;
    setSending(true);
    try {
      const { data } = await communicationApi.sendMessage(id, {
        receiverId,
        content: inputText.trim(),
        type: 'TEXT',
      });
      const newMsg = data.data || data;
      setMessages((prev) => [...prev, newMsg]);
      setInputText('');
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    } catch {
      /\* ignore \*/;
    }
    setSending(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.id;
    return (
      <View style={[styles.messageBubble, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
          {item.content}
        </Text>
        <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
          {new Date(item.createdAt).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || !receiverId) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || !receiverId || sending}
        >
          <Text style={styles.sendButtonText}>{sending ? '...' : '>'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: '#9ca3af' },
  messagesList: { padding: 16, flexGrow: 1 },
  messageBubble: {
    maxWidth: '78%',
    padding: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  ownMessage: {
    backgroundColor: '#2563eb',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: { fontSize: 15, color: '#111827' },
  ownMessageText: { color: '#fff' },
  messageTime: { fontSize: 10, color: '#9ca3af', marginTop: 4, alignSelf: 'flex-end' },
  ownMessageTime: { color: '#bfdbfe' },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#93c5fd' },
  sendButtonText: { fontSize: 18, color: '#fff' },
});
