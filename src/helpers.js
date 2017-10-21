import et from 'expand-tilde';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';
import glob from 'glob';
import shell from 'shelljs';
import rl from 'readline';
import fuzzy from 'fuzzy';

export const dotpath = et('~/.gamma.json');

// Helper functions
export const isChildOf = (child, parent) => (child !== parent) && parent.split('/').every((t, i) => child.split('/')[i] === t);

export const dirs = p => fs.readdirSync(et(p)).filter(f => fs.statSync(path.join(p, f)).isDirectory() && !f.startsWith('.'));

export const findRepos = (bases = [], dotfile = {}) => {
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


export const getRepos = (bases = []) => {
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

// Given a repo, return its base
export const getBase = (repo = '') => Object.keys(getDotfile()[0]['bases']).find(base => isChildOf(repo, base));

export const filter = (bases = []) => {
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

export const listBases = (dotfile) => Object.keys(dotfile['bases']).forEach(base => console.log(base));

export const listRepos = (bases = []) => getRepos(bases).forEach(base => console.log(base));

export const processContextBase = (base = '', dotfile = {}) => {
	// Sets the base as the context base	
	let result = fuzzy.filter(base, Object.keys(dotfile['bases']));

	if (!result.length)
		return console.log(chalk.red(`Could not match: ${base} to an existing base`));
	
	dotfile['context']['base'] = result[0].string;
	dotfile['context']['repo'] = {};

	return dumpDotfile(dotfile);
}

export const processContextRepo = (repo, dotfile) => {
	// Sets the base as the context base
	let contextBase = dotfile['context']['base'];
	if (!contextBase) return console.log(chalk.red(`Please set the context`));
	let repoKeys = Object.keys(dotfile['bases'][contextBase]['repos']);
	let result = fuzzy.filter(repo, repoKeys);

	if (!result.length)
		return console.log(chalk.red(`Could not match: ${repo} to an existing repo in ${contextBase}`));

	dotfile['context']['repo'] = {
		name: result[0].string,
		path: dotfile['bases'][contextBase]['repos'][result[0].string]['path']
	};

	return dumpDotfile(dotfile);
}

export const runCommand = (command = '', dotfile = {}) => {
	command = command.replace('git', '').trim();
	let repo = dotfile['context']['repo'];
	if (!Object.getOwnPropertyNames(repo).length)
		return console.log(chalk.red(`Context repo is missing!`));
	
	repo = repo['path'].replace(/ /g, '\\ ');
	command = `git -C ${repo} ${command}`;
	
	let code = shell.exec(command).code;
	if (code !== 0)
		return console.log(chalk.red(`Command: ${command} failed!`));
	return code;
}

export const getDotfile = () => {
	if (!fs.existsSync(dotpath)) {
		console.log(chalk.red(`Error removing bases: ~/.gamma.json has been corrupted. Rebuilding...`));
		let dotfile = init();
		console.log(chalk.green(`~/.gamma.json has been rebuilt`));
		return [dotfile, true];
	}
	else
		return [require(dotpath), false];
}

export const dumpDotfile = (dotfile) => {
	fs.writeFile(dotpath,JSON.stringify(dotfile, null, ''), 'utf8', err => {if(err){console.error(err)}});
	return dotfile;
}