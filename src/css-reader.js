import { promises } from 'fs';
import cssom from 'cssom';

import { LOG_FILE_NAME } from './constants.js';
import Log from './logger.js';

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
			parsedCSS = cssom.parse(this.rawCSS);
		}

		return parsedCSS;
	}

	static getCSSSelectors(parsedCSS) {
		let selectorList = [];

		if (!parsedCSS || !parsedCSS.cssRules) {
			throw new Error('parsedCSS not provided or CSSRules not present');
		}

		const { cssRules } = parsedCSS;

		selectorList = [...cssRules]
			.map((cssRule) => {
				let selectorText = null;

				if (cssRule.selectorText) {
					selectorText = cssRule.selectorText;
				}

				if (cssRule.cssRules) {
					const nestedSelectors = CSSReader.getCSSSelectors(cssRule);
					if (nestedSelectors.length) {
						selectorText = nestedSelectors;
					}
				}
				return selectorText;
			})
			.flat(Infinity);
		const selectors = [...new Set(selectorList)].filter((item) => item);

		return selectors;
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
}
