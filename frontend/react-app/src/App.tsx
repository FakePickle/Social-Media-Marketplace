import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ListGroup from "./components/Login";
import Signup from "./components/Signup"; 
import ChatPage from "./components/ChatPage"; 
import FindPeople from "./components/FindPeople";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<ListGroup />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/chatpage" element={<ChatPage />} />
                <Route path="/findpeople" element={<FindPeople />} />
            </Routes>
        </Router>
    );
}

export default App;