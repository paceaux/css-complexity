import {
	describe, it, after, before,
} from 'node:test';
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

html body#page > article.main {
	color: red;
}
form fieldset input[type="text"] {
	color: green;
}

header h1 a:hover {
	color: yellow;
}
`;

const sampleCSSMediaQuery1 = `
@media screen and (min-width: 480px) {
	${sampleCSSBasic}
}
`;
const sampleCSSMediaQuery2 = `
${sampleCSSMediaQuery1}
@media screen and (min-height: 680px) and (orientation: portrait) {
	${sampleCSSBasic}
}
`;

const testFileNameBasic = 'weight-test.css';
const testFileNameMediaQuery1 = 'weight-test-mq1.css';
const testFileNameMediaQuery2 = 'weight-test-mq2.css';

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
	describe('cssRuleWeights', () => {
		it('has a static property that gets cssRules with weights', () => {
			const parsedCSS = CSSReader.getParsedCSS(sampleCSSBasic);
			const cssRules = CSSReader.getCSSRules(parsedCSS);
			const weightedRules = CSSReader.getWeightedCSSRules(cssRules);
			const [first, , , fourth, fifth, sixth] = weightedRules;
			assert.equal(weightedRules.length, 6);
			assert.equal(first.selectorComplexity, 1);
			assert.equal(fourth.selectorComplexity, 6);
			assert.equal(fifth.selectorComplexity, 4);
			assert.equal(sixth.selectorComplexity, 4);
		});
	});
});
