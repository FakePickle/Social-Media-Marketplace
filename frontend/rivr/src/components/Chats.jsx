import React, { useState } from 'react';
import { Typography, TextField, InputAdornment, List, ListItem, ListItemText, Divider, Button, Autocomplete } from '@mui/material';
import { FaSearch, FaPaperPlane, FaPaperclip, FaTimes } from 'react-icons/fa';

const initialPeople = [
  { name: "Alice Johnson", messages: [{ text: "Hey, how are you?", sender: "Alice" }] },
  { name: "Bob Smith", messages: [{ text: "Let's catch up later!", sender: "Bob" }] },
  { name: "Charlie Davis", messages: [{ text: "Did you check the files?", sender: "Charlie" }] },
  { name: "Diana Roberts", messages: [{ text: "Meeting at 3 PM.", sender: "Diana" }] },
  { name: "Ethan Williams", messages: [{ text: "Sounds good!", sender: "Ethan" }] },
  { name: "Fiona Carter", messages: [{ text: "I'll send the details soon.", sender: "Fiona" }] },
  { name: "George Harris", messages: [{ text: "Just finished the report.", sender: "George" }] },
  { name: "Hannah White", messages: [{ text: "Happy Birthday!", sender: "Hannah" }] },
  { name: "Isaac Lee", messages: [{ text: "Can you review this?", sender: "Isaac" }] },
  { name: "Jack Thompson", messages: [{ text: "Where are we meeting?", sender: "Jack" }] },
  { name: "Katie Brown", messages: [{ text: "Let's plan the trip.", sender: "Katie" }] },
  { name: "Liam Scott", messages: [{ text: "I'll call you later.", sender: "Liam" }] },
  { name: "Mia Adams", messages: [{ text: "Great job on the project!", sender: "Mia" }] },
  { name: "Noah Wilson", messages: [{ text: "See you soon!", sender: "Noah" }] },
  { name: "Olivia Martinez", messages: [{ text: "Can you help with this?", sender: "Olivia" }] },
  { name: "Peter Evans", messages: [{ text: "I'll be there in 10 minutes.", sender: "Peter" }] },
  { name: "Quinn Taylor", messages: [{ text: "Let's discuss tomorrow.", sender: "Quinn" }] },
  { name: "Ryan Hall", messages: [{ text: "Thanks for the update.", sender: "Ryan" }] },
  { name: "Sophia Green", messages: [{ text: "Looking forward to it!", sender: "Sophia" }] },
  { name: "Tom Baker", messages: [{ text: "Got your message!", sender: "Tom" }] },
];

function Chats() {
  const [people, setPeople] = useState(initialPeople);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sendMessage = () => {
    if ((newMessage.trim() === "" && !selectedFile) || selectedChat === null) return;
  
    const newMsg = selectedFile
      ? { file: selectedFile.name, sender: "You", type: selectedFile.type }
      : { text: newMessage, sender: "You" };
  
    const updatedPeople = people.map(person =>
      person.name === selectedChat.name
        ? { ...person, messages: [...person.messages, newMsg] }
        : person
    );
  
    setPeople(updatedPeople);
    setSelectedChat(updatedPeople.find(person => person.name === selectedChat.name));
    setNewMessage("");
    setSelectedFile(null);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    document.getElementById('fileInput').value = null;
  };

  const renderFilePreview = () => {
    if (!selectedFile) return null;

    const fileType = selectedFile.type;
    const fileName = selectedFile.name;

    if (fileType.startsWith('image/')) {
      return (
        <div style={{ 
          margin: '10px 0', 
          padding: '10px', 
          backgroundColor: '#33415C', 
          borderRadius: '5px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <img 
            src={URL.createObjectURL(selectedFile)} 
            alt="preview" 
            style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain' }} 
          />
          <span style={{ color: 'white' }}>{fileName}</span>
          <Button 
            onClick={handleFileRemove}
            sx={{ color: '#778DA9', minWidth: 'auto' }}
          >
            <FaTimes />
          </Button>
        </div>
      );
    }

    return (
      <div style={{ 
        margin: '10px 0', 
        padding: '10px', 
        backgroundColor: '#33415C', 
        borderRadius: '5px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ color: 'white' }}>📎 {fileName}</span>
        <Button 
          onClick={handleFileRemove}
          sx={{ color: '#778DA9', minWidth: 'auto' }}
        >
          <FaTimes />
        </Button>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", height: "90vh", overflow: "hidden" }}>
      {/* Left Sidebar - People List */}
      <div style={{ width: "35vh", backgroundColor: "#1B263B", padding: "15px", display: "flex", flexDirection: "column", marginTop:'10px' }}>
        <TextField
          placeholder="Search"
          variant="outlined"
          size="small"
          
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FaSearch style={{ color: "#778DA9" }} />
              </InputAdornment>
            ),
            sx: { backgroundColor: "#fff", borderRadius: "30px" },
          }}
          sx={{ marginBottom: "10px" }}
        />
        <List sx={{ overflowY: "auto", flexGrow: 1 }}>
          {filteredPeople.map((person, index) => (
            <React.Fragment key={index}>
              <ListItem
                button
                onClick={() => setSelectedChat(person)}
                selected={selectedChat?.name === person.name}
                sx={{
                  backgroundColor: selectedChat?.name === person.name ? "#778DA9" : "transparent",
                  borderRadius: "10px",
                  mb: 1,
                  "&:hover": { backgroundColor: "#415A77" },
                }}
              >
                <ListItemText
                  primary={<Typography sx={{ color: "white", fontWeight: 500 }}>{person.name}</Typography>}
                  secondary={<Typography sx={{ color: "#ccc", fontSize: "12px" }} noWrap>
                    {person.messages[person.messages.length - 1]?.text || person.messages[person.messages.length - 1]?.file}
                  </Typography>}
                />
              </ListItem>
              <Divider sx={{ backgroundColor: "#2C3E50" }} />
            </React.Fragment>
          ))}
        </List>
      </div>


      {/* Right Chat Window */}
      <div style={{ 
          flex: 1, 
          backgroundColor: "#415A77", 
          display: "flex", 
          flexDirection: "column", 
          paddingTop: "10px", 
          height: "90vh",
          overflow: "hidden"
        }}>

        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: "15px", backgroundColor: "#1B263B", color: "white", fontSize: "18px", fontWeight: "bold" }}>
              {selectedChat.name}
            </div>

            {/* Chat Messages (Scrollable) */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", color: "white", display: "flex", flexDirection: "column"}}>
              {selectedChat.messages.map((msg, index) => (
                <div key={index} style={{ 
                  alignSelf: msg.sender === "You" ? "flex-end" : "flex-start", 
                  marginBottom: "10px", 
                  padding: "10px", 
                  backgroundColor: msg.sender === "You" ? "#4CAF50" : "#778DA9", 
                  borderRadius: "10px", 
                  maxWidth: "60%",
                  color: "white"
                }}>
                  {msg.text}
                  {msg.file && (
                    <div>
                      📎 <a href="#" style={{ color: "#BBE1FA" }}>{msg.file}</a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Message Input (Fixed at Bottom) */}
            <div style={{
              padding: "10px 20px",
              backgroundColor: "#1B263B",
              borderTop: "1px solid #ccc"
            }}>
              {renderFilePreview()}
              <div style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="file"
                  id="fileInput"
                  style={{ display: "none" }}
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
                <Button
                  onClick={() => document.getElementById('fileInput').click()}
                  sx={{ marginRight: "10px", color: "#778DA9" }}
                >
                  <FaPaperclip size={20} />
                </Button>
                <TextField
                  variant="outlined"
                  placeholder="Type a message..."
                  fullWidth
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (newMessage.trim() !== "" || selectedFile)) {
                      sendMessage();
                    }
                  }}
                  InputProps={{
                    sx: { borderRadius: "30px", backgroundColor: "white" }
                  }}
                  sx={{
                    width: "975px",
                    '& .MuiOutlinedInput-root': { borderRadius: "30px", backgroundColor: "white" },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: "#778DA9" },
                  }}
                />
                <Button 
                  onClick={sendMessage}
                  startIcon={<FaPaperPlane width={"45px"} color='#778da9' />}
                  sx={{ marginLeft: "10px"}}
                />
              </div>
            </div>
          </>
        ) : (
          <Typography variant="h6" color="#778DA9" align="center" style={{ marginTop: "20vh" }}>
            Select a conversation to start chatting.
          </Typography>
        )}
      </div>
    </div>
  );
}

export default Chats;