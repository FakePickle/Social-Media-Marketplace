import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';
import { AuthContext } from './AuthContext';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { userData } = useContext(AuthContext);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to get the other user in a DM
  const getOtherUser = (chat) => {
    if (chat.type === 'group') return chat.name;
    return chat.user1 === userData?.username ? chat.user2 : chat.user1;
  };

  // Fetch all chats (DMs and groups)
  const fetchChats = async () => {
    if (!userData?.username) return;
    try {
      setLoading(true);
      const response = await api.get('/allChats/');
      setChats(response.data.results || []); // CombinedChatGroupView returns {results: [...]}
      setError(null);
    } catch (err) {
      console.error('Error fetching chats:', err.response?.data || err.message);
      setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a specific chat
  const fetchMessages = async (chatId, isGroup = false) => {
    try {
      setLoading(true);
      if (isGroup) {
        const response = await api.get(`/messages/${chatId}/`); // Group messages
        setMessages(response.data || []);
      } else {
        const otherUser = getOtherUser({ id: chatId, type: 'chat' });
        console.log('Fetching messages for:', otherUser);
        const response = await api.get('/messages/', {
          params: { receiver: otherUser },
        });
        setMessages(response.data || []);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err.response?.data || err.message);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (content, receiverId, isGroup = false) => {
    try {
      const messageData = {
        sender: userData?.username,
        content,
        ...(isGroup ? { group: receiverId } : { receiver: receiverId }),
      };
      const response = await api.post('/messages/', messageData);
      const newMessage = response.data;

      // Update messages list
      setMessages((prev) => [...prev, newMessage]);

      // Update chats list with last message
      setChats((prev) => {
        const updatedChats = [...prev];
        const chatIndex = updatedChats.findIndex((chat) =>
          isGroup ? chat.id === receiverId : (chat.user1 === receiverId || chat.user2 === receiverId)
        );
        if (chatIndex !== -1) {
          updatedChats[chatIndex] = {
            ...updatedChats[chatIndex],
            last_message: newMessage.decrypted_content || newMessage.content,
            last_message_timestamp: newMessage.timestamp,
          };
        } else if (!isGroup) {
          updatedChats.push({
            id: `${userData?.username}-${receiverId}`, // Match CombinedChatGroupView format
            type: 'chat',
            user1: userData?.username,
            user2: receiverId,
            last_message: newMessage.decrypted_content || newMessage.content,
            last_message_timestamp: newMessage.timestamp,
          });
        }
        return updatedChats;
      });

      return newMessage;
    } catch (err) {
      console.error('Error sending message:', err.response?.data || err.message);
      throw new Error('Failed to send message');
    }
  };

  // Create a new DM chat by sending a message
  const createChat = async (otherUsername) => {
    try {
      const response = await sendMessage('Hello!', otherUsername, false);
      await fetchChats(); // Refresh chat list from /allChats/
      return response;
    } catch (err) {
      console.error('Error creating chat:', err.response?.data || err.message);
      throw new Error('Failed to create chat');
    }
  };

  // Create a new group
  const createGroup = async (name, description, members) => {
    try {
      const response = await api.post('/groups/', {
        name,
        description,
        members: [userData?.username, ...members],
      });
      setChats((prev) => [...prev, { ...response.data, type: 'group' }]);
      return response.data;
    } catch (err) {
      console.error('Error creating group:', err.response?.data || err.message);
      throw new Error('Failed to create group');
    }
  };

  // Fetch chats on user login
  useEffect(() => {
    if (userData?.username) {
      fetchChats();
    }
  }, [userData?.username]);

  // Fetch messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      fetchMessages(
        activeChat.type === 'group' ? activeChat.id : getOtherUser(activeChat),
        activeChat.type === 'group'
      );
    }
  }, [activeChat]);

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        setActiveChat,
        messages,
        loading,
        error,
        sendMessage,
        createChat,
        createGroup,
        fetchChats,
        fetchMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
