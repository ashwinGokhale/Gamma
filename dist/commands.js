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
const logger_1 = require("./logger");
exports.add = (bases) => __awaiter(this, void 0, void 0, function* () {
    const [dotfile] = yield helpers_1.getDotfile();
    logUpdate(chalk_1.default.yellow('Adding bases...'));
    bases = helpers_1.filter(bases.map(b => path.resolve(et(b))).sort((a, b) => a.length - b.length));
    let toIndex = [];
    bases.forEach(base => {
        let isSubdir = false;
        for (const b of Object.keys(dotfile.bases)) {
            if (helpers_1.isChildOf(base, b)) {
                logger_1.logger.info(chalk_1.default.red(`${base} is inside another base: ${b}`));
                isSubdir = true;
                break;
            }
            if (helpers_1.isChildOf(b, base)) {
                logger_1.logger.info(chalk_1.default.red(`${b} is inside another base: ${base}`));
                if (toIndex.indexOf(b) >= 0)
                    toIndex = toIndex.filter(p => p !== b);
                if (b in dotfile.bases)
                    delete dotfile.bases[b];
                break;
            }
        }
        if (!isSubdir) {
            dotfile.bases[base] = { repos: {} };
            toIndex.push(base);
        }
    });
    const [updatedDotfile, basesWithRepoNames] = helpers_1.findRepos(toIndex, dotfile);
    logUpdate.clear();
    Object.keys(basesWithRepoNames).forEach(base => {
        logger_1.logger.info(chalk_1.default.green(`Base added: ${base}`));
        const names = basesWithRepoNames[base]
            .map((name, num) => `  ${num + 1}) ${name}`)
            .join('\n');
        logger_1.logger.info(chalk_1.default.green(`Repos added: \n${names ? names : '  None'}`));
    });
    return helpers_1.dumpDotfile(updatedDotfile);
});
exports.remove = (base, bases) => __awaiter(this, void 0, void 0, function* () {
    child_process_1.spawn('gamma', ['rebase'], { detached: true, stdio: 'ignore' }).unref();
    const [dotfile, error] = yield helpers_1.getDotfile();
    if (error)
        return dotfile;
    bases.concat(base).forEach(base => {
        const basePath = path.resolve(et(base));
        if (base === dotfile.context.base)
            dotfile.context = { base: '', repo: {} };
        if (basePath in dotfile.bases) {
            const names = Object.keys(dotfile.bases[basePath].repos)
                .map((name, num) => `  ${num + 1}) ${name}`)
                .join('\n');
            delete dotfile.bases[basePath];
            logger_1.logger.info(chalk_1.default.red(`Base deleted: ${basePath}`));
            if (names)
                logger_1.logger.info(chalk_1.default.red(`Repos deleted: \n${names}`));
        }
        else
            logger_1.logger.info(chalk_1.default.red(`${basePath} is not a base`));
    });
    return helpers_1.dumpDotfile(dotfile);
});
exports.init = () => __awaiter(this, void 0, void 0, function* () {
    const content = { bases: {}, context: { base: '', repo: {} } };
    return yield helpers_1.dumpDotfile(content);
});
exports.list = (bases, options) => __awaiter(this, void 0, void 0, function* () {
    child_process_1.spawn('gamma', ['rebase'], { detached: true, stdio: 'ignore' }).unref();
    const [dotfile] = yield helpers_1.getDotfile();
    if (options.bases)
        return helpers_1.listBases(dotfile);
    if (options.context)
        return logger_1.logger.info(`Base: ${dotfile.context.base ? dotfile.context.base : ''}\nRepo: ${dotfile.context.repo.name ? dotfile.context.repo.name : ''}`);
    return helpers_1.listRepos(bases);
});
exports.search = (base) => __awaiter(this, void 0, void 0, function* () {
    child_process_1.spawn('gamma', ['rebase'], { detached: true, stdio: 'ignore' }).unref();
    const [dotfile] = yield helpers_1.getDotfile();
    const repos = [];
    Object.keys(dotfile.bases).forEach(b => Object.entries(dotfile.bases[b].repos).forEach(key => repos.push(key[1].path)));
    const filtered = fuzzy.filter(base, repos);
    filtered.length ? logger_1.logger.info(filtered[0].string) : logger_1.logger.info('');
});
exports.set = (options) => __awaiter(this, void 0, void 0, function* () {
    const [dotfile] = yield helpers_1.getDotfile();
    let context;
    if (options.base) {
        const baseContext = helpers_1.processContextBase(options.base, dotfile);
        context = baseContext ? baseContext : context;
    }
    if (options.repo) {
        const repoContext = helpers_1.processContextRepo(options.repo, dotfile);
        context = repoContext ? repoContext : context;
    }
    if (context) {
        logger_1.logger.info(chalk_1.default.green(`Updated context:`));
        exports.list(null, { context: true });
    }
});
exports.run = (...options) => __awaiter(this, void 0, void 0, function* () {
    const [dotfile, error] = yield helpers_1.getDotfile();
    if (error)
        return;
    const option = options[options.length - 1];
    if (option.command && typeof option.command === 'string') {
        helpers_1.runCommand(option.command, dotfile);
        return;
    }
    while (true) {
        const { command } = (yield inquirer.prompt({
            type: 'input',
            name: 'command',
            message: 'Command: '
        }));
        if (command && command !== 'q' && command !== 'quit')
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
    logger_1.logger.info(COMMAND_INFO);
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
    const command = `\n\n${name}(){cd $(gamma search $1)}`;
    const messages = [];
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
    if (!messages.length) {
        logger_1.logger.info(`Did not install the ${name} command`);
        return;
    }
    messages.forEach(message => logger_1.logger.info(message));
});
exports.rebase = (bases) => __awaiter(this, void 0, void 0, function* () {
    let [dotfile, error] = yield helpers_1.getDotfile();
    if (error)
        return dotfile;
    const dotBases = Object.keys(dotfile.bases);
    bases = bases.length
        ? bases.map(b => path.resolve(et(b))).filter(base => dotfile.bases[base])
        : dotBases;
    logUpdate(chalk_1.default.yellow(`Reindexing bases...`));
    const original = {};
    Object.keys(dotfile.bases).forEach(base => (original[base] = Object.keys(dotfile.bases[base].repos)));
    let repoNames;
    [dotfile, repoNames] = helpers_1.findRepos(bases, dotfile);
    logUpdate.clear();
    Object.keys(original).forEach(base => {
        const reposAdded = repoNames[base]
            .filter(b => !original[base].includes(b))
            .map((name, num) => `  ${num + 1}) ${name}`)
            .join('\n');
        const reposRemoved = original[base]
            .filter(b => !repoNames[base].includes(b))
            .map((name, num) => `  ${num + 1}) ${name}`)
            .join('\n');
        if (fs.existsSync(base)) {
            logger_1.logger.info(`Base reindexed: ${base}`);
            logger_1.logger.info(chalk_1.default.green(`Repos added: \n${reposAdded ? reposAdded : '  None'}`));
        }
        else {
            logger_1.logger.info(chalk_1.default.red(`${base} does not exist`));
            delete dotfile.bases[base];
        }
        logger_1.logger.info(chalk_1.default.red(`Repos removed: \n${reposRemoved ? reposRemoved : '  None'}`));
    });
    if (dotfile.context.base && !fs.existsSync(dotfile.context.base))
        dotfile.context = { base: '', repo: {} };
    if (dotfile.context.repo && !fs.existsSync(dotfile.context.repo.path))
        dotfile.context.repo = {};
    return helpers_1.dumpDotfile(dotfile);
});
exports.daemon = () => {
    ps.lookup({ command: 'node', arguments: ['gamma', 'daemon'] }, (err, processes) => {
        if (err)
            return console.error(err);
        if (processes.length > 1)
            return;
        logger_1.logger.info(`Gamma deamon started`);
        chokidar
            .watch(Object.keys(helpers_1.getDotfile()[0].bases), {
            ignored: /(^|\/)\.[^\/\.]|(node_modules)/gm
        })
            .on('addDir', (dirPath) => __awaiter(this, void 0, void 0, function* () {
            const [dotfile] = yield helpers_1.getDotfile();
            if (!/(\.git(\0|\/|\n|\r))/gm.exec(dirPath))
                return;
            if (shell.exec(`git -C ${dirPath} rev-parse`).code !== 0)
                return;
            dirPath = dirPath.substring(0, dirPath.indexOf('.git') - 1);
            const dirName = path.basename(dirPath);
            const base = helpers_1.getBase(dirPath);
            if (dotfile.bases[base].repos[dirName])
                return;
            dotfile.bases[base].repos[dirName] = {
                base,
                path: dirPath
            };
            helpers_1.dumpDotfile(dotfile);
            return;
        }))
            .on('unlinkDir', (dirPath) => __awaiter(this, void 0, void 0, function* () {
            const [dotfile] = yield helpers_1.getDotfile();
            for (const base of Object.keys(dotfile.bases)) {
                if (!helpers_1.isChildOf(dirPath, base))
                    continue;
                if (!dotfile.bases[base].repos[path.basename(dirPath)])
                    continue;
                delete dotfile.bases[base].repos[path.basename(dirPath)];
                helpers_1.dumpDotfile(dotfile);
                break;
            }
        }));
    });
};
exports.status = () => __awaiter(this, void 0, void 0, function* () {
    const [dotfile, error] = yield helpers_1.getDotfile();
    if (error)
        return dotfile;
    child_process_1.spawn('gamma', ['rebase'], { detached: true, stdio: 'ignore' }).unref();
    const names = [];
    Object.keys(dotfile.bases).forEach(base => Object.keys(dotfile.bases[base].repos)
        .concat(`Base: ${base}`)
        .forEach(repo => names.push(repo)));
    const pad = names.reduce((r, s) => (r > s.length ? r : s.length), 0);
    Object.keys(dotfile.bases).forEach(base => {
        logger_1.logger.info(chalk_1.default.magenta(`Base: ${base}${' '.repeat(Math.abs(pad - base.length + 5))}Status`));
        Object.keys(dotfile.bases[base].repos).forEach(repoName => {
            const repo = dotfile.bases[base].repos[repoName].path.replace(/ /g, '\\ ');
            const messages = [];
            if (helpers_1.repoEmpty(repo))
                messages.push(chalk_1.default.green('Empty'));
            if (helpers_1.commitPending(repo))
                messages.push(chalk_1.default.blue('Uncommitted'));
            if (helpers_1.unpushed(repo))
                messages.push(chalk_1.default.yellow('Unpushed'));
            if (!messages.length)
                messages.push(chalk_1.default.green('Up to date'));
            logger_1.logger.info(`${repoName}${' '.repeat(Math.abs(pad - repoName.length + 11))}${messages.join(' | ')}`);
        });
        logger_1.logger.info('');
    });
    return dotfile;
});
exports.test = bases => {
    logger_1.logger.info('Testing just changed:', bases);
};
//# sourceMappingURL=commands.js.map