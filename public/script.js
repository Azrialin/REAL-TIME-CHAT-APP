const socket = io("https://localhost:3000");
const messageContainer = document.getElementById("message-container");
const roomContainer = document.getElementById("room-container");
const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");
const leaveRoom = document.getElementById("leave-room-button");

if (messageForm != null) {
  const userName = prompt("Please enter your name");
  appendMessage(`you joined`);
  socket.emit("new-user join", roomName, userName);

  //when submit is triggered, get text input and send it to server then reset to ''
  messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = messageInput.value;
    //receive user's own text
    appendMessage(`You : ${message}`, true);
    socket.emit("send-message", roomName, message);
    messageInput.value = "";
  });
}

socket.on('room-created', room => {
    const roomElement = document.createElement('span');
    roomElement.innerText = "Room : " + room;
    roomElement.classList.add('me-2');

    const roomLink = document.createElement('a');
    roomLink.href = `/${room}`;
    roomLink.innerText = 'join';
    roomLink.classList.add('btn', 'btn-dark', 'btn-sm');
    roomContainer.append(roomElement);
    roomContainer.append(roomLink);
})

socket.on("Chatroom-message", (data) => {
  appendMessage(`${data.userName} : ${data.message}`);
});

socket.on("user-connected", (userName) => {
  appendMessage(`${userName} connected`);
});

socket.on("user-disconnected", (userName) => {
  appendMessage(`${userName} disconnected`);
});

//append message text on view
function appendMessage(message, own = false) {
  const messageElement = document.createElement("div");
  messageElement.innerText = message;
  messageElement.classList.add("chatColor");

  if (own) {
    messageElement.classList.add("ownMessage");
  }
  messageContainer.append(messageElement);
}
//leave room
if (leaveRoom != null) {
  leaveRoom.addEventListener("click", () => {
    //when the page redirect to other pages, socket will disconnect automatically
    window.location.href = "/home";
  });
}