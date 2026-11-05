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

const sampleCSSSupports = `
@supports (display: grid) and (gap: 1rem) {
	${sampleCSSBasic}
}
`;

const testFileNameBasic = 'weight-test.css';
const testFileNameMediaQuery1 = 'weight-test-mq1.css';
const testFileNameMediaQuery2 = 'weight-test-mq2.css';
const testFileNameSupports = 'weight-test-supports.css';

describe('CSS Reader', () => {
	before(async () => {
		// create a test CSS file
		await outputter.writeFileAsync(sampleCSSBasic, testFileNameBasic);
		await outputter.writeFileAsync(sampleCSSMediaQuery1, testFileNameMediaQuery1);
		await outputter.writeFileAsync(sampleCSSMediaQuery2, testFileNameMediaQuery2);
		await outputter.writeFileAsync(sampleCSSSupports, testFileNameSupports);
	});
	after(async () => {
		// remove test css file
		await promises.unlink(testFileNameBasic);
		await promises.unlink(testFileNameMediaQuery1);
		await promises.unlink(testFileNameMediaQuery2);
		await promises.unlink(testFileNameSupports);
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

		it('rules without media queries have atRuleWeight of 0', () => {
			const parsedCSS = CSSReader.getParsedCSS(sampleCSSBasic);
			const cssRules = CSSReader.getCSSRules(parsedCSS);
			const weightedRules = CSSReader.getWeightedCSSRules(cssRules);

			weightedRules.forEach((rule) => {
				assert.equal(rule.atRuleWeight, 0);
			});
		});

		it('rules without media queries have totalComplexity equal to selectorComplexity', () => {
			const parsedCSS = CSSReader.getParsedCSS(sampleCSSBasic);
			const cssRules = CSSReader.getCSSRules(parsedCSS);
			const weightedRules = CSSReader.getWeightedCSSRules(cssRules);

			weightedRules.forEach((rule) => {
				assert.equal(rule.totalComplexity, rule.selectorComplexity);
			});
		});

		it('rules inside a single media query have correct atRuleWeight', () => {
			const parsedCSS = CSSReader.getParsedCSS(sampleCSSMediaQuery1);
			const cssRules = CSSReader.getCSSRules(parsedCSS);
			const weightedRules = CSSReader.getWeightedCSSRules(cssRules);

			// @media screen and (min-width: 480px) has weight of 3
			// 1 for @media, 1 for screen, 1 for (min-width: 480px)
			weightedRules.forEach((rule) => {
				assert.equal(rule.atRuleWeight, 3);
			});
		});

		it('rules inside a single media query have correct totalComplexity', () => {
			const parsedCSS = CSSReader.getParsedCSS(sampleCSSMediaQuery1);
			const cssRules = CSSReader.getCSSRules(parsedCSS);
			const weightedRules = CSSReader.getWeightedCSSRules(cssRules);
			const [first, , , fourth, fifth, sixth] = weightedRules;

			// Each rule's totalComplexity = selectorComplexity + atRuleWeight
			// atRuleWeight is 3 for all rules in this media query
			assert.equal(first.totalComplexity, 1 + 3); // body: 1 + 3 = 4
			assert.equal(fourth.totalComplexity, 6 + 3); // html body#page > article.main: 6 + 3 = 9
			assert.equal(fifth.totalComplexity, 4 + 3); // form fieldset input[type="text"]: 4 + 3 = 7
			assert.equal(sixth.totalComplexity, 4 + 3); // header h1 a:hover: 4 + 3 = 7
		});

		it('rules inside multiple media queries have correct atRuleWeight', () => {
			const parsedCSS = CSSReader.getParsedCSS(sampleCSSMediaQuery2);
			const cssRules = CSSReader.getCSSRules(parsedCSS);
			const weightedRules = CSSReader.getWeightedCSSRules(cssRules);

			// First 6 rules are from first media query: @media screen and (min-width: 480px)
			// Weight: 1 (@media) + 1 (screen) + 1 (and) = 3
			// Note: (min-width: 480px) is a range feature and doesn't add to weight
			const firstSixRules = weightedRules.slice(0, 6);
			firstSixRules.forEach((rule) => {
				assert.equal(rule.atRuleWeight, 3);
			});

			// Next 6 rules are from second media query:
			// @media screen and (min-height: 680px) and (orientation: portrait)
			// Weight: 1 (@media) + 1 (screen) + 1 (and) + 1 (and)
			//        + 1 (orientation:portrait tokenized as operator) = 5
			// Note: (min-height: 680px) is a range feature and doesn't add to weight
			const nextSixRules = weightedRules.slice(6, 12);
			nextSixRules.forEach((rule) => {
				assert.equal(rule.atRuleWeight, 5);
			});
		});

		it('totalComplexity combines selector and at-rule weights correctly', () => {
			const parsedCSS = CSSReader.getParsedCSS(sampleCSSMediaQuery2);
			const cssRules = CSSReader.getCSSRules(parsedCSS);
			const weightedRules = CSSReader.getWeightedCSSRules(cssRules);

			weightedRules.forEach((rule) => {
				assert.equal(
					rule.totalComplexity,
					rule.selectorComplexity + rule.atRuleWeight,
					`totalComplexity should equal selectorComplexity + atRuleWeight for selector: ${rule.selectorText}`,
				);
			});
		});

		it('rules inside @supports have correct atRuleWeight', () => {
			const parsedCSS = CSSReader.getParsedCSS(sampleCSSSupports);
			const cssRules = CSSReader.getCSSRules(parsedCSS);
			const weightedRules = CSSReader.getWeightedCSSRules(cssRules);

			// @supports (display: grid) and (gap: 1rem)
			// Weight: 1 (@supports) + 1 (and) = 2
			// Note: features (display: grid) and (gap: 1rem) are range features
			// and don't add to weight
			weightedRules.forEach((rule) => {
				assert.equal(rule.atRuleWeight, 2);
			});
		});

		it('rules inside @supports have correct totalComplexity', () => {
			const parsedCSS = CSSReader.getParsedCSS(sampleCSSSupports);
			const cssRules = CSSReader.getCSSRules(parsedCSS);
			const weightedRules = CSSReader.getWeightedCSSRules(cssRules);
			const [first, , , fourth, fifth, sixth] = weightedRules;

			// Each rule's totalComplexity = selectorComplexity + atRuleWeight
			// atRuleWeight is 2 for all rules in this @supports
			assert.equal(first.totalComplexity, 1 + 2); // body: 1 + 2 = 3
			assert.equal(fourth.totalComplexity, 6 + 2); // html body#page > article.main: 6 + 2 = 8
			assert.equal(fifth.totalComplexity, 4 + 2); // form fieldset input[type="text"]: 4 + 2 = 6
			assert.equal(sixth.totalComplexity, 4 + 2); // header h1 a:hover: 4 + 2 = 6
		});
	});
});
