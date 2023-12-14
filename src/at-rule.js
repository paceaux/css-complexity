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
	 * @param  {string} atRuleString
	 * @returns {string|undefined} the type of at-rule (whatever it starts with, but with @ removed)
	 */
	static getAtRuleType(atRuleString) {
		if (!atRuleString) return undefined;
		const atRule = atRuleString.match(AtRule.ruleTypeRegex)[0];
		return atRule.replace('@', '');
	}

	/**
	 * @param  {string} atRuleString
	 * @returns {string|undefined} the condition of the at-rule
	 */
	static getConditionText(atRuleString) {
		if (!atRuleString) return undefined;
		const atRuleType = AtRule.getAtRuleType(atRuleString);
		const condition = atRuleString.split(atRuleType)[1].trim();
		return condition;
	}

	static sanitizeAtRule(condition) {
		if (typeof condition !== 'string') throw new Error('condition must be a string');

		const sanitizedCondition = condition
			.toLowerCase()
			.replace(/\s{2,}/g, ' ') // remove double spaces or more
			.replace('( ', '(')
			.replace(' )', ')')
			.replace(/\s?:\s?/g, ':') // remove spaces around :
			.trim();

		return sanitizedCondition;
	}

	get atRuleType() {
		return AtRule.getAtRuleType(this.atRule);
	}

	get conditionText() {
		return AtRule.getConditionText(this.atRule);
	}
}

export default AtRule;
