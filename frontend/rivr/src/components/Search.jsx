import React, { useState } from "react";
import { Autocomplete, TextField, InputAdornment, Typography, List, ListItem, ListItemText, Button } from "@mui/material";
import { FaSearch } from "react-icons/fa";

function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState([
    { id: 1, name: "Michael Scott", message: "Wants to connect with you" },
    { id: 2, name: "Pam Beesly", message: "Sent you a friend request" },
    { id: 3, name: "Jim Halpert", message: "Wants to collaborate on a project" }
  ]);

  const people = [
    { name: "John Doe" },
    { name: "Jane Smith" },
    { name: "Alice Johnson" },
    { name: "Bob Brown" }
  ];

  const handleAccept = (id) => {
    setRequests(requests.filter((request) => request.id !== id));
    alert("Request accepted!");
  };

  const handleDecline = (id) => {
    setRequests(requests.filter((request) => request.id !== id));
    alert("Request declined!");
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left Search Panel */}
      <div style={{ flex: 3, backgroundColor: "#1B263B", padding: "20px" }}>
        <Typography variant="h4" color="#778DA9" style={{ marginBottom: "20px" }}>
          Search
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

        {/* Empty space for search results */}
        <div style={{ 
          marginTop: "20px", 
          flex: 1, 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center" 
        }}>
          <Typography variant="body1" color="#778DA9">
            Search for people to connect
          </Typography>
        </div>
      </div>

      {/* Right Chat Window */}
      <div style={{ flex: 2, backgroundColor: "#415A77", display: "flex", flexDirection: "column", padding: "10px" }}>
        {/* Requests Section */}
        <Typography variant="h4" color="#778DA9" style={{ marginBottom: "20px" }}>
          Requests
        </Typography>
        <List>
          {requests.map((request) => (
            <ListItem
              key={request.id}
              style={{
                backgroundColor: "#1B263B",
                marginBottom: "10px",
                borderRadius: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px"
              }}
            >
              <ListItemText
                primary={<Typography style={{ color: "#E0E1DD" }}>{request.name}</Typography>}
                secondary={<Typography style={{ color: "#778DA9" }}>{request.message}</Typography>}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => handleAccept(request.id)}
                >
                  Accept
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => handleDecline(request.id)}
                >
                  Decline
                </Button>
              </div>
            </ListItem>
          ))}
        </List>
      </div>
    </div>
  );
}

export default Search;