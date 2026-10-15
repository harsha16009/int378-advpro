import { Server } from 'socket.io';
import Chat from '../models/chat.model.js';
import Thread from '../models/thread.model.js';

let io;
const onlineUsers = new Map(); // userId -> socketId

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`💬 Chat client connected: ${socket.id}`);

    // User joins chat system
    socket.on('join', (userId) => {
      if (userId) {
        onlineUsers.set(userId.toString(), socket.id);
        socket.userId = userId.toString();
        // Broadcast online status to all
        io.emit('user_status', { userId: userId.toString(), status: 'online' });
        console.log(`👤 User joined chat: ${userId}`);
      }
    });

    // Join specific thread room
    socket.on('join_thread', (threadId) => {
      socket.join(`thread_${threadId}`);
      console.log(`💬 Socket ${socket.id} joined room: thread_${threadId}`);
    });

    // Real-time typing indicators
    socket.on('typing', ({ threadId, userId, userName }) => {
      socket.to(`thread_${threadId}`).emit('user_typing', { threadId, userId, userName });
    });

    socket.on('stop_typing', ({ threadId, userId }) => {
      socket.to(`thread_${threadId}`).emit('user_stop_typing', { threadId, userId });
    });

    // Real-time message event via WebSocket
    socket.on('send_message', async (data) => {
      try {
        const { sender, receiver, message, threadId, orderRef } = data;
        if (!sender || !receiver || !message) return;

        // Generate consistent threadId if not provided
        const finalThreadId = threadId || [sender.id, receiver.id].sort().join('_');

        // Persist Chat message
        const chat = await Chat.create({
          sender,
          receiver,
          message,
          threadId: finalThreadId,
          orderRef: orderRef || null,
          isRead: false
        });

        // Update or create Thread
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

        // Emit to the thread room
        io.to(`thread_${finalThreadId}`).emit('receive_message', chat);

        // Also emit directly to receiver socket if online and not in thread room
        const receiverSocketId = onlineUsers.get(receiver.id.toString());
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('new_message_notification', {
            chat,
            threadId: finalThreadId
          });
        }
      } catch (err) {
        console.error('Error handling socket send_message:', err.message);
      }
    });

    // Mark messages as read
    socket.on('mark_read', async ({ threadId, userId }) => {
      try {
        await Chat.updateMany(
          { threadId, 'receiver.id': userId.toString(), isRead: false },
          { isRead: true }
        );
        socket.to(`thread_${threadId}`).emit('messages_read', { threadId, readerId: userId });
      } catch (err) {
        console.error('Error marking messages read:', err.message);
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('user_status', { userId: socket.userId, status: 'offline', lastSeen: new Date() });
        console.log(`👤 User left chat: ${socket.userId}`);
      }
    });
  });

  return io;
}

export function getIO() {
  return io;
}

export { onlineUsers };
