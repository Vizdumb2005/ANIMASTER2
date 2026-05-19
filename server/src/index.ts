import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import interpretRouter from './routes/interpret.js';
import mutateRouter from './routes/mutate.js';
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
app.use('/ai', aiRouter);

app.use((_request, response) => {
  response.status(404).json({ error: 'Not found' });
});

if (process.env.NODE_ENV !== 'test') {
  providerRegistry.initializeFromEnv().then(() => {
    app.listen(port, () => {
      console.log(`Animaster server listening on http://localhost:${port}`);
    });
  }).catch((err: unknown) => {
    console.error('Failed to initialize AI providers:', err);
    app.listen(port, () => {
      console.log(`Animaster server listening on http://localhost:${port} (AI providers failed to init)`);
    });
  });
}

export default app;
