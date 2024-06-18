const mongoose = require('mongoose');

const ConversationSchema = mongoose.Schema({
    members : {
        type : Array
    }
});

const Conversation = mongoose.model('Conversation' , ConversationSchema);

module.exports = Conversation ;
