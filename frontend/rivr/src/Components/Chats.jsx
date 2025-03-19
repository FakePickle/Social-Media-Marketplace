import React, { useState } from 'react';
import { Typography, TextField, InputAdornment, List, ListItem, ListItemText, Divider, Button, Autocomplete } from '@mui/material';
import { FaSearch, FaPaperPlane } from 'react-icons/fa';

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

  // Filter people based on search input
  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sendMessage = () => {
    if (newMessage.trim() === "" || selectedChat === null) return;

    const updatedPeople = people.map(person =>
      person.name === selectedChat.name
        ? { ...person, messages: [...person.messages, { text: newMessage, sender: "You" }] }
        : person
    );

    setPeople(updatedPeople);
    setSelectedChat(updatedPeople.find(person => person.name === selectedChat.name));
    setNewMessage("");
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Left Sidebar - People List */}
      <div style={{ width: "35vh", backgroundColor: "#1B263B", padding: "15px", display: "flex", flexDirection: "column" }}>
        <Typography variant="h4" gutterBottom color="white">
          Chats
        </Typography>

        {/* AutoComplete Search Bar */}
        <Autocomplete
          freeSolo
          options={people.map((person) => person.name)}
          onInputChange={(event, newInputValue) => setSearchQuery(newInputValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              placeholder="Search Chats"
              fullWidth
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <FaSearch color="#778DA9" size={"20px"} />
                  </InputAdornment>
                ),
                sx: { borderRadius: "30px", color: "white" }
              }}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: "30px" },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: "#778DA9" },
              }}
            />
          )}
        />

        {/* Scrollable Chat List */}
        <List sx={{ marginTop: "10px", overflowY: "auto", flexGrow: 1 }}>
          {filteredPeople.map((person, index) => (
            <React.Fragment key={index}>
              <ListItem 
                button 
                onClick={() => setSelectedChat(person)}
                sx={{
                  backgroundColor: selectedChat?.name === person.name ? "#33415C" : "transparent",
                  borderRadius: "10px",
                }}
              >
                <ListItemText
                  primary={person.name}
                  secondary={person.messages[person.messages.length - 1].text}
                  secondaryTypographyProps={{ sx: { color: "#778DA9", paddingLeft:"15px" } }}
                  sx={{ color: "white" }}
                />
              </ListItem>
              {index !== people.length - 1 && <Divider sx={{ backgroundColor: "#778DA9" }} />}
            </React.Fragment>
          ))}
        </List>
      </div>

      {/* Right Chat Window */}
      <div style={{ flex: 1, backgroundColor: "#415A77", display: "flex", flexDirection: "column", paddingTop:"10px" }}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: "15px", backgroundColor: "#1B263B", color: "white", fontSize: "18px", fontWeight: "bold" }}>
              {selectedChat.name}
            </div>

            {/* Chat Messages (Scrollable) */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", color: "white", display: "flex", flexDirection: "column" }}>
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
                </div>
              ))}
            </div>

            {/* Message Input (Fixed at Bottom) */}
            <div style={{ padding: "10px", backgroundColor: "#1B263B", display: "flex", alignItems: "center", position: "sticky", bottom: "0", width: "100%", paddingBottom: "75px" }}>
              <TextField
                variant="outlined"
                placeholder="Type a message..."
                fullWidth
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newMessage.trim() !== "") {
                    sendMessage();
                  }
                }}
                InputProps={{
                  sx: { borderRadius: "30px", backgroundColor: "white" }
                }}
                sx={{
                  width:"975px",
                  '& .MuiOutlinedInput-root': { borderRadius: "30px", backgroundColor: "white" },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: "#778DA9" },
                }}
              />
              <Button 
                onClick={sendMessage}
                startIcon = {<FaPaperPlane width={"45px"} color='#778da9' />}
                sx={{ marginLeft: "10px"}}
              >
              </Button>
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
