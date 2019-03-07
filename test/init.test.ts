import 'jest';
jest.mock('fs');
import { vol, fs } from 'memfs';
// import * as fs from 'fs';
import { dotpath } from '../src/helpers';
import { init } from '../src/commands';

describe('Init tests', () => {
	beforeEach(() => {
		vol.reset();
		vol.fromJSON({
			[dotpath]: ''
		});
	});

	it('Successfully initializes ~/.gamma.json file', async () => {
		const dotfile = await init();
		const readDotFile = fs.readFileSync(dotpath).toString();
		const dotFileObject = JSON.parse(readDotFile);
		expect(dotfile).toEqual(dotFileObject);
	});
});
