import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    sender: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      email: String
    },
    receiver: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      email: String
    },
    message: { type: String, required: true },
    threadId: { type: String, required: true, index: true },
    isRead: { type: Boolean, default: false },
    orderRef: String // optional reference to an order ID (e.g. chat with delivery agent)
  },
  { timestamps: true }
);

export default mongoose.model('Chat', chatSchema);
