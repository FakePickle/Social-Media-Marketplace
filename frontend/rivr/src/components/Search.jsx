import React, { useContext, useEffect, useState } from "react";
import { TextField, InputAdornment, Typography, List, ListItem, ListItemText, Button, Modal, Box, Avatar } from "@mui/material";
import { FaSearch } from "react-icons/fa";
import api from "../utils/api";
import { AuthContext } from "../contexts/AuthContext";

function Search() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [people, setPeople] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reqLoading, setReqLoading] = useState(true);
    const { userData } = useContext(AuthContext); // Fixed: destructure properly

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get("/users");
                const formatted = res.data.users.map((user, index) => ({
                    id: user.id || index + 1,
                    profilePic: user.profile_picture_url,
                    name: user.username,
                    bio: user.bio,
                    isFriend: user.is_friend,
                }));
                setPeople(formatted);
            } catch (err) {
                console.error("Failed to fetch users:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await api.get("/friendships/");
                console.log("Raw response data:", res.data);
                if (!Array.isArray(res.data)) {
                    console.warn("No friend requests found or invalid response:", res.data);
                    setRequests([]);
                    return;
                }
                const formattedRequests = res.data.map((req) => ({
                    id: req.user_id,  // Use sender’s ID
                    name: req.user_username,  // Sender’s username
                    message: req.user_bio || "No bio provided.",  // Sender’s bio
                    profilePic: req.user_profile_pic || ""  // Sender’s profile pic
                }));
                setRequests(formattedRequests);
            } catch (err) {
                console.error("Failed to fetch friend requests:", err.response?.data || err.message);
            } finally {
                setReqLoading(false);
            }
        };
        fetchRequests();
    }, []);


    const handleAccept = async (friendUsername) => {
        try {
            console.log("friendUsername", friendUsername);
            await api.put("/friendships/accept/", { friend: friendUsername }); // Only send friend
            setRequests((prev) => prev.filter((r) => r.name !== friendUsername));
            alert("Request accepted!");
        } catch (err) {
            alert("Failed to accept request.");
            console.error(err);
        }
    };

    const handleDecline = async (friendUsername) => {
        try {
            await api.delete("/friendships/delete/", { data: { friend: friendUsername } }); // Only send friend
            setRequests((prev) => prev.filter((r) => r.name !== friendUsername));
            alert("Request declined!");
        } catch (err) {
            alert("Failed to decline request.");
            console.error(err);
        }
    };

    const handleAddFriend = async (friendUsername) => {
        try {
            console.log("Sending request with token:", localStorage.getItem("accessToken"));
            console.log("Passing friendUsername:", friendUsername);
            await api.post("/friendships/", {friend: friendUsername}); // Only send friend
            alert("Friend request sent!");
            setSelectedUser(null);
        } catch (err) {
            alert("Failed to send friend request.");
            console.error(err);
        }
    };

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            {/* Left Search Panel */}
            <div style={{ flex: 3, backgroundColor: "#1B263B", padding: "20px" }}>
                <Typography variant="h4" color="#778DA9" style={{ marginBottom: "20px" }}>
                    Search
                </Typography>
                <TextField
                    variant="outlined"
                    placeholder="Search People"
                    fullWidth
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <FaSearch color="#778DA9" size={"20px"} />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: "30px", color: "white" },
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': { borderRadius: "30px" },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: "#778DA9" },
                    }}
                />
                {searchQuery && (
                    <div style={{ marginTop: "20px", maxHeight: "75vh", overflowY: "auto" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
                            {people
                                .filter((person) => person.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((person) => (
                                    <div
                                        key={person.id}
                                        onClick={() => setSelectedUser(person)}
                                        style={{
                                            backgroundColor: "#415A77",
                                            borderRadius: "10px",
                                            padding: "15px",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            textAlign: "center",
                                            cursor: "pointer",
                                            transition: "transform 0.2s ease",
                                        }}
                                    >
                                        <img
                                            src={person.profilePic}
                                            alt={person.name}
                                            style={{ width: "80px", height: "80px", borderRadius: "50%", marginBottom: "10px" }}
                                        />
                                        <Typography variant="h6" color="#E0E1DD">{person.name}</Typography>
                                        <Typography variant="body2" color="#778DA9">{person.bio}</Typography>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Chat Window */}
            <div style={{ flex: 1, backgroundColor: "#415A77", display: "flex", flexDirection: "column", padding: "10px" }}>
                <Typography variant="h4" color="white" style={{ marginBottom: "20px" }}>Requests</Typography>
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
                                padding: "10px",
                            }}
                        >
                            <ListItemText
                                primary={<Typography style={{ color: "#E0E1DD" }}>{request.name}</Typography>}
                                secondary={<Typography style={{ color: "#778DA9" }}>{request.message}</Typography>}
                            />
                            <div style={{ display: "flex", gap: "10px" }}>
                                <Button variant="contained" color="success" size="small" onClick={() => handleAccept(request.name)}>
                                    Accept
                                </Button>
                                <Button variant="contained" color="error" size="small" onClick={() => handleDecline(request.name)}>
                                    Decline
                                </Button>
                            </div>
                        </ListItem>
                    ))}
                </List>
            </div>

            <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        bgcolor: "#1B263B",
                        borderRadius: "15px",
                        boxShadow: 24,
                        p: 4,
                        minWidth: 300,
                        textAlign: "center",
                    }}
                >
                    {selectedUser && (
                        <>
                            <Avatar src={selectedUser.profilePic} alt={selectedUser.name} sx={{ width: 100, height: 100, margin: "0 auto", mb: 2 }} />
                            <Typography variant="h6" color="#E0E1DD" gutterBottom>{selectedUser.name}</Typography>
                            <Typography variant="body2" color="#778DA9" gutterBottom>{selectedUser.bio}</Typography>
                            {selectedUser.isFriend ? (
                                <Button variant="contained" color="error" onClick={() => handleDecline(selectedUser.name)}>
                                    Remove Friend
                                </Button>
                            ) : (
                                    <Button variant="contained" color="primary" onClick={() => handleAddFriend(selectedUser.name)}>
                                        Add Friend
                                    </Button>
                                )}
                        </>
                    )}
                </Box>
            </Modal>
        </div>
    );
}

export default Search;
