const io = require('socket.io')(3000, { //create server and listen on port 3000 and handle CORS issue
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

io.on('connection', socket => {
    socket.on('send-message', message => {
        socket.broadcast.emit('Chatroom-message', message);
    })
});
