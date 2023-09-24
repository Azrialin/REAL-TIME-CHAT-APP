const express =  require('express');
const app = express();
const server = require('http').Server(app);
//decode special html character
const entities = require('entities');
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

const rooms = {};

//route setting
app.get('/', (req, res) => {
  res.render('index', {rooms: rooms})
});

app.post('/room', (req, res) => {
  if (rooms[req.body.room] != null) {
    return res.redirect('/');
  };
  rooms[req.body.room] = { users: {} };
  io.emit('room-created', req.body.room);
  res.redirect(req.body.room);
})

app.get('/:room', (req, res) => {
  //if the room doesnt exist return to main page
  if (rooms[req.params.room] == null) {
    return res.redirect('/');
  }
  res.render('room', { roomName: req.params.room })
});
//listen on port 3000
server.listen(3000);

io.on("connection", (socket) => {
  socket.on('new-user join', (room, userName) => {
    room = entities.decodeHTML(room);
    //try
    console.log('Room name received:', room);
    console.log('Current rooms:', rooms);
    if (!rooms[room]) {
      console.log('Error: Room does not exist:', room);
      return;
    }
    //try
    socket.join(room);
    rooms[room].users[socket.id] = userName;
    socket.to(room).emit('user-connected', userName);
  });
  socket.on("send-message", (room, message) => {
    room = entities.decodeHTML(room);
    socket.to(room).emit("Chatroom-message", {message: message , userName: rooms[room].users[socket.id]});
  });

  socket.on('disconnect', () => {
    getUserRooms(socket).forEach(room => {
      socket.broadcast.emit('user-disconnected', rooms[room].users[socket.id])
      delete rooms[room].users[socket.id];
    })
  });
});

function getUserRooms(socket) {
  return Object.entries(rooms).reduce((roomNames, [roomName, room]) => {
    if (room.users[socket.id] != null) roomNames.push(roomName);
    return roomNames;
  }, [])
}