import React, { useState } from "react";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { Search, Sort } from "@mui/icons-material";

const UserManagement = ({userList}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterStatus, setFilterStatus] = useState("");

  
  // Handle sorting
  const sortedUsers = [...userList]
    .filter((user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((user) => (filterStatus ? user.status === filterStatus : true))
    .sort((a, b) =>
      sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );

  return (
    <div style={{ flex: 1, padding: "20px", color: "white", paddingTop: "40px", paddingBottom:"40px" }}>
      <Typography variant="h5" gutterBottom>
        User Management
      </Typography>

      {/* Search, Sort & Filter */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "15px",
        }}
      >
        {/* Search */}
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search User List"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            style: {
              backgroundColor: "white",
            //   color: "white",
              borderRadius: "30px",
            },
            startAdornment: (
              <InputAdornment position="start">
                <Search style={{ color: "white" }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Sort */}
        <Button
          variant="contained"
          size="small"
          style={{
            backgroundColor: "white",
            color: "black",
            textTransform: "none",
            borderRadius: "30px",
            minWidth: "100px"
          }}
          onClick={() =>
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
          }
          startIcon={<Sort />}
        >
          Sort {sortOrder === "asc" ? "A-Z" : "Z-A"}
        </Button>

        {/* Filter */}
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          displayEmpty
          size="small"
          sx={{
            backgroundColor: "white",
            color: "black",
            borderRadius: "30px",
            minWidth: 60,
            "& .MuiSvgIcon-root": {
              color: "white",
            },
          }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="Verified">Verified</MenuItem>
          <MenuItem value="Not Verified">Not Verified</MenuItem>
        </Select>
      </div>

      {/* Data Table */}
      <div style = {{paddingTop : "100px"}}>
      <TableContainer
        component={Paper}
        style={{ backgroundColor: "#1B263B", color: "white" }}
      >
        <Table>
          <TableHead>
            <TableRow>
              {["S.No", "User ID", "User Name", "Email", "Phone No.", "Status", "Created at", "Updated at"].map((header) => (
                <TableCell key={header} style={{ color: "white", fontWeight: "bold" }}>
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedUsers.map((user, index) => (
              <TableRow key={user.userID} style={{ color: "white" }}>
                <TableCell style={{ color: "white" }}>{index + 1}</TableCell>
                <TableCell style={{ color: "white" }}>{user.userID}</TableCell>
                <TableCell style={{ color: "white" }}>{user.name}</TableCell>
                <TableCell style={{ color: "white" }}>{user.email.substring(0, 6) + "..."}</TableCell>
                <TableCell style={{ color: "white" }}>{user.phone}</TableCell>
                <TableCell style={{ color: "white" }}>{user.status}</TableCell>
                <TableCell style={{ color: "white" }}>{user.createdAt}</TableCell>
                <TableCell style={{ color: "white" }}>{user.updatedAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      </div>
    </div>
  );
};

export default UserManagement;
