// Server test setup file
// This file runs before each test file

import { vi } from 'vitest';
import dotenv from 'dotenv';

// Load environment variables from .env.test if available, otherwise from .env
dotenv.config({ path: '.env.test' });
dotenv.config();

// Mock database connections
globalThis.__TEST_DB__ = {
  connections: new Set(),
  mockQuery: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  mockConnect: vi.fn().mockResolvedValue({}),
  mockDisconnect: vi.fn().mockResolvedValue({}),
};

// Mock external API calls
globalThis.__TEST_API__ = {
  mockFetch: vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(''),
  }),
};

// Mock time-based functions for consistent testing
const originalDate = global.Date;

class MockDate extends Date {
  constructor() {
    super('2024-01-01T00:00:00.000Z'); // Fixed date for consistent testing
  }
}

global.Date = MockDate as unknown as typeof Date;

// Restore original Date after tests
vi.stubGlobal('Date', MockDate);

// Mock console methods for cleaner test output
const originalConsole = {...console};

console.error = vi.fn((...args) => {
  originalConsole.error(...args);
});

console.warn = vi.fn((...args) => {
  originalConsole.warn(...args);
});

console.info = vi.fn((...args) => {
  originalConsole.info(...args);
});

console.debug = vi.fn((...args) => {
  originalConsole.debug(...args);
});

// Mock process.env for testing
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('PORT', '3001'); // Different port for tests
vi.stubEnv('DEBUG', 'false');

// Mock crypto for consistent hashing in tests
vi.stubGlobal('crypto', {
  randomUUID: vi.fn().mockReturnValue('test-uuid-1234-5678-9012-345678901234'),
  randomBytes: vi.fn().mockReturnValue(Buffer.from('test-random-bytes')),
});

// Mock timers for async testing
vi.useFakeTimers();

// Mock filesystem operations if needed
vi.stubGlobal('__TEST_FS__', {
  mockReadFile: vi.fn(),
  mockWriteFile: vi.fn(),
  mockExistsSync: vi.fn().mockReturnValue(true),
  mockMkdirSync: vi.fn(),
  mockRmSync: vi.fn(),
});

// Add global test utilities
globalThis.__TEST__ = true;
globalThis.__TEST_START_TIME__ = Date.now();

// Mock Express request/response objects for route testing
globalThis.__TEST_EXPRESS__ = {
  createMockRequest: (overrides = {}) => ({
    headers: {},
    body: {},
    query: {},
    params: {},
    cookies: {},
    signedCookies: {},
    user: null,
    session: {},
    ...overrides,
  }),
  
  createMockResponse: () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      sendStatus: vi.fn().mockReturnThis(),
      redirect: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
      getHeader: vi.fn(),
      locals: {} as Record<string, unknown>,
      statusCode: 200,
    };
    
    res.json.mockImplementation((data) => {
      res.locals.lastJson = data;
      return res;
    });
    
    res.send.mockImplementation((data) => {
      res.locals.lastSend = data;
      return res;
    });
    
    res.status.mockImplementation((code) => {
      res.statusCode = code;
      return res;
    });
    
    return res;
  },
};

console.info('Server test setup completed successfully');