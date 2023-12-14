class AtRule {
	static ruleTypeRegex = /@\w+/;

	constructor(atRule = '', dependencies = {}) {
		this.dependencies = dependencies;

		if (atRule) {
			this.atRule = atRule.trim();
		}
	}

	static getAtRuleType(atRuleString) {
		if (!atRuleString) return undefined;
		const atRule = atRuleString.match(AtRule.ruleTypeRegex)[0];
		return atRule.replace('@', '');
	}

	get atRuleType() {
		return AtRule.getAtRuleType(this.atRule);
	}
}

export default AtRule;
