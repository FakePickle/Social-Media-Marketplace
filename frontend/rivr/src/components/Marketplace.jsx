import React, { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Modal,
  Box,
  Badge,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  AppBar,
  Toolbar,
  Divider,
  Fab,
} from "@mui/material";
import '../utils/api.js';
import { Search,  ShoppingCart, RemoveShoppingCart, Add } from "@mui/icons-material";
import api from "../utils/api.js";

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");
  const [paymentDetails, setPaymentDetails] = useState({  upi_id: "" });
  const [products, setProducts] = useState([]); // Initialize products state
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    price: "",
    image: "",
    upi_id: "",
  });
  const filteredProducts = products.filter(
    (product) =>
      product.is_active &&
      product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // api call to fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        api.defaults.headers.common["Authorization"] = `Bearer ${localStorage.getItem("access_token")}`;
        const response = await api.get("marketplace/");
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  })


  const handleOpenModal = (product) => {
    setSelectedProduct(product);
    setOpenModal(true);
  };

  const handleCloseModal = () => setOpenModal(false);

  const addToCart = (product) => {
    setCart((prev) => [...prev, product]);
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.listing_id !== id));
  };
  const handleAddProduct = () => {
    if (!newProduct.title || !newProduct.description || !newProduct.price || !newProduct.image_url) {
      alert("Please fill in all fields.");
      return;
    }

    const newEntry = {
      ...newProduct,
      is_active: true,
      price: parseFloat(newProduct.price),
      listing_id: Date.now(),
    };
    console.log("newEntry", newEntry);

    setProducts((prev) => [...prev, newEntry]);
    setNewProduct({ title: "", description: "", price: "", image_url: "", upi_id: "" });
    setAddModalOpen(false);
  };
  const handleBuyNow = (product) => {
    setCart([product]); 
    setPaymentModalOpen(true); 
  };


  return (
    <div style={{ backgroundColor: "#1B263B", minHeight: "92vh", color: "white", padding: "20px" }}>
      <AppBar position="static" sx={{ backgroundColor: "#1B263B", padding: "10px", boxShadow: "none" }}>
        <Toolbar>
          <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: "bold" }}>
            Marketplace
          </Typography>
          <TextField
            variant="outlined"
            placeholder="Search Marketplace"
            size="small"
            sx={{ backgroundColor: "#2A3B5D", borderRadius: "8px", input: { color: "white" }, width: "40%" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "gray" }} />
                </InputAdornment>
              ),
            }}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <IconButton sx={{ color: "white", marginLeft: "10px" }} onClick={() => setCartOpen(true)}>
            <Badge badgeContent={cart.length} color="error">
              <ShoppingCart style={{ width: "50px" }} />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Product Grid */}
      <Grid container spacing={3} sx={{ marginTop: "20px",maxHeight: "79vh",overflowY: "auto",paddingRight: "5px",}}>
        {filteredProducts.map((product) => (
          <Grid item key={product.listing_id} xs={12} sm={6} md={4} lg={3}>
            <Card
              sx={{
                backgroundColor: "#2A3B5D",
                boxShadow: 3,
                borderRadius: "12px",
                cursor: "pointer",
                "&:hover": { transform: "scale(1.05)", transition: "0.3s" },
              }}
              onClick={() => handleOpenModal(product)}
            >
              <CardMedia
                component="img"
                height="140"
                image={product.image_url}
                alt={product.title}
                sx={{
                  borderTopLeftRadius: "12px",
                  borderTopRightRadius: "12px",
                }}
              />
              <CardContent>
                <Typography variant="h6" sx={{ color: "white", fontWeight: "bold" }}>
                  {product.title}
                </Typography>
                <Typography variant="body1" color="gray">
                  ${product.price}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Product Modal */}
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)", width: 400,
            backgroundColor: "#1B263B", color: "white",
            padding: 4, borderRadius: "12px", boxShadow: 24,
          }}
        >
          {selectedProduct && (
            <>
              <CardMedia
                component="img"
                height="200"
                image={selectedProduct.image_url}
                alt={selectedProduct.title}
                sx={{ borderRadius: "8px" }}
              />
              <Typography variant="h5" fontWeight="bold" sx={{ marginTop: 2 }}>
                {selectedProduct.title}
              </Typography>
              <Typography variant="h6" color="lightgray" sx={{ marginTop: "10px" }}>
                ${selectedProduct.price}
              </Typography>
              <Typography variant="body1" sx={{ marginTop: "10px", color: "gray" }}>
                {selectedProduct.description}
              </Typography>

              <Box sx={{ marginTop: "20px", textAlign: "center" }}>
                <Button variant="contained" sx={{ backgroundColor: "#238636", "&:hover": { backgroundColor: "#2EA043" }, marginRight: "10px" }} onClick={() => addToCart(selectedProduct)}>
                  Add to Cart
                </Button>
                <Button
                variant="contained"
                sx={{ backgroundColor: "#FF9800", "&:hover": { backgroundColor: "#E68900" } }}
                onClick={() => handleBuyNow(selectedProduct)}
              >
                Buy Now
              </Button>
              </Box>

              <Button onClick={handleCloseModal} sx={{ marginTop: "20px", color: "lightgray", textDecoration: "underline", display: "block", marginLeft: "auto", marginRight: "auto" }}>
                Close
              </Button>
            </>
          )}
        </Box>
      </Modal>

      {/* Cart Modal */}
      <Modal open={cartOpen} onClose={() => setCartOpen(false)}>
        <Box
          sx={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)", width: 400,
            backgroundColor: "#1B263B", color: "white",
            padding: 4, borderRadius: "12px", boxShadow: 24,
          }}
        >
          <Typography variant="h5" fontWeight="bold">Cart</Typography>
          {cart.length === 0 ? (
            <Typography sx={{ marginTop: "10px" }}>Your cart is empty.</Typography>
          ) : (
            <>
              {cart.map((item) => (
                <Box key={item.listing_id} sx={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                  <Typography>{item.title} - ${item.price}</Typography>
                  <IconButton onClick={() => removeFromCart(item.listing_id)} sx={{ color: "red" }}>
                    <RemoveShoppingCart />
                  </IconButton>
                </Box>
              ))}
              <Box sx={{ textAlign: "center", marginTop: "20px" }}>
                <Button
                  variant="contained"
                  sx={{ backgroundColor: "#238636", "&:hover": { backgroundColor: "#2EA043" } }}
                  onClick={() => {
                    setCartOpen(false);
                    setPaymentModalOpen(true);
                  }}
                >
                  Proceed to Checkout
                </Button>
              </Box>
            </>
          )}

        </Box>
      </Modal>
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)}>
          <Box
            sx={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)", width: 400,
              backgroundColor: "#1B263B", color: "white",
              padding: 4, borderRadius: "12px", boxShadow: 24,
            }}
          >
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>Add New Product</Typography>
            <TextField
              fullWidth
              label="Title"
              variant="outlined"
              value={newProduct.title}
              onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
              sx={{ mb: 2, input: { color: "white" }, label: { color: "gray" } }}
            />
            <TextField
              fullWidth
              label="Description"
              variant="outlined"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              sx={{ mb: 2, input: { color: "white" }, label: { color: "gray" } }}
            />
            <TextField
              fullWidth
              label="Price"
              type="number"
              variant="outlined"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              sx={{ mb: 2, input: { color: "white" }, label: { color: "gray" } }}
            />
            <TextField
              fullWidth
              label="Image URL"
              variant="outlined"
              value={newProduct.image_url}
              onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
              sx={{ mb: 2, input: { color: "white" }, label: { color: "gray" } }}
            />
            <Box sx={{ textAlign: "center" }}>
              <Button onClick={handleAddProduct} variant="contained" sx={{ backgroundColor: "#238636", "&:hover": { backgroundColor: "#2EA043" }, mr: 2 }}>
                Add Product
              </Button>
              <Button onClick={() => setAddModalOpen(false)} sx={{ color: "lightgray" }}>
                Cancel
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Floating Add Button */}
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: "fixed",
            bottom: 30,
            right: 30,
            backgroundColor: "#238636",
            "&:hover": {
              backgroundColor: "#2EA043",
            },
          }}
          onClick={() => setAddModalOpen(true)}
        >
          <Add />
        </Fab>
        <Modal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)}>
          <Box
            sx={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)", width: 400,
              backgroundColor: "#1B263B", color: "white",
              padding: 4, borderRadius: "12px", boxShadow: 24,
            }}
          >
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>Payment Gateway</Typography>
            {/* Order Summary */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">Order Summary</Typography>
              {cart.map((item) => (
                <Box key={item.listing_id} sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                  <Typography>{item.title}</Typography>
                  <Typography>${item.price}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 1, borderColor: "gray" }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                <Typography fontWeight="bold">Total:</Typography>
                <Typography fontWeight="bold">
                  ${cart.reduce((total, item) => total + parseFloat(item.price), 0).toFixed(2)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Button
                variant={selectedPaymentMethod === "card" ? "contained" : "outlined"}
                sx={{ mr: 1, backgroundColor: selectedPaymentMethod === "card" ? "#238636" : "transparent", color: "white" }}
                onClick={() => setSelectedPaymentMethod("card")}
              >
                Credit Card
              </Button>
              <Button
                variant={selectedPaymentMethod === "upi" ? "contained" : "outlined"}
                sx={{ backgroundColor: selectedPaymentMethod === "upi" ? "#238636" : "transparent", color: "white" }}
                onClick={() => setSelectedPaymentMethod("upi")}
              >
                UPI ID
              </Button>
            </Box>

            {selectedPaymentMethod === "card" ? (
              <>
                <TextField
                  fullWidth
                  label="Card Number"
                  variant="outlined"
                  value={paymentDetails.cardNumber}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })}
                  sx={{ mb: 2, input: { color: "white" }, label: { color: "gray" } }}
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    label="Expiry"
                    variant="outlined"
                    value={paymentDetails.expiry}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, expiry: e.target.value })}
                    sx={{ mb: 2, input: { color: "white" }, label: { color: "gray" }, flex: 1 }}
                  />
                  <TextField
                    label="CVV"
                    variant="outlined"
                    value={paymentDetails.cvv}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })}
                    sx={{ mb: 2, input: { color: "white" }, label: { color: "gray" }, flex: 1 }}
                  />
                </Box>
              </>
            ) : (
              <TextField
                fullWidth
                label="UPI ID"
                variant="outlined"
                value={paymentDetails.upiId}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })}
                sx={{ mb: 2, input: { color: "white" }, label: { color: "gray" } }}
              />
            )}

            <Box sx={{ textAlign: "center" }}>
              <Button
                onClick={() => {
                  alert("Payment successful!");
                  setPaymentModalOpen(false);
                  setOpenModal(false); // Close product modal too
                }}
                variant="contained"
                sx={{ backgroundColor: "#238636", "&:hover": { backgroundColor: "#2EA043" }, mr: 2 }}
              >
                Pay Now
              </Button>
              <Button onClick={() => setPaymentModalOpen(false)} sx={{ color: "lightgray" }}>
                Cancel
              </Button>
            </Box>
          </Box>
        </Modal>

    </div>
  );
};

export default Marketplace;