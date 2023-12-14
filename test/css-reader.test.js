import { describe, it, after, before } from 'node:test';
import assert from 'node:assert';
import { promises } from 'fs';

import Logger from '../src/logger.js';
import CSSReader from '../src/css-reader.js';
import Outputter from '../src/outputter.js';

const logger = new Logger('test.log.txt');
const outputter = new Outputter('', logger);

const sampleCSSBasic = `
body {
    color: blue;
}
[class] {
    outline: 1px solid blue;
}
#heading {
    font-size: 2em;
    line-height: 2;
}
h2, h3 {
  font-weight: bold;
}
.title.small {
    display: none;
}`;

const sampleCSSMediaQuery1 = `
@media screen and (min-width: 480px) {
	${sampleCSSBasic}
}
`;
const sampleCSSMediaQuery2 = `
${sampleCSSMediaQuery1}
@media (min-height: 680px), screen and (orientation: portrait) {
	${sampleCSSBasic}
}
`;

const testFileNameBasic = 'test.css';
const testFileNameMediaQuery1 = 'test-mq1.css';
const testFileNameMediaQuery2 = 'test-mq2.css';
const testFilenameLayer1 = 'test-layer1.css';

describe('CSS Reader', () => {
	before(async () => {
		// create a test CSS file
		await outputter.writeFileAsync(sampleCSSBasic, testFileNameBasic);
		await outputter.writeFileAsync(sampleCSSMediaQuery1, testFileNameMediaQuery1);
		await outputter.writeFileAsync(sampleCSSMediaQuery2, testFileNameMediaQuery2);
	});
	after(async () => {
		// remove test css file
		await promises.unlink(testFileNameBasic);
		await promises.unlink(testFileNameMediaQuery1);
		await promises.unlink(testFileNameMediaQuery2);
		// await promises.unlink(logger.logFile);
	});
	describe('instantiation', () => {
		it('It sets a filename prop', () => {
			const cssReader = new CSSReader(testFileNameBasic);
			assert.equal(cssReader.fileName, testFileNameBasic);
		});
	});

	describe('rawCSS', () => {
		it('no rawCSS when instantiated', () => {
			const cssReader = new CSSReader(testFileNameBasic);

			assert.equal(cssReader.rawCSS, undefined);
		});
		it('rawCSS happens when a file is read', async () => {
			const cssReader = new CSSReader(testFileNameBasic);
			await cssReader.readFileAsync();
			assert.ok(cssReader.rawCSS);
		});
		it('rawCSS can be set', async () => {
			const cssReader = new CSSReader();
			cssReader.setRawCSS(sampleCSSBasic);
			assert.ok(cssReader.rawCSS);
			assert.equal(cssReader.rawCSS, sampleCSSBasic);
		});
	});
	describe('readingFile', () => {
		it('readFileContents: reads file', async () => {
			const fileContents = await CSSReader.readFileContents(testFileNameBasic);
			assert.equal(fileContents, sampleCSSBasic);
		});
		it('readFileContents: null with empty file', async () => {
			const fileContents = await CSSReader.readFileContents('foo');
			assert.equal(fileContents, null);
		});
		it('readFileContents: throws without filename', async () => {
			// await expect(CSSReader.readFileContents()).rejects.toThrow();
			assert.rejects(CSSReader.readFileContents());
		});
		it('readFileAsync: returns rawCSS and sets it as prop', async () => {
			const cssReader = new CSSReader(testFileNameBasic);
			const fileContents = await cssReader.readFileAsync(testFileNameBasic);
			assert.equal(fileContents, sampleCSSBasic);
			assert.equal(cssReader.rawCSS, sampleCSSBasic);
		});
		it('readFileAsync: without a file, it fails', async () => {
			const cssReader = new CSSReader();
			// await expect(cssReader.readFileAsync()).rejects.toThrow();
			assert.rejects(cssReader.readFileAsync());
		});
	});

	describe('parsingCSS', () => {
		it('has parsedCSS', async () => {
			const cssReader = new CSSReader(testFileNameBasic);
			await cssReader.readFileAsync();
			assert.ok(cssReader.parsedCSS);
		});
		it('doesn\'t have parsedCSS on an empty file (i.e. readFileAsync did not run)', async () => {
			const cssReader = new CSSReader(testFileNameBasic);
			assert.equal(cssReader.parsedCSS, undefined);
		});
		it('has cssRules in parsedCSS', async () => {
			const cssReader = new CSSReader(testFileNameBasic);
			await cssReader.readFileAsync();
			assert.ok(cssReader.parsedCSS);
			assert.ok(cssReader.parsedCSS.cssRules);
			assert.equal(cssReader.parsedCSS.cssRules.length > 0, true);
		});
	});
	describe('selectors', () => {
		it('returns selectors', async () => {
			const cssReader = new CSSReader(testFileNameBasic);
			await cssReader.readFileAsync();

			// expect(cssReader).toHaveProperty('selectors');
			assert.ok(cssReader.selectors);
			assert.equal(cssReader.selectors.length > 3, true);
			// expect(cssReader.selectors.length).toBeGreaterThan(3);
		});
		it('has the correct selectors', async () => {
			const cssReader = new CSSReader(testFileNameBasic);
			await cssReader.readFileAsync();

			// expect(cssReader.selectors).toEqual(expect.arrayContaining(['body', '[class]', '#heading', 'h2, h3']));
			assert.equal(cssReader.selectors.includes('body'), true);
			assert.equal(cssReader.selectors.includes('[class]'), true);
			assert.equal(cssReader.selectors.includes('#heading'), true);
			assert.equal(cssReader.selectors.includes('h2, h3'), true);
		});
		it('removes duplicate selectors', async () => {
			const cssReader = new CSSReader(testFileNameBasic);
			const duplicatedCSS = sampleCSSBasic + sampleCSSBasic;
			cssReader.setRawCSS(duplicatedCSS);

			assert.ok(cssReader.selectors);
			assert.equal(cssReader.selectors.length, 5);
		});
	});
	describe('at rules', () => {
		it('has parsed css with a single media query', async () => {
			const cssReader = new CSSReader(testFileNameMediaQuery1);
			await cssReader.readFileAsync();
			assert.ok(cssReader.parsedCSS);
			assert.equal(cssReader.atRules.length, 1);
		});
		it('has parsed css with two media queries', async () => {
			const cssReader = new CSSReader(testFileNameMediaQuery2);
			await cssReader.readFileAsync();
			assert.ok(cssReader.parsedCSS);
			assert.equal(cssReader.atRules.length, 2);
		});
	});
});
