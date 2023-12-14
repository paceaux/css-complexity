class AtRule {
	static ruleTypeRegex = /@\w+/;

	/**
	 * @param  {string} atRule=''
	 * @param  {object} dependencies={}
	 */
	constructor(atRule = '', dependencies = {}) {
		this.dependencies = dependencies;

		if (atRule) {
			this.atRule = atRule.trim();
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
