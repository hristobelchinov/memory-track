const mongoose = require('mongoose');
const AutoIncrement = require("mongoose-sequence")(mongoose);

const ChatSchema = new mongoose.Schema({
    chatId: {
        type: Number,
        unique: true,
    },
    name: {
        type: String,
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
}, { timestamps: true });

ChatSchema.plugin(AutoIncrement, { inc_field: "chatId" });

module.exports = mongoose.model("Chat", ChatSchema);