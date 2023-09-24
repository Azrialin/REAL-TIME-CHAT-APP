const socket = io("http://localhost:3000");
const messageContainer = document.getElementById("message-container");
const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");

if (messageForm != null) {
  const userName = prompt("Please enter your name");
  appendMessage(`you joined`);
  socket.emit("new-user join", userName);

  //when submit is triggered, get text input and send it to server then reset to ''
  messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = messageInput.value;
    //receive user's own text
    appendMessage(`You : ${message}`);
    socket.emit("send-message", message);
    messageInput.value = "";
  });
}

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
function appendMessage(message) {
  const messageElement = document.createElement("div");
  messageElement.innerText = message;
  messageContainer.append(messageElement);
}
