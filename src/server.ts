import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import connectDB from './config/db';
import { createServer } from 'http';
import { initChatGateway } from './realtime/chat.gateway';

connectDB();

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);
initChatGateway(httpServer);

httpServer.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
