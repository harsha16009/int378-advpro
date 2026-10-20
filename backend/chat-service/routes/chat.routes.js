const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");

router.post("/send", chatController.sendMessage);
router.get("/thread/:threadId", chatController.getMessages);
router.get("/:threadId", chatController.getMessages);
router.get("/user-threads/:userId", chatController.getUserThreads);
router.post("/thread/create", chatController.createThread);
router.get("/online-users", chatController.getOnlineUsers);

module.exports = router;
