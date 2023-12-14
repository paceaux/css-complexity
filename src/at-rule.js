class AtRule {
	static ruleTypeRegex = /@\w+/;

	static atTypes = [
		'charset',
		'counter-style',
		'document',
		'font-face',
		'font-feature-values',
		'import',
		'keyframes',
		'layer', // DANGER, CSSOM DOESN'T SUPPORT THIS
		'media',
		'name-space',
		'page',
		'property',
		'scope',
		'starting-style',
		'supports',
	];

	static conditionalAtTypes = [
		'media',
		'scope',
		'starting-style',
		'supports',
		'document',
	];

	static mediaTypes = [
		'all',
		'aural',
		'braille',
		'embossed',
		'handheld',
		'print',
		'projection',
		'screen',
		'tty',
		'tv',
		'presentation',
	];

	static operators = [
		'and',
		'not',
		'only',
		'or',
		',',
	];

	/**
	* @typedef RegExQuery
	* @type {RegExp}
	* @description A regular expression for matching media query types
	*/
	static atTypeRegex = new RegExp(`(${AtRule.atTypes.join('|')})`, 'i');

	/**
	* @typedef RegExQuery
	* @type {RegExp}
	* @description A regular expression for matching specifically conditional at rules
	*/
	static conditionalAtTypeRegex = new RegExp(`(${AtRule.conditionalAtTypes.join('|')})`, 'i');

	/**
	* @typedef RegExQuery
	* @type {RegExp}
	* @description A regular expression for matching media query types
	*/
	static mediaTypeRegex = new RegExp(`(${AtRule.mediaTypes.join('|')})`, 'i');

	/**
	* @typedef RegExQuery
	* @type {RegExp}
	* @description A regular expression for matching at-rule types
	*/
	static operatorRegex = new RegExp(`(${AtRule.operators.join('|')})`, 'i');

	/**
	 * @param  {string} atRule=''
	 * @param  {object} dependencies={}
	 */
	constructor(atRule = '', dependencies = {}) {
		this.dependencies = dependencies;

		if (atRule) {
			this.atRule = AtRule.sanitizeAtRule(atRule);
		}
	}

	/**
	 * @description separates the @ from the word and returns the word
	 * @param  {string} atRuleString
	 * @returns {string|undefined} the type of at-rule (whatever it starts with, but with @ removed)
	 */
	static getAtRuleType(atRuleString) {
		if (!atRuleString) return undefined;
		const sanitized = AtRule.sanitizeAtRule(atRuleString);
		const atRule = sanitized.match(AtRule.ruleTypeRegex)[0];
		return atRule.replace('@', '');
	}

	/**
	 * @description gets specifically the condition text from an at-rule
	 * @param  {string} atRuleString
	 * @returns {string|undefined} the condition of the at-rule
	 */
	static getConditionText(atRuleString) {
		if (!atRuleString) return undefined;
		const sanitized = AtRule.sanitizeAtRule(atRuleString);
		const atRuleType = AtRule.getAtRuleType(sanitized);
		const condition = atRuleString.split(atRuleType)[1].trim();
		return condition;
	}

	/**
	 * @description sanitizes an at-rule
	 * @param  {string} rule
	 * @returns {string} sanitized rule (lowercased, doublespaces removed, all extraneous spacing removed)
	 */
	static sanitizeAtRule(rule) {
		if (typeof rule !== 'string') throw new Error('condition must be a string');

		const sanitizedRule = rule
			.toLowerCase()
			.replace(/\s{2,}/g, ' ') // remove double spaces or more
			.replace('( ', '(')
			.replace(' )', ')')
			.replace(/\s?:\s?/g, ':') // remove spaces around :
			.trim();

		return sanitizedRule;
	}

	/**
	 * @typedef Token
	 * @type {object}
	 * @property {string} type - the type of token (at, feature, operator)
	 * @property {string} value - the value of the token
	 * @property {boolean} isConditional - whether or not the token is conditional
	 */
	/**
	 * @description specifically creates a token from an at rule
	 * @param  {string} atType
	 * @returns {Token|null}
	 */
	static tokenizeAtType(atType) {
		if (!atType) return null;
		let token = null;
		const sanitized = AtRule.sanitizeAtRule(atType);
		const atString = AtRule.getAtRuleType(sanitized);
		const isMatch = AtRule.atTypeRegex.test(atString);
		if (isMatch) {
			token = {
				type: 'at',
				value: atString,
				isConditional: false,
			};
			if (AtRule.conditionalAtTypeRegex.test(atString)) {
				token.isConditional = true;
			}
		}
		return token;
	}

	static tokenizeAtRule(atRule) {
		if (typeof atRule !== 'string') throw new Error('atRule must be a string');
		const sanitized = AtRule.sanitizeAtRule(atRule);
		const split = sanitized.split(' ');

		const tokens = split.map((token) => {
			if (AtRule.atTypeRegex.test(token)) {
				return AtRule.tokenizeAtType(token);
			}
			if (AtRule.mediaTypeRegex.test(token)) {
				return {
					type: 'feature',
					value: token,
				};
			}
			if (AtRule.operatorRegex.test(token)) {
				return {
					type: 'operator',
					value: token,
				};
			}
			if (token.includes('(') && token.includes(')')) {
				return {
					type: 'feature',
					value: token,
					isRange: true,
				};
			}
			return null;
		}).filter((token) => token !== null);

		return tokens;
	}

	get atRuleType() {
		return AtRule.getAtRuleType(this.atRule);
	}

	get conditionText() {
		return AtRule.getConditionText(this.atRule);
	}

	get atRuleWeight() {
		const tokens = AtRule.tokenizeAtRule(this.atRule);
		let weight = 0;

		tokens.forEach((token) => {
			if (token.type === 'at') {
				weight += 1;
			}

			if (token.type === 'feature' && !token.isRange) {
				weight += 1;
			}
			if (token.type === 'operator') {
				weight += 1;
			}
		});
		return weight;
	}
}

export default AtRule;
