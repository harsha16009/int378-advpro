const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    message: { type: String, required: true },
    thread: { type: mongoose.Schema.Types.Mixed },
    threadId: { type: String },
    orderRef: { type: String, default: null },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Chat || mongoose.model("Chat", chatSchema);
