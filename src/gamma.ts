#!/usr/bin/env node

import * as program from 'commander';
import {
	list,
	search,
	init,
	add,
	remove,
	set,
	run,
	install,
	rebase,
	daemon,
	status,
	test
} from './commands';
import { logger } from './logger';

const initProgram = () => {
	program.version('0.0.7');

	// tslint:disable-next-line:only-arrow-functions
	program.option('-s, --silent', 'Silence all output', false).on('option:silent', function() {
		logger.silent = this.silent;
	});

	program
		.command('list [bases...]')
		.alias('l')
		.option('-b, --bases', 'Lists the bases', true)
		.option('-c, --context', 'Lists the current context', false)
		.description('List all git repos in the base(s)')
		.action(list);

	program
		.command('search <base>')
		.alias('s')
		.description('Fuzzy matches a git repo inside the context base')
		.action(search);

	program
		.command('init')
		.alias('i')
		.description('Initializes the gamma dotfile')
		.action(init);

	program
		.command('install')
		.alias('ins')
		.description(
			`Installs the 'ad' command, which cd's into a git repo fuzzy matching a repo in the context base`
		)
		.action(install);

	program
		// .command('add <base> [otherBases...]')
		.command('add <bases...>')
		.alias('a')
		.description('Adds the specified bases as well as all git repos in them')
		.action(add);

	program
		.command('remove <base> [otherBases...]')
		.alias('r')
		.description('Removes the specified bases from Gamma')
		.action(remove);

	program
		.command('set')
		.alias('se')
		.option('-b, --base <base>', 'Sets the base of the context. Can fuzzy match base')
		.option(
			'-r, --repo <repo>',
			'Sets the repo within the base of the context. Can fuzy match repo'
		)
		.description('Set the base and/or repo of the context. Supports fuzzy matching')
		.action(set);

	program
		.command('run')
		.alias('ru')
		.option(
			'-c, --command <command>',
			'Runs a git command in the context repo. NOTE: Put command inside of single quotes.'
		)
		.description('Runs a git command in the context repo')
		.allowUnknownOption(true)
		.action(run);

	program
		.command('rebase [bases...]')
		.alias('re')
		.description('Rescan base(s) and removes any base or repo that does not exist anymore')
		.action(rebase);

	program
		.command('daemon')
		.alias('d')
		.description('Runs background process that maintains all bases and their repos')
		.action(daemon);

	program
		.command('status')
		.alias('st')
		.description('Prints the status of each repo in each base')
		.action(status);

	program
		.command('test')
		.alias('t')
		.description('This is a test')
		.action(test);
};

initProgram();

program.parse(process.argv);
