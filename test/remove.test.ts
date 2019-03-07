import 'jest';
import * as fs from 'memfs';
jest.mock('fs');
import { generateFakeFiles } from './helpers';
import { dotpath, getDotfile } from '../src/helpers';
import { init, add, remove } from '../src/commands';

const NUM_BASES = 3;
const REPOS_PER_BASE = 4;

describe('Remove tests', () => {
	beforeEach(async () => {
		fs.vol.reset();
		const fakeFiles = generateFakeFiles(NUM_BASES, REPOS_PER_BASE);
		fakeFiles[dotpath] = '';
		fs.vol.fromJSON(fakeFiles);
		return init();
	});

	it('Successfully removes all files', async () => {
		const bases = Array.from({ length: NUM_BASES }, (_, num) => `/test/base${num}`);
		await add(bases);
		const [before] = await getDotfile();
		expect(Object.keys(before.bases).length).toEqual(NUM_BASES);

		await remove(`/test/base${NUM_BASES - 1}`);
		const [after] = await getDotfile();

		expect(before).not.toEqual(after);
		expect(Object.keys(after.bases).length).toEqual(NUM_BASES - 1);
		expect(after.bases[`/test/base${NUM_BASES - 1}`]).toEqual(undefined);
	});
});
