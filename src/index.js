#!/usr/bin/env node
'use strict'

import program from 'commander';
// import omelette from 'omelette';
import et from 'expand-tilde';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';
import glob from 'glob';

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
	let dotfile = {};
	if (!fs.existsSync(dotpath)){
		console.log(chalk.red(`~/.gamma.json has been corrupted. Rebuilding...`));
		dotfile = init();
		console.log(chalk.green(`~/.gamma.json has been rebuilt`));
	}
	else
		dotfile = require(dotpath);

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
			console.log(chalk.red(`Base: ${base} does not exist`));
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


// CLI commands
const add = (base = '', bases = []) => {
	//Adds the bases and finds all repos in it.
	// Attempt to load the dotfile
	let repos, repo_names = [];
	let dotfile = {};
	if (!fs.existsSync(dotpath)){
		console.log(chalk.red(`~/.gamma.json has been corrupted. Rebuilding...`));
		dotfile = init();
		console.log(chalk.green(`~/.gamma.json has been rebuilt`));
	}
	else
		dotfile = require(dotpath);

	bases = bases.concat(base);


	// TODO: Add a spinner because glob is slow

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
	let dotfile = {};
	if (!fs.existsSync(dotpath)){
		console.log(chalk.red(`~/.gamma.json has been corrupted. Rebuilding...`));
		dotfile = init();
		console.log(chalk.green(`~/.gamma.json has been rebuilt`));
		return dotfile;
	}
	else
		dotfile = require(dotpath);

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
	// Add the autocomplete
	complete.setupShellInitFile();
	// Initializes the gamma dofile and persists to disk
	let content = {'bases': {},'context':{'base': '', 'repo': ''}};
	fs.writeFile(dotpath,JSON.stringify(content, null, '\t'), 'utf8', (err) => {if(err){console.error(err)}});
	return content;
}

const listRepos = (bases = []) => { getRepos(bases).forEach(base => console.log(base)); }

const search = (base = '') => {glob.sync(`${path.resolve(et(base))}/**/.git`, {dot: true}).forEach(repo_path => console.log(repo_path.slice(0, -5)));}

const listBases = () =>{
	Object.keys(require(dotpath)['bases']).forEach(base => console.log(base));
}

program
.command('list [bases...]')
.alias('l')
.description('List all git repos by base')
.action(listRepos);

program
.command('search <base>')
.alias('s')
.description('Returns the paths for all git repos in the given base')
.action(search);

program
.command('init')
.alias('i')
.description('Initializes the gamma dotfile')
.action(init);

program
.command('add <base> [otherBases...]')
.alias('a')
.action(add)
.description('Adds the specified bases as well as all git repos in them');

program
.command('remove <base> [otherBases...]')
.alias('r')
.action(remove)
.description('Removes the specified bases from Gamma');

program
.command('context')
.command('list')
.command('set')

program.parse(process.argv);

console.log(program.context);