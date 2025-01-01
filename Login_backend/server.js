import dotenv from 'dotenv';
dotenv.config(); 

import http from 'http';
import app from './app.js';

const server = http.createServer(app);
const port = process.env.PORT || 8000; // Make sure the environment variable is uppercase (standard convention)

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
 