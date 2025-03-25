const express = require('express');
const router = express.Router();
const Chat = require('../Schemas/chatSchema');
const Message = require('../Schemas/messageSchema');
const { accessCheckJWT } = require('../middleware/middleware');

// Middleware to check JWT
router.use(accessCheckJWT);

// GET: Render the createChat form page
router.get('/create', (req, res) => {
    res.render('createChat', { currentUser: req.user });
});

// POST: Handle creating new group chat
router.post('/create', async (req, res) => {
    try {
        const { name, members } = req.body;

        // Members input assumed to be numeric IDs as strings e.g. "3,4,7"
        const memberIds = members.split(',').map(id => parseInt(id.trim()));

        // Retrieve the actual ObjectIds from your User collection
        const memberUsers = await User.find({ id: { $in: memberIds } });
        if (memberUsers.length !== memberIds.length) {
            return res.status(400).json({ message: 'Some user IDs are invalid.' });
        }

        const memberObjectIds = memberUsers.map(user => user._id);

        // Create chat with actual ObjectIds
        const newChat = new Chat({ name, members: memberObjectIds });
        await newChat.save();

        // Redirect after creation
        res.redirect(`/chat/${newChat._id}`);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// GET: Render chat page with messages
router.get('/:chatId', async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        const messages = await Message.find({ groupChat: chat._id })
            .populate('sender', 'username')
            .sort({ createdAt: 1 });

        res.render('chat', { currentUser: req.user, chat, messages });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST: Send a message in group chat
router.post('/:chatId/message', async (req, res) => {
    try {
        const { content } = req.body;
        const chatId = req.params.chatId;

        const newMessage = new Message({ groupChat: chatId, sender: req.user.id, content });
        await newMessage.save();

        // Redirect back to chat page after sending a message
        res.redirect(`/chat/${chatId}`);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET: JSON endpoint for fetching messages (for frontend AJAX, optional)
router.get('/:chatId/messages', async (req, res) => {
    try {
        const messages = await Message.find({ groupChat: req.params.chatId })
            .populate('sender', 'username')
            .sort({ createdAt: 1 });

        res.status(200).json({ messages });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;