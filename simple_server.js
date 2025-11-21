const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World!');
});

server.listen(5004, () => {
  console.log('Simple server running on port 5004');
});