import {
	describe, it, after,
} from 'node:test';
import assert from 'node:assert';

import { promises } from 'fs';

import Logger from '../src/logger.js';

describe('Logger', () => {
	const log = new Logger('test.log.txt');

	after(async () => {
		try {
			await promises.unlink('test.log.txt');
			console.info('removed test log file');
		} catch (cleanupError) {
			console.error(cleanupError);
		}
	});
	describe('Logger.styleInfo', () => {
		it('it makes a pretty block', () => {
			const styledInfo = Logger.styleInfo('A Test');

			assert.match(styledInfo, new RegExp(`
=============================
A Test
=============================`), 'gi');
		});
		it('it adds a timestamp when asked', () => {
			const styledInfo = Logger.styleInfo('A Test', true);

			const expectedResult = `
==============${new Date()}===============`;
			assert.equal(styledInfo.substr(0, 30), expectedResult.substr(0, 30));
		});
	});
	describe('timer', () => {
		it('startTimer', () => {
			log.startTimer();

			assert.equal(typeof log.timerStart, 'number');
			assert.equal(true, log.timerStart <= Date.now());
		});
		it('endTimer', () => {
			log.endTimer();

			assert.equal(typeof log.timerEnd, 'number');
			assert.equal(true, log.timerEnd <= Date.now());
			assert.equal(true, log.timerEnd >= log.timerStart);
		});
		it('elapsedTime', () => {
			log.endTimer();

			assert.equal(typeof log.elapsedTime, 'number');
			assert.equal(true, log.elapsedTime >= 0);
		});
		it('startTimer deletes the timerEnd property', () => {
			log.startTimer();
			assert.equal(undefined, log.timerEnd);
		});
	});
	describe('toConsole', () => {
		it('raw message', () => {
			const consoleInfo = 'test info';
			log.toConsole('test info');

			assert.match(log.rawMessage, new RegExp(`${consoleInfo}`));
		});
	});

	describe('Logger: writing to files', () => {
		it('it writes an error to a file', async () => {
			const error = new Error('test error');

			await log.errorToFileAsync(error);

			const fileContents = await promises.readFile('test.log.txt', { encoding: 'utf-8' });

			assert.match(fileContents, new RegExp(`${error.message}`));
		});

		it('it writes info to a file', async () => {
			const testInfo = 'test info';
			await log.infoToFileAsync('test info');
			const fileContents = await promises.readFile('test.log.txt', { encoding: 'utf-8' });

			assert.match(fileContents, new RegExp(`${testInfo}`));
		});
	});
});
