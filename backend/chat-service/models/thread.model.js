import mongoose from 'mongoose';

const threadSchema = new mongoose.Schema(
  {
    threadId: { type: String, required: true, unique: true, index: true },
    participants: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        email: String,
        role: { type: String, default: 'user' }
      }
    ],
    lastMessage: { type: String, default: '' },
    lastMessageTime: { type: Date, default: Date.now },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {}
    },
    orderRef: String
  },
  { timestamps: true }
);

export default mongoose.model('Thread', threadSchema);
