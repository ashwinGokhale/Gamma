export const generateFakeFiles = (bases: number, repos: number) => {
	const fakeFiles: { [x: string]: string } = {};
	for (let i = 1; i <= bases; i++) {
		for (let j = 1; j <= repos; j++) {
			fakeFiles[`/test/base${i}/repo${j}/.git/something.txt`] = 'nothing';
		}
	}

	return fakeFiles;
};
