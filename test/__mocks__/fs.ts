import * as memfs from 'memfs';

const fs = {
	...jest.genMockFromModule('fs'),
	...memfs.fs
};

jest.mock('fs', () => fs);

module.exports = fs;
