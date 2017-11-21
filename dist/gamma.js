#!/usr/bin/env node
'use strict';var _commander=require('commander');var _commander2=_interopRequireDefault(_commander);var _commands=require('./commands');function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}var initProgram=function initProgram(){_commander2.default.version('0.0.4');_commander2.default.command('list [bases...]').alias('l').option('-b, --bases','Lists the bases',true).option('-c, --context','Lists the current context',false).description('List all git repos in the base(s)').action(_commands.list);_commander2.default.command('search <base>').alias('s').description('Fuzzy matches a git repo inside the context base').action(_commands.search);_commander2.default.command('init').alias('i').description('Initializes the gamma dotfile').action(_commands.init);_commander2.default.command('install').alias('ins').description('Installs the \'ad\' command, which cd\'s into a git repo fuzzy matching a repo in the context base').action(_commands.install);_commander2.default.command('add <base> [otherBases...]').alias('a').description('Adds the specified bases as well as all git repos in them').action(_commands.add);_commander2.default.command('remove <base> [otherBases...]').alias('r').description('Removes the specified bases from Gamma').action(_commands.remove);_commander2.default.command('set').option('-b, --base <base>','Sets the base of the context. Can fuzzy match base').option('-r, --repo <repo>','Sets the repo within the base of the context. Can fuzy match repo').description('Set the base and/or repo of the context. Supports fuzzy matching').action(_commands.set);_commander2.default.command('run').option('-c, --command <command>','Runs a git command in the context repo. NOTE: Put command inside of single quotes.').description('Runs a git command in the context repo').allowUnknownOption(true).action(_commands.run);_commander2.default.command('rebase [bases...]').alias('re').description('Rescan base(s) and removes any base or repo that does not exist anymore').action(_commands.rebase);_commander2.default.command('daemon').alias('d').description('Runs background process that maintains all bases and their repos').action(_commands.daemon);_commander2.default.command('status').alias('st').description('Prints the status of each repo in each base').action(_commands.status);};initProgram();_commander2.default.parse(process.argv);