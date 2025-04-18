const express = require("express");
const cors = require("cors");
const apiRouter = require("./routes");
require("dotenv").config();

const app = express();

// const corsOptions = {
//   origin: "http://localhost:3000", 
//   credentials: true, 
// };
// app.use(cors(corsOptions));
app.use(cors());

app.use(express.json());
app.use("/api", apiRouter);

// Error handler đơn giản
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});
module.exports = app;
