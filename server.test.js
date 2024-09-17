const request = require('supertest');
const { server, mongoose} = require('./server');
const ioClient = require('socket.io-client');

afterAll(async () => {
  // closing server
  await mongoose.connection.close();
  server.close();
});

//index 
describe('GET /', () => {
  it('should respond with a 302 status code and redirect to /login', async () => {
    const response = await request(server).get('/');
    expect(response.statusCode).toBe(302);
    expect(response.header.location).toBe('/login');
  });
});

//create room
describe('POST /room', () => {
  
  beforeEach(() => {
    rooms = {}; // reset rooms object
  });

  it('shoud create a new room and redirect to it', async () =>{
    const roomName = "TestRoom";
    const response = await request(server)
      .post('/room')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({ room: roomName });
    
    expect(response.statusCode).toBe(302);//302 = redirect
    expect(response.header.location).toBe(`/${roomName}`);
  });
});

// get room
describe('GET /:room', () => {
  const roomName = "TestRoom";

  //Nonexist room
  it('should redirect to main page if room does not exist', async () =>{
    const response = await request(server)
      .get('/Nonexist');
      expect(response.statusCode).toBe(302);
      expect(response.header.location).toBe('/home');
  });

  //Exist room
  it('should return 200 when the room exists', async () => {
    //create room first 
    await request(server)
      .post('/room')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send({ room: roomName });
    //test the room's existence
    const response = await request(server)
      .get(`/${roomName}`);
    expect(response.statusCode).toBe(200);
  });
});

// socket.io tests
//new user join test
describe('Socket.IO', () => {
  let clientSocket;

  beforeAll(async () => {
    await new Promise((resolve) => {
      clientSocket = ioClient.connect('https://localhost:3000', {
        rejectUnauthorized: false // 暫時忽略 self signed certificate
      });
      clientSocket.on('connect', resolve);
    });
  });

  afterAll(() => {
    clientSocket.disconnect();
  });

  it('should annouce new user join', () => {
    const roomName = 'TestRoom';
    const userName = 'Eric';

    clientSocket.emit('new-user join', roomName, userName);

    clientSocket.on('user-connected', (clientName) => {
      expect(clientName).toBe(userName);
    });
  });
});
// sending and receiving message tests
describe('Socket.IO Message Tests', () => {
  let clientSocket;
  let receiverSocket;

  beforeAll((done) => {
    clientSocket = ioClient.connect('https://localhost:3000', {
      rejectUnauthorized: false // 暫時忽略 self signed certificate
    });
    receiverSocket = ioClient.connect('https://localhost:3000', {
      rejectUnauthorized: false // 暫時忽略 self signed certificate
    });

    clientSocket.on('connect', () => {
      receiverSocket.on('connect', done);
    });
  });

  afterAll(() => {
    clientSocket.disconnect();
    receiverSocket.disconnect();
  });

  it('should send and receive a message', async () => {
    const roomName = 'TestRoom';
    const testMessage = 'Hello World';
    const userName = 'Eric';

    // two users join the room
    clientSocket.emit('new-user join', roomName, userName);
    receiverSocket.emit('new-user join', roomName, 'tester');

    await new Promise((resolve) => {
      // listen for the Chatroom-message on receiverSocket
      receiverSocket.on('Chatroom-message', (data) => {
        expect(data.message).toBe(testMessage);
        expect(data.userName).toBe(userName);
        resolve();
      });
  
      // emit send event from clientSocket
      clientSocket.emit('send-message', roomName, testMessage);
    });
  });
});
//user disconnect test
describe('Socket.IO User Disconnect Test', () => {
  let clientSocket;
  let receiverSocket;

  beforeAll((done) => {
    clientSocket = ioClient.connect('https://localhost:3000', {
      rejectUnauthorized: false // 暫時忽略 self signed certificate
    });
    receiverSocket = ioClient.connect('https://localhost:3000', {
      rejectUnauthorized: false // 暫時忽略 self signed certificate
    });

    clientSocket.on('connect', () => {
      receiverSocket.on('connect', done);// close while trying
    });
  });

  afterAll(async () => {
    clientSocket.disconnect();
    receiverSocket.disconnect();
    await mongoose.connection.close();
  });

  it('should annouce user disconnects', async () => {
    const roomName = 'TestRoom';
    const userName = 'Eric';

    // two users join the room
    clientSocket.emit('new-user join', roomName, userName);
    receiverSocket.emit('new-user join', roomName, 'tester');

    await new Promise((resolve) => {
      // listen for the user-disconnected event on receiverSocket
      receiverSocket.on('user-disconnected', (disconnectedUserName) => {
        expect(disconnectedUserName).toBe(userName);
        resolve();
      });
  
      // disconnect clientSocket to trigger the user-disconnected event
      clientSocket.disconnect();
    });
  });
});