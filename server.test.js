const request = require('supertest');
// const server = require('./server');
let server;

beforeAll(() => {
  server = require('./server'); // 這個檔案應該導出你的服務器實例
});

afterAll((done) => {
  server.close(done); // 關閉服務器
});

//example
describe('Test GET/', () => {
    it('should respond with 200 status code', () => {
        const response = 200;
        expect(response).toBe(200);
    })
});
//
describe('GET /', () => {
    it('should respond with a 200 status code', async() => {
        const response = await request(server).get('/');
        expect(response.statusCode).toBe(200);
    });
});