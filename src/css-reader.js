import { promises } from 'fs';
import cssom from 'cssom';

import { LOG_FILE_NAME } from './constants.js';
import Log from './logger.js';
import Selector from './selector.js';
import AtRule from './at-rule.js';

const log = new Log(LOG_FILE_NAME);

/**
 * @class CSSReader
 * @classdesc reads CSS (usually a file) and parses it with CSSOM
 */
export default class CSSReader {
	/**
   * @property {null|string} CSS extracted from a file
   */
	rawCSS = null;

	/**
   * @param  {string} fileName name of a file to start with
   */
	constructor(fileName) {
		if (fileName) {
			this.fileName = fileName;
		}
	}

	/**
   * @param  {string} fileName name of a file
   * @returns {string} the contents of the file on the filesystem
   */
	static async readFileContents(fileName) {
		let contents = null;

		if (!fileName) {
			throw new Error('FileName not provided');
		}
		try {
			contents = await promises.readFile(fileName, 'utf8');
		} catch (getFileError) {
			await log.errorToFileAsync(getFileError);
		}

		return contents;
	}

	static getParsedCSS(rawCSS) {
		let parsedCSS;

		if (rawCSS) {
			try {
				parsedCSS = cssom.parse(rawCSS);
			} catch (parseError) {
				// the CSSOM package hasn't been updated in 2 years; it doesn't know about @layers.
				log.errorToFileAsync('Error parsing CSS; there is something wrong with the CSS passed in');
				log.errorToFileAsync(parseError);
			}
		}

		return parsedCSS;
	}

	/**
   * @method
   * @description reads the file specified in the constructor and sets the result to the rawContents property
   * @returns {null|string} the contents of the file on the filesystem
   */
	async readFileAsync() {
		let fileContents = null;
		try {
			fileContents = await CSSReader.readFileContents(this.fileName);
			this.setRawCSS(fileContents);
		} catch (readFileError) {
			await log.errorToFileAsync(readFileError);
			throw (readFileError);
		}
		return fileContents;
	}

	/**
   * @method
   * @description takes the string and sets it to the rawCSS property
   * @param  {string} rawCSS
   */
	setRawCSS(rawCSS) {
		if (rawCSS) {
			this.rawCSS = rawCSS;
		}
	}

	/**
   * @property {cssom.CSSStyleSheet} parsedCSS - the CSS parsed by CSSOM
   */
	get parsedCSS() {
		let parsedCSS;

		if (this.rawCSS) {
			parsedCSS = CSSReader.getParsedCSS(this.rawCSS);
		}

		return parsedCSS;
	}
	/**
	 * @param  {CSSStyleSheet} parsedCSS
	 * @returns {CSSRule[]}
	 */

	static getCSSRules(parsedCSS) {
		let ruleList = [];

		if (!parsedCSS || !parsedCSS.cssRules) {
			throw new Error('parsedCSS not provided or CSSRules not present');
		}

		const { cssRules } = parsedCSS;

		ruleList = [...cssRules]
			.map((cssRule) => {
				let rule = null;

				if (cssRule.selectorText) {
					rule = cssRule;
				}

				if (cssRule.cssRules) {
					const nestedSelectors = CSSReader.getCSSRules(cssRule);
					if (nestedSelectors.length) {
						rule = nestedSelectors;
					}
				}
				return rule;
			})
			.flat(Infinity);
		const selectors = [...new Set(ruleList)].filter((item) => item);

		return selectors;
	}

	/**
	 * @typedef {CSSRule} WeightedCSSRule
	 * @property {Selector} selectorWeight
	 */

	/**
	 * @description Recursively walks up the parentRule chain and collects all parent rules
	 * @param  {CSSRule} cssRule
	 * @returns {CSSGroupingRule[]} array of parent rules from immediate parent to top-level
	 */
	static getParentRules(cssRule) {
		const parentRules = [];
		let currentRule = cssRule;

		while (currentRule?.parentRule) {
			parentRules.push(currentRule.parentRule);
			currentRule = currentRule.parentRule;
		}

		return parentRules;
	}

	/**
	 * @description Constructs an at-rule string from a CSSGroupingRule
	 * @param  {CSSGroupingRule} groupingRule
	 * @returns {string|null} the at-rule string (e.g., "@media screen and (min-width: 480px)")
	 */
	static getAtRuleString(groupingRule) {
		if (!groupingRule) return null;

		const atType = groupingRule.name || 'media';
		const condition = groupingRule.conditionText || '';

		return `@${atType} ${condition}`.trim();
	}

	/**
	 * @description Calculates the total at-rule weight for a CSS rule by walking up parent rules
	 * @param  {CSSRule} cssRule
	 * @returns {number} the sum of all parent at-rule weights
	 */
	static getAtRuleWeight(cssRule) {
		const parentRules = CSSReader.getParentRules(cssRule);
		let totalWeight = 0;

		parentRules.forEach((parentRule) => {
			const atRuleString = CSSReader.getAtRuleString(parentRule);
			if (atRuleString) {
				const atRule = new AtRule(atRuleString);
				totalWeight += atRule.atRuleWeight;
			}
		});

		return totalWeight;
	}

	/**
	 * @param  {CSSRule[]} cssRules
	 * @returns {WeightedCSSRule[]} CSS rules with specificity, selectorComplexity, atRuleWeight, and totalComplexity
	 */
	static getWeightedCSSRules(cssRules) {
		const weightedRules = cssRules.map((cssRule) => {
			const cssSelector = new Selector(cssRule.selectorText);
			const { specificity, selectorComplexity } = cssSelector;
			const atRuleWeight = CSSReader.getAtRuleWeight(cssRule);
			const totalComplexity = selectorComplexity + atRuleWeight;

			const weightedRule = {
				...cssRule,
				specificity,
				selectorComplexity,
				atRuleWeight,
				totalComplexity,
			};
			return weightedRule;
		});

		return weightedRules;
	}

	/**
	 * Get the CSS Selectors from the CSS
	 * @param  {CSSStyleSheet} parsedCSS
	 * @returns {string[]}
	 */

	static getCSSSelectors(parsedCSS) {
		if (!parsedCSS || !parsedCSS.cssRules) {
			throw new Error('parsedCSS not provided or CSSRules not present');
		}

		const cssRules = CSSReader.getCSSRules(parsedCSS);
		const selectors = cssRules.map((cssRule) => cssRule.selectorText);
		const uniqueSelectors = [...new Set(selectors)];

		return uniqueSelectors;
	}

	/**
	 * Get the at-rules from the CSS (only the ones that wrap selectors)
	 * @param  {CSSStyleSheet} parsedCSS
	 * @returns {CSSGroupingRule[]}
	 */
	static getAtRules(parsedCSS) {
		let atRuleList = [];

		if (parsedCSS) {
			const rules = CSSReader.getCSSRules(parsedCSS);
			const rulesWithParents = rules.filter((rule) => rule?.parentRule);
			const atRules = rulesWithParents.map((rule) => {
				let atRule;
				if (rule?.parentRule?.name || rule?.parentRule?.conditionText) {
					atRule = rule.parentRule;
				}
				return atRule;
			});

			const filteredAtRules = atRules.filter((rule) => rule);

			atRuleList = [...new Set(filteredAtRules)];
		}

		return atRuleList;
	}

	/**
   * @property {string[]} selectors - the selectors found in the CSS
   */
	get selectors() {
		let selectors;

		if (this.parsedCSS) {
			selectors = CSSReader.getCSSSelectors(this.parsedCSS);
		}

		return selectors;
	}

	/**
	 * @property {CSSGroupingRule[]} atRules - the at-rules found in the CSS
	 */
	get atRules() {
		let atRuleList = [];

		if (this.parsedCSS) {
			atRuleList = CSSReader.getAtRules(this.parsedCSS);
		}

		return atRuleList;
	}
}
