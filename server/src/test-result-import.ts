import { Result, ok, err } from './types/result.js';

const test: Result<string, Error> = ok("hello");
console.log(test);