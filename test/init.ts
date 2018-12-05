import 'jest';
import { init, test } from '../src/commands';

describe('Init tests', () => {
	it('Successfully initializes gamma.json file', () => {
		const dotfile = init();
		// test();
	});
});
