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
const shell = require("shelljs");
const inquirer = require("inquirer");
const fuzzy = require("fuzzy");
const chokidar = require("chokidar");
const ps = require("ps-node");
const logUpdate = require("log-update");
const child_process_1 = require("child_process");
const helpers_1 = require("./helpers");
exports.add = (base, bases) => {
    let repos, repo_names = [];
    let [dotfile] = helpers_1.getDotfile();
    bases = bases.concat(base);
    logUpdate(chalk_1.default.yellow('Adding bases...'));
    bases = helpers_1.filter(bases.map(b => path.resolve(et(b))).sort((a, b) => a.length - b.length));
    let to_index = [];
    bases.forEach(base => {
        let is_subdir = false;
        for (let b of Object.keys(dotfile['bases'])) {
            if (helpers_1.isChildOf(base, b)) {
                console.log(chalk_1.default.red(`${base} is inside another base: ${b}`));
                is_subdir = true;
                break;
            }
            if (helpers_1.isChildOf(b, base)) {
                console.log(chalk_1.default.red(`${b} is inside another base: ${base}`));
                if (to_index.indexOf(b) >= 0)
                    to_index = to_index.filter(p => p !== b);
                if (b in dotfile['bases'])
                    delete dotfile['bases'][b];
                break;
            }
        }
        if (!is_subdir) {
            dotfile['bases'][base] = { repos: {} };
            to_index.push(base);
        }
    });
    [dotfile, repo_names] = helpers_1.findRepos(to_index, dotfile);
    logUpdate.clear();
    Object.keys(repo_names).forEach(base => {
        console.log(chalk_1.default.green(`Base added: ${base}`));
        let names = repo_names[base].map((name, num) => `  ${num + 1}) ${name}`).join('\n');
        console.log(chalk_1.default.green(`Repos added: \n${names ? names : '  None'}`));
    });
    return helpers_1.dumpDotfile(dotfile);
};
exports.remove = (base, bases) => {
    child_process_1.spawn('gamma', ['rebase'], { detached: true, stdio: 'ignore' }).unref();
    let [dotfile, error] = helpers_1.getDotfile();
    if (error)
        return dotfile;
    bases.concat(base).forEach(base => {
        let base_path = path.resolve(et(base));
        if (base == dotfile['context']['base'])
            dotfile['context'] = { base: '', repo: {} };
        if (base_path in dotfile['bases']) {
            let names = Object.keys(dotfile['bases'][base_path]['repos'])
                .map((name, num) => `  ${num + 1}) ${name}`)
                .join('\n');
            delete dotfile['bases'][base_path];
            console.log(chalk_1.default.red(`Base deleted: ${base_path}`));
            if (names)
                console.log(chalk_1.default.red(`Repos deleted: \n${names}`));
        }
        else
            console.log(chalk_1.default.red(`${base_path} is not a base`));
    });
    return helpers_1.dumpDotfile(dotfile);
};
exports.init = () => {
    let content = { bases: {}, context: { base: '', repo: {} } };
    return helpers_1.dumpDotfile(content);
};
exports.list = (bases, options) => {
    child_process_1.spawn('gamma', ['rebase'], { detached: true, stdio: 'ignore' }).unref();
    let [dotfile] = helpers_1.getDotfile();
    if (options.bases)
        return helpers_1.listBases(dotfile);
    if (options.context)
        return console.log(`Base: ${dotfile['context']['base'] ? dotfile['context']['base'] : ''}\nRepo: ${dotfile['context']['repo']['name'] ? dotfile['context']['repo']['name'] : ''}`);
    return helpers_1.listRepos(bases);
};
exports.search = (base) => {
    child_process_1.spawn('gamma', ['rebase'], { detached: true, stdio: 'ignore' }).unref();
    let [dotfile, error] = helpers_1.getDotfile();
    let repos = [];
    Object.keys(dotfile['bases']).forEach(b => Object.entries(dotfile['bases'][b]['repos']).forEach(key => repos.push(key[1]['path'])));
    let filtered = fuzzy.filter(base, repos);
    filtered.length ? console.log(filtered[0].string) : console.log('');
};
exports.set = options => {
    let [dotfile] = helpers_1.getDotfile();
    let context;
    if (options.base) {
        let baseContext = helpers_1.processContextBase(options.base, dotfile);
        context = baseContext ? baseContext : context;
    }
    if (options.repo) {
        let repoContext = helpers_1.processContextRepo(options.repo, dotfile);
        context = repoContext ? repoContext : context;
    }
    if (context) {
        console.log(chalk_1.default.green(`Updated context:`));
        exports.list(null, { context: true });
    }
};
exports.run = (...options) => __awaiter(this, void 0, void 0, function* () {
    let [dotfile, error] = helpers_1.getDotfile();
    if (error)
        return;
    const option = options[options.length - 1];
    if (option.command && typeof option.command === 'string')
        return helpers_1.runCommand(option.command, dotfile);
    while (true) {
        let { command } = (yield inquirer.prompt({
            type: 'input',
            name: 'command',
            message: 'Command: '
        }));
        if (command && command != 'q' && command != 'quit')
            helpers_1.runCommand(command, dotfile);
        else
            return;
    }
});
exports.install = () => __awaiter(this, void 0, void 0, function* () {
    const COMMAND_INFO = `
This installs the 'gd' command, which cd's into a git repo fuzzy matching a repo in the context base
Example:
	➜  Dropbox $ ad gam
	➜  Gamma (master) ✗ pwd
	/Users/ashwin/Dropbox/gitHub/Gamma
`;
    console.log(COMMAND_INFO);
    const { confirm } = (yield inquirer.prompt({
        type: 'confirm',
        name: 'confirm',
        message: 'Continue with installation?'
    }));
    if (!confirm)
        return;
    let { name } = (yield inquirer.prompt({
        type: 'input',
        name: 'name',
        message: `Name of the command? (Default: 'gd'): `
    }));
    name = /^[a-z][a-zA-Z0-9_]*$/g.exec(name) ? name : 'gd';
    let command = `\n\n${name}(){cd $(gamma search $1)}`;
    let messages = [];
    for (let shellPath of ['~/.bashrc', '~/.zshrc']) {
        shellPath = path.resolve(et(shellPath));
        const { install } = (yield inquirer.prompt({
            type: 'confirm',
            name: 'install',
            message: `Install ${name} function to ${shellPath}?`
        }));
        if (!install)
            continue;
        try {
            fs.accessSync(shellPath, fs.constants.W_OK);
            fs.appendFileSync(shellPath, command);
            messages.push(chalk_1.default.green(`${name} command has been installed in ${shellPath}`));
        }
        catch (error) {
            messages.push(chalk_1.default.red(`No write access for ${shellPath}`));
        }
    }
    if (!messages.length)
        return console.log(`Did not install the ${name} command`);
    messages.forEach(message => console.log(message));
});
exports.rebase = (bases) => {
    let [dotfile, error] = helpers_1.getDotfile();
    if (error)
        return dotfile;
    let dotBases = Object.keys(dotfile['bases']);
    bases = bases.length
        ? bases.map(b => path.resolve(et(b))).filter(base => dotfile['bases'][base])
        : dotBases;
    logUpdate(chalk_1.default.yellow(`Reindexing bases...`));
    let original = {};
    Object.keys(dotfile['bases']).forEach(base => (original[base] = Object.keys(dotfile['bases'][base]['repos'])));
    let repo_names;
    [dotfile, repo_names] = helpers_1.findRepos(bases, dotfile);
    logUpdate.clear();
    Object.keys(original).forEach(base => {
        let reposAdded = repo_names[base]
            .filter(b => !original[base].includes(b))
            .map((name, num) => `  ${num + 1}) ${name}`)
            .join('\n');
        let reposRemoved = original[base]
            .filter(b => !repo_names[base].includes(b))
            .map((name, num) => `  ${num + 1}) ${name}`)
            .join('\n');
        if (fs.existsSync(base)) {
            console.log(`Base reindexed: ${base}`);
            console.log(chalk_1.default.green(`Repos added: \n${reposAdded ? reposAdded : '  None'}`));
        }
        else {
            console.log(chalk_1.default.red(`${base} does not exist`));
            delete dotfile['bases'][base];
        }
        console.log(chalk_1.default.red(`Repos removed: \n${reposRemoved ? reposRemoved : '  None'}`));
    });
    if (dotfile['context']['base'] && !fs.existsSync(dotfile['context']['base']))
        dotfile['context'] = { base: '', repo: {} };
    if (dotfile['context']['repo'] && !fs.existsSync(dotfile['context']['repo']['path']))
        dotfile['context']['repo'] = {};
    return helpers_1.dumpDotfile(dotfile);
};
exports.daemon = () => {
    ps.lookup({ command: 'node', arguments: ['gamma', 'daemon'] }, (err, processes) => {
        if (err)
            return console.error(err);
        if (processes.length > 1)
            return;
        console.log(`Gamma deamon started`);
        chokidar
            .watch(Object.keys(helpers_1.getDotfile()[0]['bases']), {
            ignored: /(^|\/)\.[^\/\.]|(node_modules)/gm
        })
            .on('addDir', dirPath => {
            let [dotfile, error] = helpers_1.getDotfile();
            if (!/(\.git(\0|\/|\n|\r))/gm.exec(dirPath))
                return;
            if (shell.exec(`git -C ${dirPath} rev-parse`).code != 0)
                return;
            dirPath = dirPath.substring(0, dirPath.indexOf('.git') - 1);
            let dirName = path.basename(dirPath);
            let base = helpers_1.getBase(dirPath);
            if (dotfile['bases'][base]['repos'][dirName])
                return;
            dotfile['bases'][base]['repos'][dirName] = {
                base: base,
                path: dirPath
            };
            helpers_1.dumpDotfile(dotfile);
            return;
        })
            .on('unlinkDir', dirPath => {
            let [dotfile, error] = helpers_1.getDotfile();
            for (let base of Object.keys(dotfile['bases'])) {
                if (!helpers_1.isChildOf(dirPath, base))
                    continue;
                if (!dotfile['bases'][base]['repos'][path.basename(dirPath)])
                    continue;
                delete dotfile['bases'][base]['repos'][path.basename(dirPath)];
                helpers_1.dumpDotfile(dotfile);
                break;
            }
        });
    });
};
exports.status = () => {
    let [dotfile, error] = helpers_1.getDotfile();
    if (error)
        return dotfile;
    child_process_1.spawn('gamma', ['rebase'], { detached: true, stdio: 'ignore' }).unref();
    let names = [];
    Object.keys(dotfile['bases']).forEach(base => Object.keys(dotfile['bases'][base]['repos'])
        .concat(`Base: ${base}`)
        .forEach(repo => names.push(repo)));
    let pad = names.reduce((r, s) => (r > s.length ? r : s.length), 0);
    Object.keys(dotfile['bases']).forEach(base => {
        console.log(chalk_1.default.magenta(`Base: ${base}${' '.repeat(Math.abs(pad - base.length + 5))}Status`));
        Object.keys(dotfile['bases'][base]['repos']).forEach(repoName => {
            let repo = dotfile['bases'][base]['repos'][repoName]['path'].replace(/ /g, '\\ ');
            let messages = [];
            if (helpers_1.repoEmpty(repo))
                messages.push(chalk_1.default.green('Empty'));
            if (helpers_1.commitPending(repo))
                messages.push(chalk_1.default.blue('Uncommitted'));
            if (helpers_1.unpushed(repo))
                messages.push(chalk_1.default.yellow('Unpushed'));
            if (!messages.length)
                messages.push(chalk_1.default.green('Up to date'));
            console.log(`${repoName}${' '.repeat(Math.abs(pad - repoName.length + 11))}${messages.join(' | ')}`);
        });
        console.log();
    });
    return dotfile;
};
exports.test = () => {
    console.log('Testing');
};
//# sourceMappingURL=commands.js.map