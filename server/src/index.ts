import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import interpretRouter from './routes/interpret.js';
import mutateRouter from './routes/mutate.js';
import liveMutateRouter from './routes/liveMutate.js';
import aiRouter from './routes/ai.js';
import { providerRegistry } from './ai/providers/providerRegistry.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use('/interpret', interpretRouter);
app.use('/mutate', mutateRouter);
app.use('/live-mutate', liveMutateRouter);
app.use('/ai', aiRouter);

app.use((_request, response) => {
  response.status(404).json({ error: 'Not found' });
});

// WebSocket server for real-time updates
const server = createServer(app);
const wss = new WebSocketServer({ server });
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('WebSocket client connected');
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket client disconnected');
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    clients.delete(ws);
  });
});

// Broadcast to all connected clients
function broadcastSceneUpdate(scene: unknown) {
  const message = JSON.stringify({ type: 'sceneUpdate', data: scene });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Export for use in routes
export { wss, broadcastSceneUpdate };

if (process.env.NODE_ENV !== 'test') {
  providerRegistry.initializeFromEnv().then(() => {
    server.listen(port, () => {
      console.log(`Animaster server listening on http://localhost:${port}`);
      console.log(`WebSocket server running on ws://localhost:${port}`);
    });
  }).catch((err: unknown) => {
    console.error('Failed to initialize AI providers:', err);
    server.listen(port, () => {
      console.log(`Animaster server listening on http://localhost:${port} (AI providers failed to init)`);
    });
  });
}

export default app;
