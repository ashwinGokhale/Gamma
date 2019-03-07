import 'jest';
import * as fs from 'memfs';
jest.mock('fs');
import { generateFakeFiles } from './helpers';
import { dotpath, getDotfile } from '../src/helpers';
import { init, add } from '../src/commands';

const NUM_BASES = 3;
const REPOS_PER_BASE = 4;

describe('Add tests', () => {
	beforeEach(async () => {
		fs.vol.reset();
		const fakeFiles = generateFakeFiles(NUM_BASES, REPOS_PER_BASE);
		fakeFiles[dotpath] = '';
		fs.vol.fromJSON(fakeFiles);
		return init();
	});

	it('Successfully gets all files', async () => {
		const [before] = await getDotfile();
		const bases = [`/test/base${NUM_BASES - 1}`];
		await add(bases);
		const [after] = await getDotfile();
		expect(before).not.toEqual(after);
		const numBases = Object.keys(after.bases).length;

		expect(numBases).toEqual(bases.length);
		bases.forEach(base => {
			expect(after.bases).toHaveProperty(base);
			expect(Object.keys(after.bases[base].repos).length).toEqual(REPOS_PER_BASE);
		});
	});
});
