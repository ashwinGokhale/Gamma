import * as et from 'expand-tilde';
import * as path from 'path';
import chalk from 'chalk';
import * as fs from 'fs';
import * as glob from 'glob';
import * as shell from 'shelljs';
import * as fuzzy from 'fuzzy';
import { rebase, init } from './commands';
import { spawn, execSync } from 'child_process';
import { IDotfile } from './dotfile';

export const dotpath: string = et('~/.gamma.json');

// Helper functions
export const isChildOf = (child: string, parent: string) =>
	child !== parent && parent.split('/').every((t, i) => child.split('/')[i] === t);

export const getDirectories = (p: string) =>
	fs
		.readdirSync(et(p))
		.filter(f => fs.statSync(path.join(p, f)).isDirectory() && !f.startsWith('.'));

export const findRepos = (bases: string[], dotfile: IDotfile) => {
	const repoNames = {};
	bases.forEach(base => {
		base = path.resolve(et(base));
		const repos = {};
		repoNames[base] = [];
		glob.sync(`${base}/**/.git`, { dot: true }).forEach(repoPath => {
			// Cut off /.git from the filename
			repoPath = repoPath.slice(0, -5);
			const repoName = path.basename(repoPath);
			repos[repoName] = { base, path: repoPath };
			repoNames[base].push(repoName);
		});
		dotfile.bases[base].repos = repos;
	});
	return [dotfile, repoNames];
};

export const getRepos = async (bases: string[]) => {
	// TODO: Only add bases that aren't in the dotfile
	let repos = [];
	const [dotfile] = await getDotfile();

	if (bases.length > 0) {
		bases.forEach(base => {
			if (base in dotfile.bases) repos = repos.concat(Object.keys(dotfile.bases[base].repos));
			else console.log(chalk.red(`${base} is not a base`));
		});
	} else {
		for (const base in dotfile.bases)
			repos = repos.concat(Object.keys(dotfile.bases[base].repos));
	}
	return repos;
};

// Given a repo, return its base
export const getBase = (repo: string) =>
	Object.keys(getDotfile()[0].bases).find(base => isChildOf(repo, base));

export const filter = (bases: string[]) => {
	const tree = {};
	const paths = [];
	bases.forEach(base => {
		base = path.resolve(et(base));
		if (!fs.existsSync(base)) {
			console.log(chalk.red(`${base} does not exist`));
			return;
		}
		const dirs = base.split(path.sep);
		for (let i = 0; i < dirs.length; i++) {
			if (tree[dirs[i]]) {
				if (tree[dirs[i]].marked) break;
			}

			if (!tree[dirs[i]]) tree[dirs[i]] = {};

			if (i === dirs.length - 1) {
				tree[dirs[i]] = { marked: true };
				paths.push(base);
			}
		}
	});
	return paths;
};

export const listBases = (dotfile: IDotfile) => {
	for (const base of Object.keys(dotfile.bases)) {
		if (!fs.existsSync(base)) {
			rebase();
			break;
		}
	}

	Object.keys(dotfile.bases).forEach(base => console.log(base));
};

export const listRepos = (bases: string[]) =>
	getRepos(bases).then(b => b.forEach(base => console.log(base)));

export const processContextBase = (base: string, dotfile: IDotfile) => {
	// Sets the base as the context base
	const result = fuzzy.filter(base, Object.keys(dotfile.bases));

	if (!result.length)
		return console.log(chalk.red(`Could not match: ${base} to an existing base`));

	dotfile.context.base = result[0].string;
	dotfile.context.repo = {};

	return dumpDotfile(dotfile);
};

export const processContextRepo = (repo: string, dotfile: IDotfile) => {
	// Sets the base as the context base
	const contextBase = dotfile.context.base;
	if (!contextBase) return console.log(chalk.red(`Please set the context`));
	const repoKeys = Object.keys(dotfile.bases[contextBase].repos);
	const result = fuzzy.filter(repo, repoKeys);

	if (!result.length)
		return console.log(
			chalk.red(`Could not match: ${repo} to an existing repo in ${contextBase}`)
		);

	dotfile.context.repo = {
		name: result[0].string,
		path: dotfile.bases[contextBase].repos[result[0].string].path
	};

	return dumpDotfile(dotfile);
};

export const runCommand = (command: string, dotfile: IDotfile) => {
	command = command.replace('git', '').trim();
	const repo = dotfile.context.repo;
	if (!Object.getOwnPropertyNames(repo).length) {
		rebase();
		return console.log(chalk.red(`Context repo is missing!`));
	}

	const spaceEscapedRepo = repo.path.replace(/ /g, '\\ ');
	command = `git -C ${spaceEscapedRepo} ${command}`;

	const code = shell.exec(command).code;
	if (code !== 0) return console.log(chalk.red(`Command: ${command} failed!`));
	return code;
};

// Check if the repo has no commits yet
export const repoEmpty = repo => {
	try {
		const stdout = execSync(`git -C ${repo} status`).toString();
		if (stdout.includes('Initial commit')) return true;
	} catch (error) {
		return false;
	}
	return false;
	// let output = shell.exec(`git -C ${repo} status`, {silent: true});
	// if (output.code === 0 && output.stdout.includes('Initial commit')) return true;
	// return false;
};

// Check if there are edited files
export const commitPending = repo => {
	try {
		const stdout = execSync(`git -C ${repo} status`).toString();
		if (
			stdout.includes('Changes to be committed') ||
			stdout.includes('Changes not staged for commit') ||
			stdout.includes('Untracked files')
		)
			return true;
	} catch (error) {
		return false;
	}
	return false;
};

// Check if there are commits needed to be pushed
export const unpushed = (repo: string) => {
	try {
		const stdout = execSync(`git -C ${repo} log --branches --not --remotes`).toString();
		if (stdout.length > 0) return true;
	} catch (error) {
		return false;
	}
	return false;
};

export const getDotfile = async (): Promise<[IDotfile, boolean]> => {
	// export const getDotfile = () => {
	if (!fs.existsSync(dotpath)) {
		console.log(
			chalk.red(`Error removing bases: ~/.gamma.json has been corrupted. Rebuilding...`)
		);
		const dotfile = init();
		console.log(chalk.green(`~/.gamma.json has been rebuilt`));
		return [await dotfile, true];
	} else return [require(dotpath), false];
};

export const dumpDotfile = (dotfile: IDotfile): Promise<IDotfile> => {
	return new Promise((resolve, reject) => {
		fs.writeFile(dotpath, JSON.stringify(dotfile, null, ''), 'utf8', err => {
			if (err && err.code !== 'ENOENT') {
				console.error(err);
				reject(err);
			}
			resolve(dotfile);
		});
	});
};
