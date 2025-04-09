import React, { useState, useContext } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  TextField,
  IconButton,
  Paper,
  Divider,
  CircularProgress,
  Button,
} from '@mui/material';
import { Send as SendIcon, Add as AddIcon } from '@mui/icons-material';
import { useChat } from '../contexts/ChatContext';
import { AuthContext } from '../contexts/AuthContext';

const Chat = () => {
  const { userData } = useContext(AuthContext); // Fixed: useContext
  const {
    chats,
    activeChat,
    setActiveChat,
    messages,
    loading,
    error,
    sendMessage,
    createChat,
  } = useChat();

  const [newMessage, setNewMessage] = useState('');
  const [newChatUsername, setNewChatUsername] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    try {
      await sendMessage(
        newMessage,
        activeChat.type === 'group' ? activeChat.id : getOtherUser(activeChat),
        activeChat.type === 'group'
      );
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleCreateChat = async (e) => {
    e.preventDefault();
    if (!newChatUsername.trim()) return;

    try {
      await createChat(newChatUsername);
      setNewChatUsername('');
      setShowNewChat(false);
    } catch (err) {
      console.error('Error creating chat:', err);
    }
  };

  const getOtherUser = (chat) => {
    if (chat.type === 'group') return chat.name;
    return chat.user1 === userData?.username ? chat.user2 : chat.user1;
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#1B263B' }}>
      {/* Chat List */}
      <Box
        sx={{
          width: 300,
          borderRight: '1px solid #415A77',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #415A77' }}>
          <Typography variant="h6" sx={{ color: '#E0E1DD' }}>
            Chats
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={() => setShowNewChat(!showNewChat)}
            sx={{
              mt: 1,
              color: '#E0E1DD',
              borderColor: '#415A77',
              '&:hover': {
                borderColor: '#778DA9',
              },
            }}
            variant="outlined"
            fullWidth
          >
            New Chat
          </Button>
          {showNewChat && (
            <Box component="form" onSubmit={handleCreateChat} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Enter username"
                value={newChatUsername}
                onChange={(e) => setNewChatUsername(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#E0E1DD',
                    '& fieldset': { borderColor: '#415A77' },
                    '&:hover fieldset': { borderColor: '#778DA9' },
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  mt: 1,
                  backgroundColor: '#415A77',
                  '&:hover': {
                    backgroundColor: '#778DA9',
                  },
                }}
              >
                Create Chat
              </Button>
            </Box>
          )}
        </Box>
        <List sx={{ overflow: 'auto', flexGrow: 1 }}>
          {loading && !chats.length ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress sx={{ color: '#E0E1DD' }} />
            </Box>
          ) : error ? (
            <Typography sx={{ color: '#E0E1DD', p: 2 }}>{error}</Typography>
          ) : (
            chats.map((chat) => (
              <ListItem
                key={chat.id}
                button
                selected={activeChat?.id === chat.id}
                onClick={() => setActiveChat(chat)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: '#415A77',
                    '&:hover': {
                      backgroundColor: '#415A77',
                    },
                  },
                  '&:hover': {
                    backgroundColor: '#2B3F5C',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar>{getOtherUser(chat)[0].toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography sx={{ color: '#E0E1DD' }}>
                      {getOtherUser(chat)}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      sx={{ color: '#778DA9' }}
                      noWrap
                    >
                      {chat.last_message || 'No messages yet'}
                    </Typography>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Box>

      {/* Message View */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid #415A77' }}>
              <Typography variant="h6" sx={{ color: '#E0E1DD' }}>
                {getOtherUser(activeChat)}
              </Typography>
            </Box>

            {/* Messages */}
            <Box
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {loading ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                  }}
                >
                  <CircularProgress sx={{ color: '#E0E1DD' }} />
                </Box>
              ) : error ? (
                <Typography sx={{ color: '#E0E1DD', textAlign: 'center' }}>{error}</Typography>
              ) : (
                messages.map((message, index) => (
                  <Box
                    key={index}
                    sx={{
                      alignSelf:
                        message.sender === userData?.username
                          ? 'flex-end'
                          : 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Paper
                      sx={{
                        p: 1,
                        backgroundColor:
                          message.sender === userData?.username
                            ? '#415A77'
                            : '#2B3F5C',
                        color: '#E0E1DD',
                        maxWidth: '70%',
                      }}
                    >
                      <Typography variant="body1">
                        {message.content} {/* Backend should return 'content' */}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: '#778DA9', display: 'block', mt: 0.5 }}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  </Box>
                ))
              )}
            </Box>

            {/* Message Input */}
            <Box
              component="form"
              onSubmit={handleSendMessage}
              sx={{
                p: 2,
                borderTop: '1px solid #415A77',
                display: 'flex',
                gap: 1,
              }}
            >
              <TextField
                fullWidth
                placeholder="Type a message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#E0E1DD',
                    '& fieldset': { borderColor: '#415A77' },
                    '&:hover fieldset': { borderColor: '#778DA9' },
                  },
                }}
              />
              <IconButton
                type="submit"
                sx={{
                  color: '#E0E1DD',
                  '&:hover': { backgroundColor: '#415A77' },
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <Typography variant="h6" sx={{ color: '#778DA9' }}>
              Select a chat to start messaging
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Chat;
