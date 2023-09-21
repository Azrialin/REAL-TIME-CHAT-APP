const io = require("socket.io")(3000, {
  //create server and listen on port 3000 and handle CORS issue
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

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
