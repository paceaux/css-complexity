import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
	LOG_FILE_NAME,
	DEFAULT_OUTPUT_FILE,
} from '../src/constants.js';

describe('constants', () => {
	it('has a log file', () => {
		assert.equal(typeof LOG_FILE_NAME, 'string');
		assert.ok(LOG_FILE_NAME);
		assert.equal(LOG_FILE_NAME, 'log.txt');
	});
	it('has an output file', () => {
		assert.equal(typeof DEFAULT_OUTPUT_FILE, 'string');
		assert.ok(DEFAULT_OUTPUT_FILE);
		assert.equal(DEFAULT_OUTPUT_FILE, 'complexity.json');
	});
});
