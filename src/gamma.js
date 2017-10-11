#!/usr/bin/env node
'use strict'

import program from 'commander';
import et from 'expand-tilde';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';
import glob from 'glob';
import shell from 'shelljs';
import rl from 'readline';

// Path to the dotfile
const dotpath = et('~/.gamma.json');

// Autocomplete suggestions
// const complete = omelette('gamma').tree({
	// list: null,
	// search: null,
	// init: null,
	// add: null,
//     remove: Object.keys(require(dotpath)['bases'])
// });
// const complete = omelette`gamma|gam ${['list','search','init','add','remove']}`
// complete.on('$remove', (line, { reply }) => {
// 	console.log(line);
// 	// if(~fragment.indexOf('remove'))
// 		// reply(Object.keys(require(dotpath)['bases']))
// 	reply(line);
// });

// Helper functions
const isChildOf = (child, parent) => (child !== parent) && parent.split('/').every((t, i) => child.split('/')[i] === t);

const getDotfile = () => {
	if (!fs.existsSync(dotpath)) {
		console.log(chalk.red(`Error removing bases: ~/.gamma.json has been corrupted. Rebuilding...`));
		let dotfile = init();
		console.log(chalk.green(`~/.gamma.json has been rebuilt`));
		return [dotfile, true];
	}
	else
		return [require(dotpath), false];
}

const findRepos = (bases = [], dotfile = {}) => {
	let repo_names = {};
	bases.forEach(base => {
		base = path.resolve(et(base));
		let repos = {};
		repo_names[base] = [];
		glob.sync(`${base}/**/.git`, {dot: true}).forEach(repo_path => {
			// Cut off /.git from the filename
			repo_path = repo_path.slice(0, -5);
			let repo_name = path.basename(repo_path);
			repos[repo_name] = {'base': base, 'path': repo_path};
			repo_names[base].push(repo_name);
		});
		dotfile['bases'][base]['repos'] = repos
	});
	return [dotfile, repo_names]
}


const getRepos = (bases = []) => {
	// TODO: Only add bases that aren't in the dotfile
	var repos = [];
	let [dotfile] = getDotfile();

	if (bases.length > 0){
		bases.forEach(base => {
			if (base in dotfile['bases'])
				repos = repos.concat(Object.keys(dotfile['bases'][base]['repos']));
			
			else
				console.log(chalk.red(`${base} is not a base`));
		});
	}
	else{
		for (let base in dotfile['bases'])
			repos = repos.concat(Object.keys(dotfile['bases'][base]['repos']));
	}
	return repos;
}



const filter = (bases = []) => {
	let tree = {};
	let paths = [];
	bases.forEach(base => {
		base = path.resolve(et(base));
		if(!fs.existsSync(base)){
			console.log(chalk.red(`${base} does not exist`));
			return;
		}
		let dirs = base.split(path.sep);
		for (let i = 0; i < dirs.length; i++ ){
			if (tree[dirs[i]]){
				if (tree[dirs[i]]['marked'])
					break;
			}

			if (!tree[dirs[i]])
				tree[dirs[i]] = {};

			if (i == dirs.length - 1){
				tree[dirs[i]] = {'marked': true};
				paths.push(base);
			}
		}
	});
	return paths;
}

const listBases = (dotfile) => Object.keys(dotfile['bases']).forEach(base => console.log(base));

const listRepos = (bases = []) => getRepos(bases).forEach(base => console.log(base));

const processContextBase = (base, dotfile) => {
	// Sets the base as the context base
	base = path.resolve(et(base));
	if (!fs.existsSync(base))
		return console.log(chalk.red(`${base} does not exist`));
	
	if (!Object.keys(dotfile['bases']).includes(base))
		return console.log(chalk.red(`Please add: ${base} before attempting to set it to the context base`));
	
	dotfile['context']['base'] = base;

	fs.writeFile(dotpath,JSON.stringify(dotfile, null, '\t'), 'utf8', (err) => {if(err){console.error(err)}});
	return dotfile;
}

const processContextRepo = (repo, dotfile) => {
	// Sets the base as the context base
	let contextBase = dotfile['context']['base'];
	let repoKeys = Object.keys(dotfile['bases'][contextBase]['repos']);
	let repoIndex = repoKeys.indexOf(repo);
	if (repoIndex < 0)
		return console.log(chalk.red(`${repo} is not repo in the context base: ${contextBase}`));
	
	dotfile['context']['repo'] = {
		name: repoKeys[repoIndex],
		path: dotfile['bases'][contextBase]['repos'][repoKeys[repoIndex]]['path']
	};

	fs.writeFile(dotpath,JSON.stringify(dotfile, null, '\t'), 'utf8', (err) => {if(err){console.error(err)}});
	return dotfile;
}

const runCommand = (command = '', dotfile = {}) => {
	command = command.replace('git', '').trim();
	let repo = dotfile['context']['repo']['path'];
	if (!repo)
		return console.log(chalk.red(`Context repo is missing!`));
	command = `git -C ${repo} ${command}`;
	let code = shell.exec(command).code;
	if (code !== 0)
		return console.log(chalk.red(`Command: ${command} failed!`));
	return code;
}

// CLI commands
const add = (base = '', bases = []) => {
	//Adds the bases and finds all repos in it.
	// Attempt to load the dotfile
	let repos, repo_names = [];
	let [dotfile] = getDotfile();

	bases = bases.concat(base);


	// TODO: Add a spinner because glob is slow
	console.log(chalk.yellow('Adding bases...'));

	// Get the absolute path of the bases and filter/validate them
	bases = filter(bases.map(b => path.resolve(et(b))).sort((a, b) => a.length - b.length));
	let to_index = [];
	bases.forEach(base => { 
		// Check to see if the base is not contained in another base
		let is_subdir = false;
		for(let b of Object.keys(dotfile['bases'])) {
			// If the base trying to be added is a subdirectory of an existing base, skip it
			if (isChildOf(base, b)){
				console.log(chalk.red(`${base} is inside another base: ${b}`));
				is_subdir = true;
				break;
			}
			// If the base trying to be added is a parent directory of an existing base, delete the sub directory
			if (isChildOf(b,base)){
				console.log(chalk.red(`${b} is inside another base: ${base}`));
				if (to_index.indexOf(b) >= 0) to_index.remove(b);
				if (b in dotfile['bases']) delete dotfile['bases'][b];
				break;
			}
		}
		// If base is a unique directory, not in another base, add it to the dotfile
		if(!is_subdir){
			dotfile['bases'][base] = {'repos': {}};
			to_index.push(base);
		}
	});

	// Index the new bases for repos
	[dotfile, repo_names] = findRepos(to_index, dotfile);

	// Format the output and print it
	Object.keys(repo_names).forEach(base => {
		console.log(chalk.green(`Base added: ${base}`));
		let names = repo_names[base].map((name, num) => `  ${num+1}) ${name}`).join('\n');
		console.log(chalk.green(`Repos added: \n${names ? names : '  None'}`));
	});

	// Write the dotfile back
	fs.writeFile(dotpath,JSON.stringify(dotfile, null, '\t'), 'utf8', (err) => {if(err){console.error(err)}});
	return dotfile
}


const remove = (base = '', bases = []) => {
	// Removes a base, including all repos in it
	let dotfile, error;
	[dotfile, error] = getDotfile();
	if (error)
		return dotfile;

	bases.concat(base).forEach(base => {
		let base_path = path.resolve(et(base));
		if (base_path in dotfile['bases']) {
			let names = Object.keys(dotfile['bases'][base_path]['repos']).map((name, num) => `  ${num+1}) ${name}`).join('\n');
			delete dotfile['bases'][base_path];
			console.log(chalk.red(`Base deleted: ${base_path}`));
			if (names)
				console.log(chalk.red(`Repos deleted: \n${names}`));
		}
		else
			console.log(chalk.red(`${base_path} is not a base`));
	});

	fs.writeFile(dotpath,JSON.stringify(dotfile, null, '\t'), 'utf8', (err) => {if(err){console.error(err)}});
	return dotfile;
}

const init = () => {
	// Initializes the gamma dofile and persists to disk
	let content = {'bases': {},'context':{'base': '', 'repo': ''}};
	fs.writeFile(dotpath,JSON.stringify(content, null, '\t'), 'utf8', (err) => {if(err){console.error(err)}});
	return content;
}

const list = (bases = [], options = {}) => {
	let [dotfile] = getDotfile();
	if (options.bases)
		return listBases(dotfile);
	if (options.context)
		return console.log(`Base: ${dotfile['context']['base']}\nRepo: ${dotfile['context']['repo']['name'] ? dotfile['context']['repo']['name'] : ''}`);

	return listRepos(bases);
}

const search = (base = '') => {
	base = path.resolve(et(base));
	console.log(chalk.yellow(`Searching ${base} for all repos`));
	glob.sync(`${base}/**/.git`, {dot: true}).forEach(repo_path => console.log(repo_path.slice(0, -5)));
}

const set = (options) => {
	let [dotfile] = getDotfile();
	
	if (options.base)
		processContextBase(options.base, dotfile);
	if (options.repo)
		processContextRepo(options.repo, dotfile);
}

const run = () => {
	let [dotfile, error] = getDotfile();
	if (error)
		return;

	let i = rl.createInterface(process.stdin, process.stdout, null);
	i.question("Command: ", (command = '') => {
		runCommand(command, dotfile);
		i.close();
		process.stdin.destroy();
	});
}

const initProgram = () => {
	program
	.command('list [bases...]').alias('l')
	.option('-b, --bases', 'Lists the bases', false)
	.option('-c, --context', 'Lists the current context', false)
	.description('List all git repos by base')
	.action(list);
	
	program
	.command('search <base>').alias('s')
	.description('Returns the paths for all git repos in the given base')
	.action(search);
	
	program
	.command('init').alias('i')
	.description('Initializes the gamma dotfile')
	.action(init);
	
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
	.option('-b, --base <base>', 'Sets the base of the context')
	.option('-r, --repo <repo>', 'Sets the repo within the base of the context')
	.description('Set the base or repo of the context')
	.action(set);

	program
	.command('run')
	.description('Runs a git command in the context')
	.action(run);
}

initProgram();

program.parse(process.argv);

