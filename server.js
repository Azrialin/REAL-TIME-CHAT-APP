const express =  require('express');
const app = express();
const server = require('http').Server(app);
const io = require("socket.io")(server, {
  //create server and handle CORS issue
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//ejs config
app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const rooms = { name: {} };

//route setting
app.get('/', (req, res) => {
  res.render('index', {rooms: rooms})
});

app.post('/room', (req, res) => {
  if (rooms[req.body.room] != null) {
    return res.redirect('/');
  };
  rooms[req.body.room] = { users: {} };
  res.redirect(req.body.room);
})

app.get('/:room', (req, res) => {
  res.render('room', { roomName: req.params.room })
});
//listen on port 3000
server.listen(3000);

const users = {};

io.on("connection", (socket) => {
  socket.on('new-user join', userName => {
    users[socket.id] = userName;
    socket.broadcast.emit('user-connected', userName);
  });
  socket.on("send-message", (message) => {
    socket.broadcast.emit("Chatroom-message", {message: message , userName: users[socket.id]});
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit('user-disconnected', users[socket.id])
    delete users[socket.id];
  });
});
