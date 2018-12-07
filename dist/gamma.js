#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const commands_1 = require("./commands");
const logger_1 = require("./logger");
const initProgram = () => {
    program.version('0.0.7');
    program.option('-s, --silent', 'Silence all output', false).on('option:silent', function () {
        logger_1.logger.silent = this.silent;
    });
    program
        .command('list [bases...]')
        .alias('l')
        .option('-b, --bases', 'Lists the bases', true)
        .option('-c, --context', 'Lists the current context', false)
        .description('List all git repos in the base(s)')
        .action(commands_1.list);
    program
        .command('search <base>')
        .alias('s')
        .description('Fuzzy matches a git repo inside the context base')
        .action(commands_1.search);
    program
        .command('init')
        .alias('i')
        .description('Initializes the gamma dotfile')
        .action(commands_1.init);
    program
        .command('install')
        .alias('ins')
        .description(`Installs the 'ad' command, which cd's into a git repo fuzzy matching a repo in the context base`)
        .action(commands_1.install);
    program
        .command('add <bases...>')
        .alias('a')
        .description('Adds the specified bases as well as all git repos in them')
        .action(commands_1.add);
    program
        .command('remove <base> [otherBases...]')
        .alias('r')
        .description('Removes the specified bases from Gamma')
        .action(commands_1.remove);
    program
        .command('set')
        .alias('se')
        .option('-b, --base <base>', 'Sets the base of the context. Can fuzzy match base')
        .option('-r, --repo <repo>', 'Sets the repo within the base of the context. Can fuzy match repo')
        .description('Set the base and/or repo of the context. Supports fuzzy matching')
        .action(commands_1.set);
    program
        .command('run')
        .alias('ru')
        .option('-c, --command <command>', 'Runs a git command in the context repo. NOTE: Put command inside of single quotes.')
        .description('Runs a git command in the context repo')
        .allowUnknownOption(true)
        .action(commands_1.run);
    program
        .command('rebase [bases...]')
        .alias('re')
        .description('Rescan base(s) and removes any base or repo that does not exist anymore')
        .action(commands_1.rebase);
    program
        .command('daemon')
        .alias('d')
        .description('Runs background process that maintains all bases and their repos')
        .action(commands_1.daemon);
    program
        .command('status')
        .alias('st')
        .description('Prints the status of each repo in each base')
        .action(commands_1.status);
    program
        .command('test')
        .alias('t')
        .description('This is a test')
        .action(commands_1.test);
};
initProgram();
program.parse(process.argv);
//# sourceMappingURL=gamma.js.map