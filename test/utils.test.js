import { describe, it } from 'node:test';
import assert from 'node:assert';

import { convertMapToObject, jsonifyData } from '../src/utils.js';

describe('utils', () => {
	describe('convertMapToObject', () => {
		const testMap = new Map([['foo', 'bar']]);
		const testObject = { foo: 'bar' };
		it('returns the object if it is given an object', () => {
			const converted = convertMapToObject(testObject);

			assert.deepEqual(converted, testObject);
		});
		it('returns a map if given an object', () => {
			const converted = convertMapToObject(testMap);

			assert.deepEqual(converted, testObject);
		});
	});

	describe('jsonifyData', () => {
		it('converts object with old primitives to a formatted string', () => {
			const testObject = {
				string: 'string',
				number: 1,
				boolean: false,
				array: ['string'],
			};
			const converted = jsonifyData(testObject);

			assert.equal(converted, `{
  "string": "string",
  "number": 1,
  "boolean": false,
  "array": [
    "string"
  ]
}`);
		});
		it('converts a map to an object', () => {
			const testMap = new Map([['foo', 'string'], ['number', 1]]);

			const converted = jsonifyData(testMap);

			assert.equal(converted, `{
  "foo": "string",
  "number": 1
}`);
		});
	});
});
