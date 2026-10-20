const Chat = require("../models/chat.model");
const Thread = require("../models/thread.model");
const asyncHandler = require("../utils/asyncHandler");
const { getIO, onlineUsers } = require("../socket/socket");

// SEND MESSAGE
exports.sendMessage = asyncHandler(async (req, res) => {
  const { sender, receiver, message, threadId, orderRef } = req.body;

  if (!sender || !receiver || !message) {
    return res.status(400).json({ message: "Missing Fields (sender, receiver, and message required)" });
  }

  const senderId = sender.id || sender._id || sender;
  const receiverId = receiver.id || receiver._id || receiver;
  const finalThreadId = threadId || [senderId, receiverId].sort().join('_');

  // Find or create thread
  let thread = await Thread.findOne({
    $or: [
      { threadId: finalThreadId },
      { participants: { $all: [sender, receiver] } }
    ]
  });

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

  // Create chat in MongoDB
  const chat = await Chat.create({
    sender,
    receiver,
    message,
    thread: thread._id,
    threadId: finalThreadId,
    orderRef: orderRef || null,
    isRead: false
  });

  // Real-time emit
  try {
    const io = getIO();
    if (io) {
      io.to(`thread_${finalThreadId}`).emit("receive_message", chat);
      io.to(finalThreadId).emit("receive_message", chat);

      const receiverSocket = onlineUsers.get(receiverId.toString());
      if (receiverSocket) {
        io.to(receiverSocket).emit("new_message", chat);
      }
    }
  } catch (emitErr) {
    console.warn("Socket emit notice:", emitErr.message);
  }

  res.status(201).json(chat);
});

// GET MESSAGES BY THREAD
exports.getMessages = asyncHandler(async (req, res) => {
  const { threadId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const messages = await Chat.find({
    $or: [{ threadId }, { thread: threadId }]
  })
    .sort({ createdAt: 1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json(messages);
});

// GET USER THREADS
exports.getUserThreads = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const threads = await Thread.find({
    $or: [
      { "participants.id": userId.toString() },
      { "participants._id": userId.toString() },
      { participants: userId.toString() },
      { threadId: { $regex: userId.toString() } }
    ]
  }).sort({ lastMessageTime: -1 });

  res.json(threads);
});

// FIND OR CREATE THREAD
exports.createThread = asyncHandler(async (req, res) => {
  const { userA, userB, orderRef } = req.body;
  if (!userA || !userB) {
    return res.status(400).json({ message: "Both participants are required" });
  }

  const idA = userA.id || userA._id || 'userA';
  const idB = userB.id || userB._id || 'userB';
  const threadId = [idA, idB].sort().join('_');

  let thread = await Thread.findOne({ threadId });
  if (!thread) {
    thread = await Thread.create({
      threadId,
      participants: [userA, userB],
      lastMessage: "Conversation started",
      lastMessageTime: new Date(),
      orderRef: orderRef || null
    });
  }

  res.json(thread);
});

// GET ONLINE USERS
exports.getOnlineUsers = asyncHandler(async (req, res) => {
  res.json({
    onlineUserIds: Array.from(onlineUsers.keys())
  });
});
