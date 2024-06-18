// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Connect to the database
require('./db/connection');

// Importing models
const Users = require('./module/Users');
const Conversation = require('./module/Conversation');
const Messages = require('./module/Messages');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

const port = process.env.PORT || 8000;
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

let conversations = {}; // Example in-memory storage for conversations

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`Client joined conversation ${conversationId}`);
  });

  socket.on('send_message', (message) => {
    const { conversationId, senderId, receiverId, text } = message;
    // Save message to the database (simulated here with in-memory storage)
    if (!conversations[conversationId]) {
      conversations[conversationId] = [];
    }
    conversations[conversationId].push({ senderId, receiverId, text });
    io.to(conversationId).emit('receive_message', message);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.get('/', (req, res) => {
  res.send('Welcome');
});

app.post('/api/register' , async(req ,res , next) => {
    try {
        const { fullName , email , password } = req.body;
        if (!fullName || !email || !password) {
            res.status(400).send("please fill all required fileds");
        }else{
            const isAlreadyExist =await Users.findOne({email});
            if (isAlreadyExist) {
                res.status(400).send('user already exits, plese sign in');
            }else{
                const newUser = new Users ({fullName ,email});
                bcryptjs.hash(password,6, (err,hashedPassword) => {
                    newUser.set( 'password',hashedPassword);
                    newUser.save();
                    next();
                })
                return res.status(200).send('new user is registered successfully');
            }
        }        
    } catch (error) {
        console.log(error,'error');        
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User doesn't exist, please sign up" });
        }

        const validateUser = await bcryptjs.compare(password, user.password);
        if (!validateUser) {
            return res.status(400).json({ message: "User email or password is incorrect" });
        }

        const payload = {
            userID: user._id,
            email: user.email
        };
        const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'THIS_IS_A_JWT_SECRET_KEY';

        jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: 84600 }, async (err, token) => {
            if (err) {
                return res.status(400).json({ message: "Error generating token" });
            }

            await Users.updateOne({ _id: user.id }, { $set: { token } });
            return res.status(200).json({ user: { id: user._id, email: user.email, fullName: user.fullName }, token: token });
        });

    } catch (error) {
        console.log(error, 'error');
        return res.status(400).json({ message: 'Internal server error' });
    }
});


app.post('/api/conversation', async(req,res) => {
    try {
        const {senderId , receiverId} = req.body;
        const newConversation = new Conversation({members : [senderId,receiverId]});
        await newConversation.save();
        res.status(200).send('Conversation created succssesfully');
        
    } catch (error) {
        console.log(error,'Error');
    }
});

app.get('/api/conversation/:userId', async(req,res) => {
    try {
        const userId = req.params.userId;
        const conversations = await Conversation.find({ members: { $in: [userId]}});
        const conversationUserData = Promise.all(conversations.map(async(conversations) =>{
            const receiverId = conversations.members.find((member) => member !== userId);
            const user = await Users.findById(receiverId);
            return {user :{ email:user.email, fullName: user.fullName}, conversationId:conversations._id}
        })) 
        res.status(200).json(await conversationUserData);
    } catch (error) {
        console.log(error,'Error');
    }
});

app.post('/api/messages', async (req, res) => {
    try {
      const { senderId, message, conversationId, receiverId } = req.body;
      if (!senderId || !message) return res.status(400).json({ message: 'Please fill all the details' });
  
      let newConversationId = conversationId;
      if (!conversationId && receiverId) {
        const newConversation = new Conversation({ members: [senderId, receiverId] });
        await newConversation.save();
        newConversationId = newConversation._id;
      } else if (!conversationId && !receiverId) {
        return res.status(400).json({ message: 'Fill all the required details' });
      }
  
      const newMessage = new Messages({ conversationId: newConversationId, senderId, message });
      await newMessage.save();
      res.status(200).json({ message: 'Message Sent Successfully', conversationId: newConversationId });
    } catch (error) {
      console.log(error, 'Error');
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  

  




app.get('/api/message/:conversationId', async (req, res) => {
    try {
        const conversationId = req.params.conversationId;
        if(!conversationId === 'new') return res.status(200).json([]);
        console.log(`Fetching messages for conversationId: ${conversationId}`);
        const messages = await Messages.find({conversationId});
        const messagesUserDara = Promise.all(messages.map(async(message) => {
            const user =await Users.findById(message.senderId);
            return {user: {id :user._id ,email:user.email, fullName : user.fullName},message :message.message}
        }))
        res.status(200).json(await messagesUserDara);
    } catch (error) {
        console.log(error, 'Error');
        res.status(500).json({ message: 'Internal Server Error' }); 
    }
});


app.get('/api/users', async(req,res) =>{
    try {
        const users = await Users.find();
        const usersData = await Promise.all(users.map(async(user)=>{
            return {user:{ email:user.email, fullName :user.fullName},userId:user._id};
        }))
        res.status(200).json(usersData);
    } catch (error) {
        res.log('Error'.error);
        
    }
});

app.get('/api/user-id-by-email/:email', async (req, res) => {
    try {
      const email = req.params.email;
      if (!email) {
        return res.status(400).send('Email is required');
      }
  
      const user = await Users.findOne({ email });
      if (!user) {
        return res.status(404).send('User not found');
      }
  
      res.status(200).json({ id: user._id });
    } catch (error) {
      console.error('Error fetching user ID:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });


app.listen(port,() =>{
    console.log('listning to port ' + port);
})