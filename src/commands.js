import et from 'expand-tilde';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';
import glob from 'glob';
import shell from 'shelljs';
import rl from 'readline';
import inquirer from 'inquirer';
import fuzzy from 'fuzzy';
import chokidar from 'chokidar';
import ps from 'ps-node';
import logUpdate from 'log-update';
import { spawn } from 'child_process';
import { dotpath, isChildOf, dirs, findRepos, getRepos, filter, listBases, listRepos, processContextBase, processContextRepo, runCommand, getDotfile, getBase, dumpDotfile, unpushed, repoEmpty, commitPending } from './helpers';

// CLI commands
export const add = (base = '', bases = []) => {
	//Adds the bases and finds all repos in it.
	// Attempt to load the dotfile
	let repos, repo_names = [];
	let [dotfile] = getDotfile();

	bases = bases.concat(base);

	// TODO: Add a spinner because glob is slow
	logUpdate(chalk.yellow('Adding bases...'));

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

	logUpdate.clear();
	// Format the output and print it
	Object.keys(repo_names).forEach(base => {
		console.log(chalk.green(`Base added: ${base}`));
		let names = repo_names[base].map((name, num) => `  ${num+1}) ${name}`).join('\n');
		console.log(chalk.green(`Repos added: \n${names ? names : '  None'}`));
	});

	// Write the dotfile back
	return dumpDotfile(dotfile);
}


export const remove = (base = '', bases = []) => {
	// Asynchronously rebase
	spawn('gamma', ['rebase'], {detached:true, stdio:'ignore'}).unref();

	// Removes a base, including all repos in it
	let [dotfile, error] = getDotfile();
	if (error)
		return dotfile;

	bases.concat(base).forEach(base => {
		let base_path = path.resolve(et(base));
		if (base == dotfile['context']['base'])
			dotfile['context'] = {context: '',repo: {}}

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

	return dumpDotfile(dotfile);
}

export const init = () => {
	// Initializes the gamma dofile and persists to disk
	let content = {'bases': {},'context':{'base': '', 'repo': ''}};
	return dumpDotfile(content);
}

export const list = (bases = [], options = {}) => {
	// Asynchronously rebase
	spawn('gamma', ['rebase'], {detached:true, stdio:'ignore'}).unref();

	let [dotfile] = getDotfile();
	if (options.bases)
		return listBases(dotfile);
	if (options.context)
		return console.log(`Base: ${dotfile['context']['base'] ? dotfile['context']['base'] : ''}\nRepo: ${dotfile['context']['repo']['name'] ? dotfile['context']['repo']['name'] : ''}`);

	return listRepos(bases);
}

export const search = (base = '') => {
	// Asynchronously rebase
	spawn('gamma', ['rebase'], {detached:true, stdio:'ignore'}).unref();

	let [dotfile, error] = getDotfile();
	let repos = [];
	Object.keys(dotfile['bases']).forEach(b => Object.entries(dotfile['bases'][b]['repos']).forEach(key => repos.push(key[1]['path'])));
	let filtered = fuzzy.filter(base, repos);
	filtered.length ? console.log(filtered[0].string) : console.log('');
}

export const set = (options) => {
	let [dotfile] = getDotfile();
	
	let context;
	if (options.base){
		let baseContext = processContextBase(options.base, dotfile);
		context = baseContext ? baseContext : context;
	}
	if (options.repo){
		let repoContext = processContextRepo(options.repo, dotfile);
		context = repoContext ? repoContext : context;
	}

	if (context) {
		console.log(chalk.green(`Updated context:`));
		list(null, {context: true});
	}
}

export const run = async (...options) => {
	let [dotfile, error] = getDotfile();
	if (error) return;

	options = options[options.length-1];

	if (options.command && typeof options.command === 'string')
		return runCommand(options.command, dotfile);

	while (true) {
		let {command} = await inquirer.prompt({type:'input',name:'command',message:'Command: '})
		if (command && command != 'q' && command != 'quit') runCommand(command, dotfile);
		else return;
	}	
}

export const install = async () => {
	const COMMAND_INFO = `
This installs the 'gd' command, which cd's into a git repo fuzzy matching a repo in the context base
Example:
	➜  Dropbox $ ad gam
	➜  Gamma (master) ✗ pwd
	/Users/ashwin/Dropbox/gitHub/Gamma
`	
	console.log(COMMAND_INFO);
	const { confirm } = await inquirer.prompt({type:'confirm',name:'confirm',message:'Continue with installation?'})
	if (!confirm) return;
	let { name } = await inquirer.prompt({type:'input',name:'name',message:`Name of the command? (Default: 'gd'): `});
	name = /^[a-z][a-zA-Z0-9_]*$/g.exec(name) ? name : 'gd';
	let command = `\n\n${name}(){cd $(gamma search $1)}`;
	let installed = false;
	let messages = [];
	for (let shellPath of ['~/.bashrc', '~/.zshrc']) {
		shellPath = path.resolve(et(shellPath));
		const {install} = await inquirer.prompt({type:'confirm',name:'install',message:`Install ${name} function to ${shellPath}?`});
		if (!install) continue;
		try {
			fs.accessSync(shellPath, fs.W_OK);
			fs.appendFileSync(shellPath, command);	
			messages.push(chalk.green(`${name} command has been installed in ${shellPath}`));
		} catch (error) {
			messages.push(chalk.red(`No write access for ${shellPath}`));
		}
	}
	if (!messages.length) return console.log(`Did not install the ${name} command`);
	messages.forEach(message => console.log(message));
}

export const rebase = (bases = []) => {
	let [dotfile, error] = getDotfile();
	if (error)
		return dotfile;

	let dotBases = Object.keys(dotfile['bases']);

	// Get all bases in the dotfile
	bases = bases.length ? bases.map(b => path.resolve(et(b))).filter(base => dotfile['bases'][base]) : dotBases;

	logUpdate(chalk.yellow(`Reindexing bases...`))

	// Get the original bases with their repos
	let original = {};
	Object.keys(dotfile['bases']).forEach(base => original[base] = Object.keys(dotfile['bases'][base]['repos']));

	// Index the new bases for repos
	let repo_names;
	[dotfile, repo_names] = findRepos(bases, dotfile);

	// Format the output and print it
	logUpdate.clear();
	Object.keys(original).forEach(base => {
		// Convert list of repos added and repos removed into a formatted string
		let reposAdded = repo_names[base].filter(b => !original[base].includes(b)).map((name, num) => `  ${num+1}) ${name}`).join('\n');
		let reposRemoved = original[base].filter(b => !repo_names[base].includes(b)).map((name, num) => `  ${num+1}) ${name}`).join('\n');
		if (fs.existsSync(base)) {
			console.log(`Base reindexed: ${base}`);
			console.log(chalk.green(`Repos added: \n${reposAdded ? reposAdded : '  None'}`));
		}
		else {
			console.log(chalk.red(`${base} does not exist`));
			delete dotfile['bases'][base];
		}
		console.log(chalk.red(`Repos removed: \n${reposRemoved ? reposRemoved : '  None'}`));
	});

	// Check if context base exits
	if (dotfile['context']['base'] && !fs.existsSync(dotfile['context']['base'])) dotfile['context'] = {'base': '', 'repo': ''};

	// Check if context repo exits
	if (dotfile['context']['repo'] && !fs.existsSync(dotfile['context']['repo']['path'])) dotfile['context']['repo'] = {};

	// Write the dotfile back
	return dumpDotfile(dotfile);
}

export const daemon = () => {
	ps.lookup({command: 'node',arguments: ['gamma','daemon']}, (err, processes) => {
		if (err) return console.error(err);

		if (processes.length > 1) return;

		// TODO: Create daemon on startup
		// TODO: Add useful logging output
		// let startup;
		// try {
		// 	startup = require('user-startup');
		// } catch (err) {
		// 	// Unsupported platform
		// 	return console.error(err);
		// }
		// startup.create(
		// 	'gamma_daemon', // id
		// 	'gamma', // cmd
		// 	['daemon'], // args
		// 	'/Users/$USER/Desktop/daemon.log' // out
		// )
		console.log(`Gamma deamon started`);
		chokidar.watch(Object.keys(getDotfile()[0]['bases']), {ignored: /(^|\/)\.[^\/\.]|(node_modules)/gm})
		.on('addDir', dirPath => {
			let [dotfile, error] = getDotfile();
			if (!/(\.git(\0|\/|\n|\r))/gm.exec(dirPath)) return;
			
			if (shell.exec(`git -C ${dirPath} rev-parse`).code != 0) return;
			
			dirPath = dirPath.substring(0,dirPath.indexOf('.git')-1);
			let dirName = path.basename(dirPath);
			let base = getBase(dirPath);
			if (dotfile['bases'][base]['repos'][dirName]) return;
		
			dotfile['bases'][base]['repos'][dirName] = {'base': base, 'path': dirPath};
			return dumpDotfile(dotfile);
		})
		.on('unlinkDir', dirPath => {
			let [dotfile, error] = getDotfile();
			for (let base of Object.keys(dotfile['bases'])) {
				if (!isChildOf(dirPath, base)) continue;

				if(!dotfile['bases'][base]['repos'][path.basename(dirPath)]) continue;

				delete dotfile['bases'][base]['repos'][path.basename(dirPath)];
				dumpDotfile(dotfile);
				break;
			}
		});
	});
}

export const status = () => {
	let [dotfile, error] = getDotfile();
	if (error) return dotfile;

	// Asynchronously rebase
	spawn('gamma', ['rebase'], {detached:true, stdio:'ignore'}).unref();

	// Compute the length of the longest repo/base
	let names = [];
	Object.keys(dotfile['bases']).forEach(base => Object.keys(dotfile['bases'][base]['repos']).concat(`Base: ${base}`).forEach(repo => names.push(repo)));
	let pad = names.reduce((r,s) => r > s.length ? r : s.length, 0);

	// Print the status of each repo in each base
	Object.keys(dotfile['bases']).forEach(base => {
		// Print row header
		console.log(chalk.magenta(`Base: ${base}${' '.repeat(Math.abs(pad-base.length+5))}Status`));
		// Print the status of each repo
		Object.keys(dotfile['bases'][base]['repos']).forEach(repoName => {
			let repo = dotfile['bases'][base]['repos'][repoName]['path'].replace(/ /g, '\\ ');
			let messages = [];
			// Add the status message
			if (repoEmpty(repo)) messages.push(chalk.green('Empty'));
			if (commitPending(repo)) messages.push(chalk.blue('Uncommitted'));
			if (unpushed(repo)) messages.push(chalk.yellow('Unpushed'));
			if(!messages.length) messages.push(chalk.green('Up to date'));
			// Print the formatted status message
			console.log(`${repoName}${' '.repeat(Math.abs(pad-repoName.length+11))}${messages.join(' | ')}`);
		});
		console.log();
	});
}