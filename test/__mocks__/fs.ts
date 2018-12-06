import * as memfs from 'memfs';

const fs = {
	...jest.genMockFromModule('fs'),
	...memfs.fs
};

module.exports = fs;
