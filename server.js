require('dotenv').config();
const fs = require("fs");
const https = require("https");
const express = require("express");
const helmet = require("helmet");
const mongoose = require("mongoose");
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const LocalStrategy = require('passport-local').Strategy;
const cookieSession = require('cookie-session');
const userController  = require("./routes/user.controller");//for web 
const userApiController  = require("./routes/userApi.controller");//for postman
const entities = require("entities");//decode special html character
const { verify } = require('crypto');
const userModel = require('./models/user.model');

//google auth config
const config = {
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET:process.env.CLIENT_SECRET,
  COOKIE_KEY_1: process.env.COOKIE_KEY_1,
  COOKIE_KEY_2: process.env.COOKIE_KEY_2,
};

const AUTH_OPTIONS = {
  callbackURL: '/auth/google/callback',
  clientID: config.CLIENT_ID,
  clientSecret: config.CLIENT_SECRET,
};

function verifyCallback(accessToken, refreshToken, profile, done) {
  console.log('Google profile', profile);
  done(null, profile);
}

passport.use(new GoogleStrategy(AUTH_OPTIONS, verifyCallback));

// Local strategy for username and password login
passport.use(new LocalStrategy(
  { usernameField: 'useremail' },
  async (email, password, done) => {
    try {
      const user = await userModel.findUserByEmail(email);
      if (!user || user.password !== password) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// save session to the cookie
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// read session from the cookie
passport.deserializeUser((id, done) => {
  // user.findById(id).then(user => {
  //   done(null, user);
  // });
  done(null, id);
})

const app = express();
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], // 默認策略，限制了可以載入哪些資源
        scriptSrc: [
          "'self'", 
          'https://cdnjs.cloudflare.com', // 允許載入來自 CDNJS 的指令碼
          'https://cdn.jsdelivr.net' // 允許載入來自 jsDelivr 的指令碼
        ],
      },
    },
  })
);
// session
app.use(cookieSession({
  name: 'session',
  maxAge: 24 * 60 * 60 * 1000,
  keys: [ config.COOKIE_KEY_1, config.COOKIE_KEY_2],
}));

// initialize passport middleware
app.use(passport.initialize());
app.use(passport.session());

//ejs config
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const server = https.createServer({
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
}, app);

const io = require("socket.io")(server, {
  //create server and handle CORS issue
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//connect to MongoDB
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/test';

mongoose.connection.once("open", () => {
  console.log("MongoDB connection ready~");
  //Start the server only after MongoDB is connected
  //listen on port 3000
  server.listen(3000, () => {
    console.log("Server listening on port 3000");
  });
});

mongoose.connection.on("error", (err) => {
  console.error(err);
});

mongoose.connect(MONGO_URL);

const rooms = {};

//index route setting
app.get("/", (req, res) => {
  //delete it after login check is created
  //TODO:目前註冊/登入成功只會直接轉頁，後面要加session去紀錄使用者，不然註冊/登入沒意義
  res.redirect("/login");
  // res.render("index", { rooms: rooms });
});

//login check
function  checkLoggedIn(req, res, next) {
  const isLoggedIn = req.isAuthenticated() && req.user;
  if (!isLoggedIn) {
    return res.status(401).json({
      error: "You must log in!",
    })
  }
  next();
}

//login page
app.get("/login", (req, res) => {
  let errorMessage = '';
  res.render("login", { errorMessage: req.query.errorMessage});
});

//logout
app.post("/logout", (req, res) => {
  req.logout();
  req.session = null; // 清除 session
  res.redirect("/login");
});

// auth google
app.get('/auth/google', 
  passport.authenticate('google', {
    scope: ['email'],
  }));

app.get('/auth/google/callback', 
  passport.authenticate('google', {
    failureRedirect: '/failure',
    successRedirect: '/home',
    session: true,
  }),
  (req, res) => {
    console.log('Google called us back!');
  }
);

//home route setting
app.get("/home", checkLoggedIn, (req, res) => {
  //delete it after login check is created
  //TODO:目前註冊/登入成功只會直接轉頁，後面要加session去紀錄使用者，不然註冊/登入沒意義
  // res.redirect("/login");
  res.render("index", { rooms: rooms });
});

app.get('/failure', (req, res) => {
  return res.send('Failed to log in!');
});

//register api route
app.post("/api/register", userApiController.register);
//login api route
app.post("/api/login", userApiController.getUser);

//register web request
app.post("/register", userController.register);
//login web request
app.post("/login", passport.authenticate('local', {
  successRedirect: '/home',
  failureRedirect: '/login?errorMessage=Invalid credentials'
}));

//create room 
app.post("/room", (req, res) => {
  if (rooms[req.body.room] != null) {
    return res.redirect("/home");
  }
  rooms[req.body.room] = { users: {} };
  io.emit("room-created", req.body.room);
  res.redirect(`/${req.body.room}`);
});

//individual room route
app.get("/:room", (req, res) => {
  //need to add login check
  //if the room doesnt exist return to main page
  if (rooms[req.params.room] == null) {
    return res.redirect("/home");
  }
  res.render("room", { roomName: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("new-user join", (room, userName) => {
    room = entities.decodeHTML(room);
    //try
    console.log("Room name received:", room);
    console.log("Current rooms:", rooms);
    if (!rooms[room]) {
      console.log("Error: Room does not exist:", room);
      return;
    }
    //try
    socket.join(room);
    rooms[room].users[socket.id] = userName;
    socket.to(room).emit("user-connected", userName);
  });
  socket.on("send-message", (room, message) => {
    room = entities.decodeHTML(room);
    socket.to(room).emit("Chatroom-message", {
      message: message,
      userName: rooms[room].users[socket.id],
    });
  });

  socket.on("disconnect", () => {
    getUserRooms(socket).forEach((room) => {
      socket.to(room).emit("user-disconnected", rooms[room].users[socket.id]);
      delete rooms[room].users[socket.id];
    });
    // console.log('A user disconnected');//try
  });
});

function getUserRooms(socket) {
  return Object.entries(rooms).reduce((roomNames, [roomName, room]) => {
    if (room.users[socket.id] != null) roomNames.push(roomName);
    return roomNames;
  }, []);
}
//exports for API test
module.exports = {
  server,
  mongoose
};