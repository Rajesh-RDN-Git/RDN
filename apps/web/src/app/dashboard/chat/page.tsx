'use client';

import { useState, useEffect, useRef } from 'react';
import { communicationApi } from '@/lib/api/communication.api';
import { useAuthStore } from '@/stores/auth-store';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { ChatIcon } from '@/components/ui/icons';

interface Conversation {
  id: string;
  leadId: string;
  participants: string[];
  lastMessageAt: string;
  unreadCount?: number;
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

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function groupMessagesByDate(messages: Message[]) {
  const groups: Array<{ date: string; messages: Message[] }> = [];
  let currentDate = '';

  for (const msg of messages) {
    const date = formatDateLabel(msg.createdAt);
    if (date !== currentDate) {
      groups.push({ date, messages: [] });
      currentDate = date;
    }
    groups[groups.length - 1].messages.push(msg);
  }

  return groups;
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
  const [error, setError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await communicationApi.conversations();
      setConversations(data.data || []);
    } catch (err: any) {
      setError(
        err?.code === 'ERR_NETWORK'
          ? 'Network error. Please check your connection.'
          : 'Failed to load conversations.',
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const fetchMessages = async () => {
      setLoadingMessages(true);
      setMessagesError(null);
      try {
        const { data } = await communicationApi.getConversation(selectedId, { limit: 50 });
        setMessages(data.messages || []);
      } catch (err: any) {
        setMessagesError(
          err?.code === 'ERR_NETWORK' ? 'Network error.' : 'Failed to load messages.',
        );
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
    setSendError(null);
    try {
      await communicationApi.sendMessage(selectedId, { content: newMessage.trim() });
      setNewMessage('');
      const { data } = await communicationApi.getConversation(selectedId, { limit: 50 });
      setMessages(data.messages || []);
    } catch (err: any) {
      setSendError(
        err?.code === 'ERR_NETWORK'
          ? 'Network error. Message not sent.'
          : 'Failed to send message.',
      );
    }
    setSending(false);
  };

  const selectedConvo = conversations.find((c) => c.id === selectedId);
  const messageGroups = groupMessagesByDate(messages);

  return (
    <div>
      <h1 className="mb-6 text-heading-xl text-gray-900">Chat</h1>
      <div className="flex h-[calc(100vh-200px)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Conversation List */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200">
          <div className="border-b border-gray-200 p-4">
            <h2 className="text-heading-sm text-gray-900">Conversations</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center p-6 text-center">
              <p className="text-body-sm text-red-600">{error}</p>
              <button
                onClick={fetchConversations}
                className="mt-2 text-label-sm text-primary-600 hover:text-primary-700"
              >
                Retry
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center p-6 text-center">
              <ChatIcon size={32} className="mb-2 text-gray-300" />
              <p className="text-body-sm text-gray-500">No conversations yet</p>
            </div>
          ) : (
            <div className="overflow-y-auto">
              {conversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => setSelectedId(convo.id)}
                  className={`flex w-full items-center gap-3 border-b border-gray-100 p-4 text-left transition-colors hover:bg-gray-50 ${
                    selectedId === convo.id ? 'bg-primary-50 border-l-2 border-l-primary-500' : ''
                  }`}
                >
                  <Avatar
                    name={convo.lead?.property ? `${convo.lead.property.flatNumber}` : 'C'}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-label-md text-gray-900">
                        {convo.lead?.property
                          ? `${convo.lead.property.flatNumber}, ${convo.lead.property.towerBlock}`
                          : 'Conversation'}
                      </p>
                      {(convo.unreadCount ?? 0) > 0 && (
                        <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1.5 text-[11px] font-semibold text-white">
                          {convo.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-caption-md text-gray-500">
                      {convo.lastMessageAt
                        ? new Date(convo.lastMessageAt).toLocaleDateString('en-IN')
                        : '-'}
                    </p>
                  </div>
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
              {/* Thread header */}
              <div className="flex items-center gap-3 border-b border-gray-200 p-4">
                <Avatar name={selectedConvo?.lead?.property?.flatNumber || 'C'} size="sm" />
                <div>
                  <p className="text-label-md text-gray-900">
                    {selectedConvo?.lead?.property
                      ? `${selectedConvo.lead.property.flatNumber}, ${selectedConvo.lead.property.towerBlock}`
                      : 'Chat'}
                  </p>
                  <p className="text-caption-md text-gray-500">
                    {selectedConvo?.lead?.buyer?.name && `Buyer: ${selectedConvo.lead.buyer.name}`}
                    {selectedConvo?.lead?.dealer?.user?.name &&
                      ` · Dealer: ${selectedConvo.lead.dealer.user.name}`}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : messagesError ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <p className="text-body-sm text-red-600">{messagesError}</p>
                    <button
                      onClick={() => setSelectedId(selectedId)}
                      className="mt-2 text-label-sm text-primary-600 hover:text-primary-700"
                    >
                      Retry
                    </button>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-body-sm text-gray-500">No messages yet</p>
                ) : (
                  messageGroups.map((group) => (
                    <div key={group.date}>
                      {/* Date separator */}
                      <div className="my-4 flex items-center gap-3">
                        <div className="flex-1 border-t border-gray-200" />
                        <span className="text-caption-md text-gray-400">{group.date}</span>
                        <div className="flex-1 border-t border-gray-200" />
                      </div>

                      <div className="space-y-3">
                        {group.messages.map((msg) => {
                          const isMe = msg.senderId === user?.id;
                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                                  isMe
                                    ? 'rounded-br-md bg-primary-600 text-white'
                                    : 'rounded-bl-md bg-white text-gray-900'
                                }`}
                              >
                                {!isMe && msg.sender && (
                                  <p className="mb-1 text-caption-md font-medium text-primary-600">
                                    {msg.sender.name}
                                  </p>
                                )}
                                <p className="text-body-md">{msg.content}</p>
                                <div
                                  className={`mt-1 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                  <p
                                    className={`text-[11px] ${isMe ? 'text-white/60' : 'text-gray-400'}`}
                                  >
                                    {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                  {isMe && msg.readAt && (
                                    <span className="text-[11px] text-white/60">✓✓</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Send form */}
              <div className="border-t border-gray-200 bg-white p-4">
                {sendError && (
                  <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-body-sm text-red-700">
                    {sendError}
                  </div>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-3"
                >
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-body-md outline-none transition-colors focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500"
                  />
                  <Button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    isLoading={sending}
                  >
                    Send
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
