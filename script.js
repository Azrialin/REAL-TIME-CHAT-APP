const socket = io('http://localhost:3000');

socket.on('Chatroom-message', data => {
    console.log(data);
});