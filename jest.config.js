module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest'
	},
	globals: {
		'ts-jest': {
			tsConfig: 'tsconfig.json'
		}
	},
	testMatch: [
		'**/test/**/*.ts?(x)',
		'**/?(*.)+(spec|test).ts?(x)',
		'**/test/*.+(ts|tsx|js)',
		'test/.*\\.(ts|tsx)$'
	]
};
