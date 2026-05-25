declare global {
  var __TEST__: boolean;
  var __TEST_START_TIME__: number;
  var __TEST_DB__: {
    connections: Set<unknown>;
    mockQuery: (...args: unknown[]) => unknown;
    mockConnect: (...args: unknown[]) => unknown;
    mockDisconnect: (...args: unknown[]) => unknown;
  };
  var __TEST_API__: {
    mockFetch: (...args: unknown[]) => unknown;
  };
  var __TEST_FS__: {
    mockReadFile: (...args: unknown[]) => unknown;
    mockWriteFile: (...args: unknown[]) => unknown;
    mockExistsSync: (...args: unknown[]) => boolean;
    mockMkdirSync: (...args: unknown[]) => unknown;
    mockRmSync: (...args: unknown[]) => unknown;
  };
  var __TEST_EXPRESS__: {
    createMockRequest: (overrides?: Record<string, unknown>) => Record<string, unknown>;
    createMockResponse: () => {
      status: (...args: unknown[]) => unknown;
      json: (...args: unknown[]) => unknown;
      send: (...args: unknown[]) => unknown;
      sendStatus: (...args: unknown[]) => unknown;
      redirect: (...args: unknown[]) => unknown;
      cookie: (...args: unknown[]) => unknown;
      clearCookie: (...args: unknown[]) => unknown;
      setHeader: (...args: unknown[]) => unknown;
      getHeader: (...args: unknown[]) => unknown;
      locals: Record<string, unknown>;
      statusCode: number;
    };
  };
}

export {};
