const mongoose = require("mongoose");

const threadSchema = new mongoose.Schema(
  {
    threadId: { type: String },
    participants: [{ type: mongoose.Schema.Types.Mixed }],
    lastMessage: { type: String, default: "" },
    lastMessageTime: { type: Date, default: Date.now },
    unreadCount: { type: Number, default: 0 },
    orderRef: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Thread || mongoose.model("Thread", threadSchema);
