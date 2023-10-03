const request = require('supertest');
// const server = require('./server');
let server;

beforeAll(() => {
  server = require('./server'); // strating server
});

afterAll((done) => {
  server.close(done); // closing server
});

//
describe('GET /', () => {
    it('should respond with a 200 status code', async() => {
        const response = await request(server).get('/');
        expect(response.statusCode).toBe(200);
    });
});