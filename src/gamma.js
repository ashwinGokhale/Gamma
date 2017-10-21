#!/usr/bin/env node

import program from 'commander';
import {list, search, init, add, remove, set, run, install, rebase, daemon} from './commands';

const initProgram = () => {
	program
	.command('list [bases...]').alias('l')
	.option('-b, --bases', 'Lists the bases', true)
	.option('-c, --context', 'Lists the current context', false)
	.description('List all git repos in the base(s)')
	.action(list);
	
	program
	.command('search <base>').alias('s')
	.description('Fuzzy matches a git repo inside the context base')
	.action(search);
	
	program
	.command('init').alias('i')
	.description('Initializes the gamma dotfile')
	.action(init);

	program
	.command('install').alias('ins')
	.description(`Installs the 'ad' command, which cd's into a git repo fuzzy matching a repo in the context base`)
	.action(install)
	
	program
	.command('add <base> [otherBases...]').alias('a')
	.description('Adds the specified bases as well as all git repos in them')
	.action(add);
	
	program
	.command('remove <base> [otherBases...]').alias('r')
	.description('Removes the specified bases from Gamma')
	.action(remove);
	
	program
	.command('set')
	.option('-b, --base <base>', 'Sets the base of the context. Can fuzzy match base')
	.option('-r, --repo <repo>', 'Sets the repo within the base of the context. Can fuzy match repo')
	.description('Set the base and/or repo of the context')
	.action(set);

	program
	.command('run')
	.option('-c, --command <command>', 'Runs a git command in the context repo. NOTE: Put command inside of single quotes.')
	.description('Runs a git command in the context')
	.allowUnknownOption(true)
	.action(run);

	program
	.command('rebase [bases...]').alias('re')
	.description('Rescan base(s) and removes any base or repo that does not exist anymore')
	.action(rebase);

	program
	.command('daemon').alias('d')
	.description('Runs background process that maintains all bases and their repos')
	.action(daemon);
}

initProgram();

program.parse(process.argv);
