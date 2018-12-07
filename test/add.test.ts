import 'jest';
import * as memfs from 'memfs';
jest.mock('fs');
import * as fs from 'fs';
import { generateFakeFiles } from './helpers';
import { dotpath, getDotfile } from '../src/helpers';
import { init, add } from '../src/commands';

const NUM_BASES = 3;
const REPOS_PER_BASE = 4;

describe('Add tests', () => {
	beforeEach(async () => {
		const fakeFiles = generateFakeFiles(NUM_BASES, REPOS_PER_BASE);
		fakeFiles[dotpath] = '';
		memfs.vol.fromJSON(fakeFiles);
		// mock(fakeFiles);
		await init();
	});

	it('Successfully gets all files', async () => {
		const [dotfileBefore] = await getDotfile();
		console.log('Dotfile before:', dotfileBefore);
		await add([`/test/base${NUM_BASES-1}`]);
		const [dotfileAfter] = await getDotfile();
		console.log('Dotfile after:', dotfileAfter);
	});

	afterEach(() => {
		// mock.restore();
		memfs.vol.reset();
	});
});
