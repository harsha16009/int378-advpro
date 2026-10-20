const { Server } = require("socket.io");

let io;
const onlineUsers = new Map();

function initSocket(server) {
  io = new Server(server, { 
    cors: { origin: "*" },
    transports: ['websocket', 'polling']
  });

  io.on("connection", (socket) => {
    console.log(`💬 Socket Connected: ${socket.id}`);

    // Join with user ID
    socket.on("join", (userId) => {
      if (userId) {
        onlineUsers.set(userId.toString(), socket.id);
        io.emit("user_status", { userId, status: "online" });
      }
    });

    // Join specific chat thread room
    socket.on("join_thread", (threadId) => {
      if (threadId) {
        socket.join(`thread_${threadId}`);
        socket.join(threadId);
        console.log(`Socket ${socket.id} joined room thread_${threadId}`);
      }
    });

    // Send and broadcast chat messages
    socket.on("send_message", (data) => {
      const messagePayload = {
        ...data,
        _id: data._id || `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        createdAt: data.createdAt || new Date().toISOString()
      };

      // Broadcast to room
      if (data.threadId) {
        io.to(`thread_${data.threadId}`).emit("receive_message", messagePayload);
        io.to(data.threadId).emit("receive_message", messagePayload);
      }

      // Direct notification if receiver socket is online
      const receiverId = data.receiver?.id || data.receiver?._id || data.receiver;
      if (receiverId) {
        const receiverSocketId = onlineUsers.get(receiverId.toString());
        if (receiverSocketId && receiverSocketId !== socket.id) {
          io.to(receiverSocketId).emit("new_message", messagePayload);
          io.to(receiverSocketId).emit("new_message_notification", {
            chat: messagePayload,
            threadId: data.threadId
          });
        }
      }

      // Automated Support Assistant auto-reply simulation
      if (receiverId === 'support_agent' || data.receiver?.name?.includes('Support')) {
        setTimeout(() => {
          const autoReply = {
            _id: `reply_${Date.now()}`,
            sender: { id: 'support_agent', name: 'FruitHub Support Assistant' },
            receiver: data.sender,
            message: `Hello ${data.sender?.name || 'Customer'}! We received your message: "${data.message}". Our fruit delivery and support team is on it! 🍏`,
            threadId: data.threadId,
            createdAt: new Date().toISOString(),
            isRead: true
          };

          if (data.threadId) {
            io.to(`thread_${data.threadId}`).emit("receive_message", autoReply);
            io.to(data.threadId).emit("receive_message", autoReply);
          }
          socket.emit("receive_message", autoReply);
        }, 1000);
      }
    });

    // Typing indicators
    socket.on("typing", ({ threadId, userId, userName }) => {
      socket.to(`thread_${threadId}`).emit("user_typing", { threadId, userId, userName });
    });

    socket.on("stop_typing", ({ threadId, userId }) => {
      socket.to(`thread_${threadId}`).emit("user_stop_typing", { threadId, userId });
    });

    // Disconnect handler
    socket.on("disconnect", () => {
      for (const [key, value] of onlineUsers.entries()) {
        if (value === socket.id) {
          onlineUsers.delete(key);
          io.emit("user_status", { userId: key, status: "offline" });
        }
      }
      console.log(`Socket Disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = initSocket;
module.exports.initSocket = initSocket;
module.exports.getIO = getIO;
module.exports.onlineUsers = onlineUsers;
