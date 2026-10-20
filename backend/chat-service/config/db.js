const mongoose = require("mongoose");

module.exports = async () => {
  const mongoUrl = process.env.MONGO_URL || process.env.MONGO_CHAT_URI || 'mongodb://mongo:27017/chat-db';
  try {
    await mongoose.connect(mongoUrl);
    console.log("✅ Chat Service MongoDB Connected successfully to", mongoUrl);
  } catch (err) {
    console.error("❌ Chat Service MongoDB Connection Error:", err.message);
  }
};
