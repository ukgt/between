//Dependencies
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
// const routes = require("./routes");

const user = require("./routes/api/user")

const app = express();

const PORT = process.env.PORT || 3001;

//Bodyparser Middleware
app.use(bodyParser.json());

// Define middleware here
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve up static assets (usually on heroku)
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

// Add routes, both API and view

app.use('/api/user', user);

// Connect to the Mongo DB
mongoose
    .connect(process.env.MONGODB_URI || "mongodb://localhost/reactreadinglist")
    .then(() => console.log("MongoDB Connected..."))
    .catch((err => console.log(err)));


// Start the API server
app.listen(PORT, () => console.log(`🌎  ==> API Server now listening on PORT ${PORT}!`));
