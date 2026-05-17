import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import interpretRouter from './routes/interpret.js';
import mutateRouter from './routes/mutate.js';

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

app.use((_request, response) => {
  response.status(404).json({ error: 'Not found' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Animaster server listening on http://localhost:${port}`);
  });
}

export default app;
