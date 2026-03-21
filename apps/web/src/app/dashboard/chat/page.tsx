'use client';

import { useState, useEffect, useRef } from 'react';
import { communicationApi } from '@/lib/api/communication.api';
import { useAuthStore } from '@/stores/auth-store';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Conversation {
  id: string;
  leadId: string;
  participants: string[];
  lastMessageAt: string;
  lead?: {
    property?: { flatNumber: string; towerBlock: string };
    buyer?: { name: string };
    dealer?: { user: { name: string } };
  };
  messages?: Message[];
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  type: string;
  readAt: string | null;
  createdAt: string;
  sender?: { name: string };
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await communicationApi.conversations();
        setConversations(data.data || []);
      } catch {
        /\* ignore \*/;
      }
      setLoading(false);
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const { data } = await communicationApi.messages(selectedId, { limit: 50 });
        setMessages(data.data || []);
      } catch {
        /\* ignore \*/;
      }
      setLoadingMessages(false);
    };
    fetchMessages();
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!selectedId || !newMessage.trim()) return;
    setSending(true);
    try {
      await communicationApi.sendMessage(selectedId, { content: newMessage.trim() });
      setNewMessage('');
      const { data } = await communicationApi.messages(selectedId, { limit: 50 });
      setMessages(data.data || []);
    } catch {
      /\* ignore \*/;
    }
    setSending(false);
  };

  const selectedConvo = conversations.find((c) => c.id === selectedId);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Chat</h1>
      <div className="flex h-[calc(100vh-200px)] overflow-hidden rounded-lg border bg-white">
        {/* Conversation List */}
        <div className="w-80 flex-shrink-0 border-r">
          <div className="border-b p-4">
            <h2 className="font-semibold text-gray-900">Conversations</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No conversations yet</div>
          ) : (
            <div className="overflow-y-auto">
              {conversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => setSelectedId(convo.id)}
                  className={`w-full border-b p-4 text-left transition-colors hover:bg-gray-50 ${selectedId === convo.id ? 'bg-primary-50' : ''}`}
                >
                  <p className="font-medium text-gray-900">
                    {convo.lead?.property
                      ? `${convo.lead.property.flatNumber}, ${convo.lead.property.towerBlock}`
                      : 'Conversation'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {convo.lastMessageAt
                      ? new Date(convo.lastMessageAt).toLocaleDateString('en-IN')
                      : '-'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Thread */}
        <div className="flex flex-1 flex-col">
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState
                title="Select a conversation"
                description="Choose a conversation from the left to start chatting"
              />
            </div>
          ) : (
            <>
              <div className="border-b p-4">
                <p className="font-semibold">
                  {selectedConvo?.lead?.property
                    ? `${selectedConvo.lead.property.flatNumber}, ${selectedConvo.lead.property.towerBlock}`
                    : 'Chat'}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-gray-500">No messages yet</p>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${isMe ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'}`}
                        >
                          {!isMe && msg.sender && (
                            <p className="mb-1 text-xs font-medium opacity-70">{msg.sender.name}</p>
                          )}
                          <p className="text-sm">{msg.content}</p>
                          <p className={`mt-1 text-xs ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-3"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={sending || !newMessage.trim()}>
                    {sending ? 'Sending...' : 'Send'}
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
