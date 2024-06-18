const mongoose = require('mongoose');
const Conversation = require('./Conversation');

const messagesSchema = mongoose.Schema({
    conversationId : {
        type : String,
        required: true
    },
    senderId:{
        type: String,
        required: true
    },
    message:{
        type:String,
        required: true
    },
    createdAt:{
        type:Date,
        default : Date.now()
    }
});

const Messages = mongoose.model('Message' , messagesSchema);

module.exports = Messages ;
