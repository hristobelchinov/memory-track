const express = require('express');
const router = express.Router();
const Chat = require('../Schemas/chatSchema');
const Message = require('../Schemas/messageSchema');
const { accessCheckJWT } = require('../middleware/middleware');

// Middleware to check JWT
router.use(accessCheckJWT);

// Create a new group chat
router.post('/create', async (req, res) => {
    try {
        const { name, members } = req.body;
        const newChat = new Chat({ name, members });
        await newChat.save();
        res.status(201).json({ message: 'Group chat created successfully', chat: newChat });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Send a message in a group chat
router.post('/:chatId/message', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content } = req.body;
        const newMessage = new Message({ groupChat: chatId, sender: req.user.id, content });
        await newMessage.save();
        res.status(201).json({ message: 'Message sent successfully', message: newMessage });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get messages for a group chat
router.get('/:chatId/messages', async (req, res) => {
    try {
        const { chatId } = req.params;
        const messages = await Message.find({ groupChat: chatId }).populate('sender', 'username');
        res.status(200).json({ messages });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;