module.exports = (err, req, res, next) => {
  console.error("Chat Service Error:", err);
  res.status(err.status || 500).json({ 
    message: err.message || "Chat Server Error" 
  });
};
