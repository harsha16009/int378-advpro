import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { initSocket, getIO, onlineUsers } from './socket/socket.js';
import Chat from './models/chat.model.js';
import Thread from './models/thread.model.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.CHAT_PORT || 3007;

initSocket(server);

app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoUri = process.env.MONGO_CHAT_URI || 'mongodb://mongo:27017/chat-db';
mongoose.connect(mongoUri)
  .then(() => console.log('✅ Chat Service DB connected'))
  .catch(err => console.log('❌ Chat DB Connection Error:', err.message));

// REST Endpoints

// Send message via HTTP API
app.post('/send', async (req, res) => {
  try {
    const { sender, receiver, message, threadId, orderRef } = req.body;
    if (!sender || !receiver || !message) {
      return res.status(400).json({ message: 'Sender, receiver, and message are required' });
    }

    const finalThreadId = threadId || [sender.id, receiver.id].sort().join('_');

    const chat = await Chat.create({
      sender,
      receiver,
      message,
      threadId: finalThreadId,
      orderRef: orderRef || null,
      isRead: false
    });

    let thread = await Thread.findOne({ threadId: finalThreadId });
    if (!thread) {
      thread = await Thread.create({
        threadId: finalThreadId,
        participants: [sender, receiver],
        lastMessage: message,
        lastMessageTime: new Date(),
        orderRef: orderRef || null
      });
    } else {
      thread.lastMessage = message;
      thread.lastMessageTime = new Date();
      await thread.save();
    }

    // Emit via WebSocket
    try {
      const io = getIO();
      if (io) {
        io.to(`thread_${finalThreadId}`).emit('receive_message', chat);
        const receiverSocketId = onlineUsers.get(receiver.id.toString());
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('new_message_notification', {
            chat,
            threadId: finalThreadId
          });
        }
      }
    } catch (wsErr) {
      console.warn('WebSocket emit notice:', wsErr.message);
    }

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

// Get messages for a thread (paginated)
app.get('/thread/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Chat.find({ threadId })
      .sort({ createdAt: 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching thread messages', error: error.message });
  }
});

// Get all threads for a user
app.get('/user-threads/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const threads = await Thread.find({
      'participants.id': userId.toString()
    }).sort({ lastMessageTime: -1 });

    res.json(threads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user threads', error: error.message });
  }
});

// Find or create thread between two participants
app.post('/thread/create', async (req, res) => {
  try {
    const { userA, userB, orderRef } = req.body;
    if (!userA || !userB) {
      return res.status(400).json({ message: 'Both participants are required' });
    }

    const threadId = [userA.id, userB.id].sort().join('_');
    let thread = await Thread.findOne({ threadId });

    if (!thread) {
      thread = await Thread.create({
        threadId,
        participants: [userA, userB],
        lastMessage: 'Conversation started',
        lastMessageTime: new Date(),
        orderRef: orderRef || null
      });
    }

    res.json(thread);
  } catch (error) {
    res.status(500).json({ message: 'Error creating thread', error: error.message });
  }
});

// Get online users
app.get('/online-users', (req, res) => {
  res.json({
    onlineUserIds: Array.from(onlineUsers.keys())
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Chat Service is running', onlineUsersCount: onlineUsers.size });
});

server.listen(PORT, () => {
  console.log(`💬 Real-Time Chat Service running on port ${PORT}`);
});
