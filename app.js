const express = require("express");
var cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const cookieParser = require("cookie-parser");
const { requireAuth } = require("./middleware/authMiddleware");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
// app.use(cookieParser())

app.post("/protected", requireAuth);
app.listen(process.env.PORT, () => {
  console.log("app running on " + process.env.PORT);
});

app.use(authRoutes);
app.use("/admin", adminRoutes);

//PASSWORD minimum length
