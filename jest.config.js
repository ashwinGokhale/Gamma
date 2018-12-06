module.exports = {
	globals: {
		'ts-jest': {
			tsConfig: 'tsconfig.json'
		}
	},
	moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: [
		// '**/test/**/*.ts?(x)',
		'**/?(*.)+(spec|test).ts?(x)',
		'**/test/*.+(ts|tsx|js)'
		// 'test/.*\\.(ts|tsx)$'
	],
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest'
	}
};
