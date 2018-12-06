"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const et = require("expand-tilde");
const path = require("path");
const chalk_1 = require("chalk");
const fs = require("fs");
const glob = require("glob");
const shell = require("shelljs");
const fuzzy = require("fuzzy");
const commands_1 = require("./commands");
const child_process_1 = require("child_process");
exports.dotpath = et('~/.gamma.json');
exports.isChildOf = (child, parent) => child !== parent && parent.split('/').every((t, i) => child.split('/')[i] === t);
exports.getDirectories = (p) => fs
    .readdirSync(et(p))
    .filter(f => fs.statSync(path.join(p, f)).isDirectory() && !f.startsWith('.'));
exports.findRepos = (bases, dotfile) => {
    const repoNames = {};
    bases.forEach(base => {
        base = path.resolve(et(base));
        const repos = {};
        repoNames[base] = [];
        glob.sync(`${base}/**/.git`, { dot: true }).forEach(repoPath => {
            repoPath = repoPath.slice(0, -5);
            const repoName = path.basename(repoPath);
            repos[repoName] = { base, path: repoPath };
            repoNames[base].push(repoName);
        });
        dotfile.bases[base].repos = repos;
    });
    return [dotfile, repoNames];
};
exports.getRepos = (bases) => __awaiter(this, void 0, void 0, function* () {
    let repos = [];
    const [dotfile] = yield exports.getDotfile();
    if (bases.length > 0) {
        bases.forEach(base => {
            if (base in dotfile.bases)
                repos = repos.concat(Object.keys(dotfile.bases[base].repos));
            else
                console.log(chalk_1.default.red(`${base} is not a base`));
        });
    }
    else {
        for (const base in dotfile.bases)
            repos = repos.concat(Object.keys(dotfile.bases[base].repos));
    }
    return repos;
});
exports.getBase = (repo) => Object.keys(exports.getDotfile()[0].bases).find(base => exports.isChildOf(repo, base));
exports.filter = (bases) => {
    const tree = {};
    const paths = [];
    bases.forEach(base => {
        base = path.resolve(et(base));
        if (!fs.existsSync(base)) {
            console.log(chalk_1.default.red(`${base} does not exist`));
            return;
        }
        const dirs = base.split(path.sep);
        for (let i = 0; i < dirs.length; i++) {
            if (tree[dirs[i]]) {
                if (tree[dirs[i]].marked)
                    break;
            }
            if (!tree[dirs[i]])
                tree[dirs[i]] = {};
            if (i === dirs.length - 1) {
                tree[dirs[i]] = { marked: true };
                paths.push(base);
            }
        }
    });
    return paths;
};
exports.listBases = (dotfile) => {
    for (const base of Object.keys(dotfile.bases)) {
        if (!fs.existsSync(base)) {
            commands_1.rebase();
            break;
        }
    }
    Object.keys(dotfile.bases).forEach(base => console.log(base));
};
exports.listRepos = (bases) => exports.getRepos(bases).then(b => b.forEach(base => console.log(base)));
exports.processContextBase = (base, dotfile) => {
    const result = fuzzy.filter(base, Object.keys(dotfile.bases));
    if (!result.length)
        return console.log(chalk_1.default.red(`Could not match: ${base} to an existing base`));
    dotfile.context.base = result[0].string;
    dotfile.context.repo = {};
    return exports.dumpDotfile(dotfile);
};
exports.processContextRepo = (repo, dotfile) => {
    const contextBase = dotfile.context.base;
    if (!contextBase)
        return console.log(chalk_1.default.red(`Please set the context`));
    const repoKeys = Object.keys(dotfile.bases[contextBase].repos);
    const result = fuzzy.filter(repo, repoKeys);
    if (!result.length)
        return console.log(chalk_1.default.red(`Could not match: ${repo} to an existing repo in ${contextBase}`));
    dotfile.context.repo = {
        name: result[0].string,
        path: dotfile.bases[contextBase].repos[result[0].string].path
    };
    return exports.dumpDotfile(dotfile);
};
exports.runCommand = (command, dotfile) => {
    command = command.replace('git', '').trim();
    const repo = dotfile.context.repo;
    if (!Object.getOwnPropertyNames(repo).length) {
        commands_1.rebase();
        return console.log(chalk_1.default.red(`Context repo is missing!`));
    }
    const spaceEscapedRepo = repo.path.replace(/ /g, '\\ ');
    command = `git -C ${spaceEscapedRepo} ${command}`;
    const code = shell.exec(command).code;
    if (code !== 0)
        return console.log(chalk_1.default.red(`Command: ${command} failed!`));
    return code;
};
exports.repoEmpty = repo => {
    try {
        const stdout = child_process_1.execSync(`git -C ${repo} status`).toString();
        if (stdout.includes('Initial commit'))
            return true;
    }
    catch (error) {
        return false;
    }
    return false;
};
exports.commitPending = repo => {
    try {
        const stdout = child_process_1.execSync(`git -C ${repo} status`).toString();
        if (stdout.includes('Changes to be committed') ||
            stdout.includes('Changes not staged for commit') ||
            stdout.includes('Untracked files'))
            return true;
    }
    catch (error) {
        return false;
    }
    return false;
};
exports.unpushed = (repo) => {
    try {
        const stdout = child_process_1.execSync(`git -C ${repo} log --branches --not --remotes`).toString();
        if (stdout.length > 0)
            return true;
    }
    catch (error) {
        return false;
    }
    return false;
};
exports.getDotfile = () => __awaiter(this, void 0, void 0, function* () {
    if (!fs.existsSync(exports.dotpath)) {
        console.log(chalk_1.default.red(`Error removing bases: ~/.gamma.json has been corrupted. Rebuilding...`));
        const dotfile = commands_1.init();
        console.log(chalk_1.default.green(`~/.gamma.json has been rebuilt`));
        return [yield dotfile, true];
    }
    else
        return [require(exports.dotpath), false];
});
exports.dumpDotfile = (dotfile) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(exports.dotpath, JSON.stringify(dotfile, null, ''), 'utf8', err => {
            if (err && err.code !== 'ENOENT') {
                console.error(err);
                reject(err);
            }
            resolve(dotfile);
        });
    });
};
//# sourceMappingURL=helpers.js.map