import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from './index.js';
import type { Server } from 'http';

describe('Deep Health Check API', () => {
  let server: Server;
  let port: number;

  beforeAll(() => {
    return new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          port = address.port;
        }
        resolve();
      });
    });
  });

  afterAll(() => {
    return new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('should return deep health data with expected structure', async () => {
    const res = await fetch(`http://localhost:${port}/health/deep`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('aiProviders');
    expect(data).toHaveProperty('websocket');
    expect(data).toHaveProperty('memory');
    
    expect(data.websocket).toHaveProperty('running');
    expect(data.websocket).toHaveProperty('connectedClients');
    
    expect(data.memory).toHaveProperty('sceneMemoryEntries');
    expect(data.memory).toHaveProperty('cinematicMemory');
  });
});
