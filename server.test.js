const request = require('supertest');
// const server = require('./server');
let server;

beforeAll(() => {
  server = require('./server'); // strating server
});

afterAll((done) => {
  server.close(done); // closing server
});

//index 
describe('GET /', () => {
  it('should respond with a 200 status code', async () => {
    const response = await request(server).get('/');
    expect(response.statusCode).toBe(200);
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
      expect(response.header.location).toBe('/');
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
