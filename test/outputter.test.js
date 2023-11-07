import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import { promises } from 'fs';

import Outputter from '../src/outputter.js';
import Logger from '../src/logger.js';

const testFileName = 'test.txt';
const customFileName = 'custom';
const testString = 'test information';
const testData = { information: 'test' };
const testLogger = new Logger('test.log.txt');

describe('Outputter', () => {
	describe('properties', () => {
		const outputter = new Outputter(testFileName, testLogger);
		it('has a default output file', () => {
			assert.match(outputter.defaultOutputFile, new RegExp(`${testFileName}`));
		});
	});
	describe('writeFileAsync', () => {
		const outputter = new Outputter(testFileName, testLogger);

		after(async () => {
			await promises.unlink(testFileName);
		});
		it('it writes data to a file', async () => {
			await outputter.writeFileAsync(testString, testFileName);

			const fileContents = await promises.readFile(testFileName, { encoding: 'utf-8' });

			assert.match(fileContents, new RegExp(`${testString}`));
		});
		it('an error happens when it doesn\'t have data ', async () => {
			await assert.rejects(
				outputter.writeFileAsync(undefined, testFileName),
				{
					name: 'Error',
					message: 'No data or filename provided',
				},
			);
		});
		it('an error happens when it doesn\'t have a filename ', async () => {
			await assert.rejects(
				outputter.writeFileAsync(testString),
				{
					name: 'Error',
					message: 'No data or filename provided',
				},
			);
		});
		it('an error happens when it doesn\'t have a filename or data ', async () => {
			await assert.rejects(
				outputter.writeFileAsync(),
				{
					name: 'Error',
					message: 'No data or filename provided',
				},
			);
		});
	});
	describe('writeDataAsync', () => {
		const outputter = new Outputter(testFileName, testLogger);

		after(async () => {
			await promises.unlink(testFileName);
			await promises.unlink(`${customFileName}.${testFileName}`);
		});
		it('it writes data to a file', async () => {
			await outputter.writeDataAsync(testData, testFileName);

			const fileContents = await promises.readFile(testFileName, { encoding: 'utf-8' });

			assert.match(fileContents, new RegExp(`${JSON.stringify(testData, null, 2)}`));
		});
		it('it writes a custom filename ', async () => {
			await outputter.writeDataAsync(testData, customFileName);

			const fileContents = await promises.readFile(`${customFileName}.${testFileName}`, { encoding: 'utf-8' });

			assert.match(fileContents, new RegExp(`${JSON.stringify(testData, null, 2)}`));
		});
	});
});
