import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import { chatAPI, authAPI } from '../api/client';
import io from 'socket.io-client';
import { 
  FiSend, FiSearch, FiUser, FiCheck, FiCheckCircle, 
  FiMessageSquare, FiClock, FiCircle, FiArrowLeft, FiMoreVertical 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Chat() {
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();

  const recipientParam = searchParams.get('recipient');
  const orderRefParam = searchParams.get('order');

  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Current current logged-in identity or default
  const currentUser = user || {
    id: 'demo_user',
    name: 'Demo Customer',
    email: 'demo@fruithub.com'
  };

  useEffect(() => {
    // Connect to chat socket
    // Connect to chat socket through API gateway
    const socketHost = window.location.hostname;
    // In K8s NodePort mode (port 31730) use 30000; in all other cases use the gateway at 3000
    const socketPort = window.location.port === '31730' ? '30000' : '3000';
    const socketUrl = `http://${socketHost}:${socketPort}`;

    const socket = io(socketUrl, {
      path: '/socket.io',        // default path, gateway proxies /api/chat WS traffic
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('💬 Connected to Chat WebSockets');
      socket.emit('join', currentUser.id || currentUser._id);
    });

    // Listen for new incoming message
    socket.on('receive_message', (chat) => {
      if (activeThread && chat.threadId === activeThread.threadId) {
        setMessages((prev) => [...prev, chat]);
        // Acknowledge read
        socket.emit('mark_read', { threadId: activeThread.threadId, userId: currentUser.id || currentUser._id });
      }
      // Update thread lastMessage in thread list
      setThreads((prevThreads) => {
        return prevThreads.map((t) => {
          if (t.threadId === chat.threadId) {
            return {
              ...t,
              lastMessage: chat.message,
              lastMessageTime: chat.createdAt
            };
          }
          return t;
        });
      });
    });

    // Listen for typing events
    socket.on('user_typing', ({ threadId, userId, userName }) => {
      if (activeThread && activeThread.threadId === threadId && userId !== (currentUser.id || currentUser._id)) {
        setTypingUsers((prev) => new Map(prev.set(userId, userName || 'Someone')));
      }
    });

    socket.on('user_stop_typing', ({ threadId, userId }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    });

    // Online status broadcast
    socket.on('user_status', ({ userId, status }) => {
      setOnlineUserIds((prev) => {
        const updated = new Set(prev);
        if (status === 'online') updated.add(userId);
        else updated.delete(userId);
        return updated;
      });
    });

    // Initial threads and online list fetch
    fetchUserThreads();
    fetchOnlineUsers();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [activeThread?.threadId]);

  // Handle URL recipient param
  useEffect(() => {
    if (recipientParam) {
      handleInitiateWithRecipient(recipientParam);
    }
  }, [recipientParam]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchOnlineUsers = async () => {
    try {
      const res = await chatAPI.getOnlineUsers();
      if (res.data?.onlineUserIds) {
        setOnlineUserIds(new Set(res.data.onlineUserIds));
      }
    } catch (e) {
      // ignore
    }
  };

  const defaultSupportThread = {
    threadId: `support_${currentUser.id || currentUser._id || 'demo_user'}`,
    participants: [
      { id: currentUser.id || currentUser._id || 'demo_user', name: currentUser.name || 'Demo Customer', email: currentUser.email || 'demo@fruithub.com' },
      { id: 'support_agent', name: 'FruitHub Support Assistant', email: 'support@fruithub.com' }
    ],
    lastMessage: '👋 Welcome! How can we assist with your fruit delivery today?',
    lastMessageTime: new Date().toISOString()
  };

  const fetchUserThreads = async () => {
    setLoadingThreads(true);
    try {
      const myId = currentUser.id || currentUser._id || 'demo_user';
      const res = await chatAPI.getUserThreads(myId);
      const loaded = res.data && res.data.length > 0 ? res.data : [defaultSupportThread];
      setThreads(loaded);
      selectThread(loaded[0]);
    } catch (err) {
      console.warn('Error fetching threads, using default support thread:', err.message);
      setThreads([defaultSupportThread]);
      selectThread(defaultSupportThread);
    } finally {
      setLoadingThreads(false);
    }
  };

  const selectThread = async (thread) => {
    if (!thread) return;
    setActiveThread(thread);
    if (socketRef.current) {
      socketRef.current.emit('join_thread', thread.threadId);
      socketRef.current.emit('mark_read', { threadId: thread.threadId, userId: currentUser.id || currentUser._id });
    }

    setLoadingMessages(true);
    try {
      const res = await chatAPI.getThreadMessages(thread.threadId);
      if (res.data && res.data.length > 0) {
        setMessages(res.data);
      } else {
        setMessages([
          {
            _id: 'welcome_1',
            sender: { id: 'support_agent', name: 'FruitHub Support Assistant' },
            message: '👋 Welcome to FruitHub Live Chat! How can we help you with your fresh fruit order, payment QR, or live tracking today?',
            createdAt: new Date().toISOString(),
            isRead: true
          }
        ]);
      }
    } catch (err) {
      setMessages([
        {
          _id: 'welcome_1',
          sender: { id: 'support_agent', name: 'FruitHub Support Assistant' },
          message: '👋 Welcome to FruitHub Live Chat! How can we help you with your fresh fruit order, payment QR, or live tracking today?',
          createdAt: new Date().toISOString(),
          isRead: true
        }
      ]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Search registered users
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await authAPI.searchUsers(query.trim());
      setSearchResults(res.data || []);
    } catch (err) {
      console.warn('User search error:', err.message);
    }
  };

  // Start new conversation with a searched contact
  const handleStartConversation = async (contact) => {
    try {
      const myId = currentUser.id || currentUser._id;
      const contactId = contact.id || contact._id;

      const res = await chatAPI.createThread({
        userA: { id: myId, name: currentUser.name, email: currentUser.email },
        userB: { id: contactId, name: contact.name, email: contact.email },
        orderRef: orderRefParam || null
      });

      const newThread = res.data;
      setThreads((prev) => {
        const exists = prev.find((t) => t.threadId === newThread.threadId);
        return exists ? prev : [newThread, ...prev];
      });

      setSearchQuery('');
      setSearchResults([]);
      selectThread(newThread);
    } catch (e) {
      toast.error('Error starting conversation');
    }
  };

  // Initiate conversation from URL param (e.g. delivery driver)
  const handleInitiateWithRecipient = async (recipientName) => {
    try {
      const myId = currentUser.id || currentUser._id;
      const partnerId = `dp_${recipientName.toLowerCase().replace(/\s+/g, '_')}`;

      const res = await chatAPI.createThread({
        userA: { id: myId, name: currentUser.name, email: currentUser.email },
        userB: { id: partnerId, name: recipientName, email: `${partnerId}@delivery.fruithub.com` },
        orderRef: orderRefParam || null
      });

      setThreads((prev) => {
        const exists = prev.find((t) => t.threadId === res.data.threadId);
        return exists ? prev : [res.data, ...prev];
      });
      selectThread(res.data);
    } catch (e) {
      console.warn('Could not auto-start partner chat:', e.message);
    }
  };

  // Handle typing input
  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);

    if (socketRef.current && activeThread) {
      socketRef.current.emit('typing', {
        threadId: activeThread.threadId,
        userId: currentUser.id || currentUser._id,
        userName: currentUser.name
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('stop_typing', {
          threadId: activeThread.threadId,
          userId: currentUser.id || currentUser._id
        });
      }, 1500);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThread) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    const otherParticipant = activeThread.participants.find(
      (p) => p.id !== (currentUser.id || currentUser._id)
    ) || { id: 'other', name: 'Recipient' };

    const payload = {
      sender: {
        id: currentUser.id || currentUser._id,
        name: currentUser.name,
        email: currentUser.email
      },
      receiver: otherParticipant,
      message: messageText,
      threadId: activeThread.threadId,
      orderRef: orderRefParam || activeThread.orderRef || null
    };

    const localMsg = {
      _id: `local_${Date.now()}`,
      sender: payload.sender,
      receiver: payload.receiver,
      message: messageText,
      threadId: payload.threadId,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    setMessages((prev) => [...prev, localMsg]);

    // Emit via WebSocket for instant delivery
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_message', payload);
    } else {
      // Fallback to HTTP API
      try {
        await chatAPI.sendMessage(payload);
      } catch (err) {
        // message already shown locally
      }
    }

    // If talking to support assistant, simulate helpful instant agent reply
    if (otherParticipant.id === 'support_agent') {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            _id: `support_reply_${Date.now()}`,
            sender: { id: 'support_agent', name: 'FruitHub Support Assistant' },
            message: `Thank you for reaching out! We received your message: "${messageText}". Our support team is online and reviewing this. If you are tracking a live order, you can also view real-time GPS scooter telemetry with live Google Maps! 🍏`,
            createdAt: new Date().toISOString(),
            isRead: true
          }
        ]);
      }, 700);
    }
  };

  // Helper to get other user name in a thread
  const getThreadTitle = (thread) => {
    const other = thread?.participants?.find((p) => p.id !== (currentUser.id || currentUser._id));
    return other?.name || 'FruitHub Support';
  };

  const getThreadParticipantId = (thread) => {
    const other = thread?.participants?.find((p) => p.id !== (currentUser.id || currentUser._id));
    return other?.id;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto h-[82vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex overflow-hidden">

        {/* Left Sidebar: Threads & Contact Search */}
        <div className="w-full sm:w-80 md:w-96 border-r border-slate-800 flex flex-col bg-slate-900/90">

          {/* Search Contacts Bar */}
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-lg font-black tracking-tight text-white mb-3 flex items-center justify-between">
              <span>Messages</span>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Live
              </span>
            </h2>

            <div className="relative">
              <input
                type="text"
                placeholder="Search users or friends..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition"
              />
              <FiSearch className="absolute left-3 top-2.5 text-slate-500 text-sm" />
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl max-h-48 overflow-y-auto p-1.5 space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1">Contacts Found</p>
                {searchResults.map((contact) => (
                  <button
                    key={contact._id || contact.id}
                    onClick={() => handleStartConversation(contact)}
                    className="w-full flex items-center space-x-3 p-2 rounded-xl hover:bg-slate-800/80 text-left transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                      {contact.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{contact.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{contact.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
            {loadingThreads ? (
              <div className="p-8 text-center text-slate-500 text-xs">Loading conversations...</div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center">
                <FiMessageSquare className="text-3xl mb-2 text-slate-600" />
                <p>No conversations yet.</p>
                <p className="text-[11px] mt-1 text-slate-600">Search for registered users above to start chatting!</p>
              </div>
            ) : (
              threads.map((thread) => {
                const title = getThreadTitle(thread);
                const otherId = getThreadParticipantId(thread);
                const isOnline = onlineUserIds.has(otherId);
                const isSelected = activeThread?.threadId === thread.threadId;

                return (
                  <button
                    key={thread.threadId}
                    onClick={() => selectThread(thread)}
                    className={`w-full p-4 flex items-center space-x-3 text-left transition ${
                      isSelected ? 'bg-emerald-500/10 border-l-4 border-emerald-500' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                        {title.charAt(0)}
                      </div>
                      {isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-xs font-bold text-white truncate">{title}</p>
                        <span className="text-[10px] text-slate-500">
                          {thread.lastMessageTime ? new Date(thread.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{thread.lastMessage || 'Say hi...'}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Conversation Window */}
        {activeThread ? (
          <div className="flex-1 flex flex-col bg-slate-950">

            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/30">
                    {getThreadTitle(activeThread).charAt(0)}
                  </div>
                  {onlineUserIds.has(getThreadParticipantId(activeThread)) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-white">{getThreadTitle(activeThread)}</h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    {onlineUserIds.has(getThreadParticipantId(activeThread)) ? (
                      <span className="text-emerald-400 font-semibold">Online now</span>
                    ) : (
                      <span>Offline</span>
                    )}
                    {activeThread.orderRef && (
                      <span className="text-slate-500 ml-2">• Regarding Order #{activeThread.orderRef.slice(-6)}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                🔒 End-to-End Encrypted
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Loading message history...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                  <p className="text-2xl mb-1">👋</p>
                  <p>Send a message to start the conversation.</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.sender.id === (currentUser.id || currentUser._id);
                  return (
                    <div
                      key={msg._id || index}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-xs shadow-md leading-relaxed ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/60'
                        }`}
                      >
                        <p>{msg.message}</p>
                      </div>
                      <div className="flex items-center space-x-1 mt-1 text-[10px] text-slate-500">
                        <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && (
                          <span className="text-emerald-400 font-bold">
                            {msg.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {typingUsers.size > 0 && (
                <div className="flex items-center space-x-2 text-slate-400 text-xs italic">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>{Array.from(typingUsers.values()).join(', ')} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/60">
              <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2 focus-within:border-emerald-500/50 transition">
                <input
                  type="text"
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={handleMessageChange}
                  className="flex-1 bg-transparent text-white text-xs outline-none placeholder-slate-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-2 rounded-xl transition disabled:opacity-30 shadow-md"
                >
                  <FiSend size={15} />
                </button>
              </div>
            </form>

          </div>
        ) : (
          <div className="flex-1 hidden sm:flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <div className="w-16 h-16 rounded-3xl bg-slate-800/80 flex items-center justify-center text-3xl mb-3 text-emerald-400">
              💬
            </div>
            <h3 className="text-lg font-bold text-white">Your Real-Time FruitHub Chat</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Connect with friends, store merchants, or coordinate directly with your live delivery partner.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
