import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import avatar from '../../assets/avatar.svg';

const Dashboard = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user:detail')));
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [receiver, setReceiver] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const messageContainerRef = useRef(null);
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io('http://localhost:8000');

    socketRef.current.on('new_message', (message) => {
      if (message.conversationId === selectedConversationId) {
        setMessages((prevMessages) => [...prevMessages, { user: { id: message.senderId }, message: message.message }]);
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [selectedConversationId]);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem('user:detail'));
    if (loggedInUser) {
      const fetchConversations = async () => {
        try {
          const res = await fetch(`http://localhost:8000/api/conversation/${loggedInUser.id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          const resData = await res.json();
          setConversations(resData);
        } catch (error) {
          console.error("Error fetching conversations:", error);
        }
      };
      fetchConversations();
    }
  }, []);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async (conversationId, receiverId, receiverFullName, receiverEmail) => {
    try {
      const res = await fetch(`http://localhost:8000/api/message/${conversationId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const messageData = await res.json();
      setMessages(messageData);
      setReceiver({ id: receiverId, fullName: receiverFullName, email: receiverEmail });
      setSelectedConversationId(conversationId);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleConversationClick = (conversationId, receiverId, receiverFullName, receiverEmail) => {
    fetchMessages(conversationId, receiverId, receiverFullName, receiverEmail);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !user || !receiver.email) {
      console.error('Missing required fields:', {
        newMessage: newMessage.trim(),
        user,
        receiver: receiver.email
      });
      return;
    }

    try {
      // Fetch receiver ID by email
      const resReceiverId = await fetch(`http://localhost:8000/api/user-id-by-email/${receiver.email}`);
      const resReceiverData = await resReceiverId.json();
      if (!resReceiverId.ok) {
        console.error('Error fetching receiver ID:', resReceiverData);
        return;
      }
      const receiverId = resReceiverData.id;

      // Prepare the payload with the fetched receiver ID
      const payload = {
        senderId: user.id,
        message: newMessage,
        conversationId: selectedConversationId || '',
        receiverId: selectedConversationId ? undefined : receiverId // Send receiverId only if conversationId is not present
      };

      // Send the message
      const resMessage = await fetch('http://localhost:8000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resMessageData = await resMessage.json();
      if (!resMessage.ok) {
        console.error('Error sending message:', resMessageData);
      } else {
        setNewMessage('');
        fetchMessages(selectedConversationId || resMessageData.conversationId, receiverId, receiver.fullName, receiver.email); // Refresh the messages after sending
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
  };

  return (
    <div className='flex w-screen'>
      <div className='w-[25%] h-screen bg-white-700'>
        <div className='flex flex-col items-center my-8 mb-1'>
          <div className='flex items-center mb-3'>
            <img src={avatar} alt='Balot Dev' className='border border-blue-300 p-2 rounded-full w-12 h-12' />
            <div className='ml-4'>
              <h3 className='text-xl font-bold'>{user?.fullName}</h3>
              <p className='text-gray-400'>My account</p>
            </div>
          </div>
          <hr className='w-full border-1 border-gray-300 mt-3' />
        </div>
        <div className='px-4 ml-1'>
          <div className='text-lg font-bold mb-1'>Message</div>
          <div>
          {conversations.length > 0 ? conversations.map(({ conversationId, user: conversationUser }) => (
  <div key={conversationId} className='cursor-pointer flex items-center mb-4' onClick={() => handleConversationClick(conversationId, conversationUser.id, conversationUser.fullName, conversationUser.email)}>
    <img src={avatar} alt='avatar' className='border border-blue-300 p-2 rounded-full w-12 h-12' />
    <div className='ml-4'>
      <h3 className='text-xl font-bold'>{conversationUser?.fullName}</h3>
      <p className='text-gray-400'>{conversationUser?.email}</p>
    </div>
  </div>
)) : <div className='text-center text-lg font-semibold mt-24'>No Conversation</div>}

          </div>
        </div>
      </div>
      <div className='w-[50%] h-screen border bg-white flex flex-col items-center'>
        <div className='w-[75%] h-[70px] rounded-full bg-slate-200 mt-5 flex items-center shadow-sm'>
          <div className='cursor-pointer'>
            <img src={avatar} alt='Balot Dev' className='border border-blue-300 p-2 ml-3 rounded-full w-12 h-12' />
          </div>
          <div className='ml-3 mr-auto'>
            <h3 className='text-xl text-black'>{receiver?.fullName}</h3>
            <p className='text-sm text-gray-600'>{receiver?.email}</p>
          </div>
          <div className='cursor-pointer' onClick={handleSendMessage}>
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 icon icon-tabler icon-tabler-phone-outgoing" width="35" height="35" viewBox="0 0 24 24" strokeWidth="1.5" stroke="black" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
              <path d="M15 9l5 -5" />
              <path d="M16 4l4 0l0 4" />
            </svg>
          </div>
        </div>
        <hr className='w-full border-1 border-gray-200 mt-3' />
        <div ref={messageContainerRef} className='h-[75%] w-full overflow-y-auto mt-2 shadow-sm'>
          <div className='flex flex-col items-start p-4 space-y-4'>
            {messages.length > 0 ? messages.map((message) => (
              <div key={message.id} className={`max-w-[40%] border rounded-b-xl p-4 ${message.user.id === user?.id ? 'bg-blue-500 text-white self-end rounded-tl-xl' : 'bg-slate-100 rounded-tr-xl'}`}>
                {message.message}
              </div>
            )) : <div className='text-center text-lg font-semibold mt-24'>No Messages</div>}
          </div>
        </div>
        <div className='p-8 w-full flex items-center'>
          <input
            placeholder='Type a message...'
            className='w-full p-4 border-0 rounded-full shadow-md focus:ring-0 focus:border-0 outline-none'
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />
          <div className='ml-4 mt-1' onClick={handleSendMessage}>
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-send-2" width="35" height="35" viewBox="0 0 24 24" stroke-width="1.5" stroke="black" fill="none" stroke-linecap="rounded" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M4.698 4.034l16.302 7.966l-16.302 7.966a.503 .503 0 0 1 -.546 -.124a.555 .555 0 0 1 -.12 -.568l2.468 -7.274l-2.468 -7.274a.555 .555 0 0 1 .12 -.568a.503 .503 0 0 1 .546 -.124z" />
            <path d="M6.5 12h14.5" />
          </svg>
          </div>
          <div><svg xmlns="http://www.w3.org/2000/svg" class=" flex icon icon-tabler icon-tabler-circle-plus" width="35" height="35" viewBox="0 0 24 24" stroke-width="1.5" stroke="black" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
              <path d="M9 12h6" />
              <path d="M12 9v6" />
          </svg></div>
        </div>
      </div>
      <div className='w-[25%] h-screen bg-white-700'></div>
    </div>
  );
};

export default Dashboard;
