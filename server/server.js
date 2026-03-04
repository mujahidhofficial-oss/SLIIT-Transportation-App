const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./src/config/db");

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.get("/health", (req, res) => res.json({ message: "Server running ✅" }));

app.use("/auth", require("./src/routes/auth.routes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));