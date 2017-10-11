#!/usr/bin/env node
'use strict';var _slicedToArray=function(){function sliceIterator(arr,i){var _arr=[];var _n=true;var _d=false;var _e=undefined;try{for(var _i=arr[Symbol.iterator](),_s;!(_n=(_s=_i.next()).done);_n=true){_arr.push(_s.value);if(i&&_arr.length===i)break}}catch(err){_d=true;_e=err}finally{try{if(!_n&&_i['return'])_i['return']()}finally{if(_d)throw _e}}return _arr}return function(arr,i){if(Array.isArray(arr)){return arr}else if(Symbol.iterator in Object(arr)){return sliceIterator(arr,i)}else{throw new TypeError('Invalid attempt to destructure non-iterable instance')}}}();var _commander=require('commander');var _commander2=_interopRequireDefault(_commander);var _expandTilde=require('expand-tilde');var _expandTilde2=_interopRequireDefault(_expandTilde);var _path=require('path');var _path2=_interopRequireDefault(_path);var _chalk=require('chalk');var _chalk2=_interopRequireDefault(_chalk);var _fs=require('fs');var _fs2=_interopRequireDefault(_fs);var _glob=require('glob');var _glob2=_interopRequireDefault(_glob);var _shelljs=require('shelljs');var _shelljs2=_interopRequireDefault(_shelljs);var _readline=require('readline');var _readline2=_interopRequireDefault(_readline);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}// Path to the dotfile
var dotpath=(0,_expandTilde2.default)('~/.gamma.json');// Autocomplete suggestions
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
var isChildOf=function isChildOf(child,parent){return child!==parent&&parent.split('/').every(function(t,i){return child.split('/')[i]===t})};var getDotfile=function getDotfile(){if(!_fs2.default.existsSync(dotpath)){console.log(_chalk2.default.red('Error removing bases: ~/.gamma.json has been corrupted. Rebuilding...'));var dotfile=init();console.log(_chalk2.default.green('~/.gamma.json has been rebuilt'));return[dotfile,true]}else return[require(dotpath),false]};var findRepos=function findRepos(){var bases=arguments.length>0&&arguments[0]!==undefined?arguments[0]:[];var dotfile=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{};var repo_names={};bases.forEach(function(base){base=_path2.default.resolve((0,_expandTilde2.default)(base));var repos={};repo_names[base]=[];_glob2.default.sync(base+'/**/.git',{dot:true}).forEach(function(repo_path){// Cut off /.git from the filename
repo_path=repo_path.slice(0,-5);var repo_name=_path2.default.basename(repo_path);repos[repo_name]={'base':base,'path':repo_path};repo_names[base].push(repo_name)});dotfile['bases'][base]['repos']=repos});return[dotfile,repo_names]};var getRepos=function getRepos(){var bases=arguments.length>0&&arguments[0]!==undefined?arguments[0]:[];// TODO: Only add bases that aren't in the dotfile
var repos=[];var _getDotfile=getDotfile(),_getDotfile2=_slicedToArray(_getDotfile,1),dotfile=_getDotfile2[0];if(bases.length>0){bases.forEach(function(base){if(base in dotfile['bases'])repos=repos.concat(Object.keys(dotfile['bases'][base]['repos']));else console.log(_chalk2.default.red(base+' is not a base'))})}else{for(var base in dotfile['bases']){repos=repos.concat(Object.keys(dotfile['bases'][base]['repos']))}}return repos};var filter=function filter(){var bases=arguments.length>0&&arguments[0]!==undefined?arguments[0]:[];var tree={};var paths=[];bases.forEach(function(base){base=_path2.default.resolve((0,_expandTilde2.default)(base));if(!_fs2.default.existsSync(base)){console.log(_chalk2.default.red(base+' does not exist'));return}var dirs=base.split(_path2.default.sep);for(var i=0;i<dirs.length;i++){if(tree[dirs[i]]){if(tree[dirs[i]]['marked'])break}if(!tree[dirs[i]])tree[dirs[i]]={};if(i==dirs.length-1){tree[dirs[i]]={'marked':true};paths.push(base)}}});return paths};var listBases=function listBases(dotfile){return Object.keys(dotfile['bases']).forEach(function(base){return console.log(base)})};var listRepos=function listRepos(){var bases=arguments.length>0&&arguments[0]!==undefined?arguments[0]:[];return getRepos(bases).forEach(function(base){return console.log(base)})};var processContextBase=function processContextBase(base,dotfile){// Sets the base as the context base
base=_path2.default.resolve((0,_expandTilde2.default)(base));if(!_fs2.default.existsSync(base))return console.log(_chalk2.default.red(base+' does not exist'));if(!Object.keys(dotfile['bases']).includes(base))return console.log(_chalk2.default.red('Please add: '+base+' before attempting to set it to the context base'));dotfile['context']['base']=base;_fs2.default.writeFile(dotpath,JSON.stringify(dotfile,null,'\t'),'utf8',function(err){if(err){console.error(err)}});return dotfile};var processContextRepo=function processContextRepo(repo,dotfile){// Sets the base as the context base
var contextBase=dotfile['context']['base'];var repoKeys=Object.keys(dotfile['bases'][contextBase]['repos']);var repoIndex=repoKeys.indexOf(repo);if(repoIndex<0)return console.log(_chalk2.default.red(repo+' is not repo in the context base: '+contextBase));dotfile['context']['repo']={name:repoKeys[repoIndex],path:dotfile['bases'][contextBase]['repos'][repoKeys[repoIndex]]['path']};_fs2.default.writeFile(dotpath,JSON.stringify(dotfile,null,'\t'),'utf8',function(err){if(err){console.error(err)}});return dotfile};var runCommand=function runCommand(){var command=arguments.length>0&&arguments[0]!==undefined?arguments[0]:'';var dotfile=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{};command=command.replace('git','').trim();var repo=dotfile['context']['repo']['path'];if(!repo)return console.log(_chalk2.default.red('Context repo is missing!'));command='git -C '+repo+' '+command;var code=_shelljs2.default.exec(command).code;if(code!==0)return console.log(_chalk2.default.red('Command: '+command+' failed!'));return code};// CLI commands
var add=function add(){var base=arguments.length>0&&arguments[0]!==undefined?arguments[0]:'';var bases=arguments.length>1&&arguments[1]!==undefined?arguments[1]:[];//Adds the bases and finds all repos in it.
// Attempt to load the dotfile
var repos=void 0,repo_names=[];var _getDotfile3=getDotfile(),_getDotfile4=_slicedToArray(_getDotfile3,1),dotfile=_getDotfile4[0];bases=bases.concat(base);// TODO: Add a spinner because glob is slow
console.log(_chalk2.default.yellow('Adding bases...'));// Get the absolute path of the bases and filter/validate them
bases=filter(bases.map(function(b){return _path2.default.resolve((0,_expandTilde2.default)(b))}).sort(function(a,b){return a.length-b.length}));var to_index=[];bases.forEach(function(base){// Check to see if the base is not contained in another base
var is_subdir=false;var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=Object.keys(dotfile['bases'])[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){var b=_step.value;// If the base trying to be added is a subdirectory of an existing base, skip it
if(isChildOf(base,b)){console.log(_chalk2.default.red(base+' is inside another base: '+b));is_subdir=true;break}// If the base trying to be added is a parent directory of an existing base, delete the sub directory
if(isChildOf(b,base)){console.log(_chalk2.default.red(b+' is inside another base: '+base));if(to_index.indexOf(b)>=0)to_index.remove(b);if(b in dotfile['bases'])delete dotfile['bases'][b];break}}// If base is a unique directory, not in another base, add it to the dotfile
}catch(err){_didIteratorError=true;_iteratorError=err}finally{try{if(!_iteratorNormalCompletion&&_iterator.return){_iterator.return()}}finally{if(_didIteratorError){throw _iteratorError}}}if(!is_subdir){dotfile['bases'][base]={'repos':{}};to_index.push(base)}});// Index the new bases for repos
// Format the output and print it
var _findRepos=findRepos(to_index,dotfile);var _findRepos2=_slicedToArray(_findRepos,2);dotfile=_findRepos2[0];repo_names=_findRepos2[1];Object.keys(repo_names).forEach(function(base){console.log(_chalk2.default.green('Base added: '+base));var names=repo_names[base].map(function(name,num){return'  '+(num+1)+') '+name}).join('\n');console.log(_chalk2.default.green('Repos added: \n'+(names?names:'  None')))});// Write the dotfile back
_fs2.default.writeFile(dotpath,JSON.stringify(dotfile,null,'\t'),'utf8',function(err){if(err){console.error(err)}});return dotfile};var remove=function remove(){var base=arguments.length>0&&arguments[0]!==undefined?arguments[0]:'';var bases=arguments.length>1&&arguments[1]!==undefined?arguments[1]:[];// Removes a base, including all repos in it
var dotfile=void 0,error=void 0;var _getDotfile5=getDotfile();var _getDotfile6=_slicedToArray(_getDotfile5,2);dotfile=_getDotfile6[0];error=_getDotfile6[1];if(error)return dotfile;bases.concat(base).forEach(function(base){var base_path=_path2.default.resolve((0,_expandTilde2.default)(base));if(base_path in dotfile['bases']){var names=Object.keys(dotfile['bases'][base_path]['repos']).map(function(name,num){return'  '+(num+1)+') '+name}).join('\n');delete dotfile['bases'][base_path];console.log(_chalk2.default.red('Base deleted: '+base_path));if(names)console.log(_chalk2.default.red('Repos deleted: \n'+names))}else console.log(_chalk2.default.red(base_path+' is not a base'))});_fs2.default.writeFile(dotpath,JSON.stringify(dotfile,null,'\t'),'utf8',function(err){if(err){console.error(err)}});return dotfile};var init=function init(){// Initializes the gamma dofile and persists to disk
var content={'bases':{},'context':{'base':'','repo':''}};_fs2.default.writeFile(dotpath,JSON.stringify(content,null,'\t'),'utf8',function(err){if(err){console.error(err)}});return content};var list=function list(){var bases=arguments.length>0&&arguments[0]!==undefined?arguments[0]:[];var options=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{};var _getDotfile7=getDotfile(),_getDotfile8=_slicedToArray(_getDotfile7,1),dotfile=_getDotfile8[0];if(options.bases)return listBases(dotfile);if(options.context)return console.log('Base: '+dotfile['context']['base']+'\nRepo: '+(dotfile['context']['repo']['name']?dotfile['context']['repo']['name']:''));return listRepos(bases)};var search=function search(){var base=arguments.length>0&&arguments[0]!==undefined?arguments[0]:'';base=_path2.default.resolve((0,_expandTilde2.default)(base));console.log(_chalk2.default.yellow('Searching '+base+' for all repos'));_glob2.default.sync(base+'/**/.git',{dot:true}).forEach(function(repo_path){return console.log(repo_path.slice(0,-5))})};var set=function set(options){var _getDotfile9=getDotfile(),_getDotfile10=_slicedToArray(_getDotfile9,1),dotfile=_getDotfile10[0];if(options.base)processContextBase(options.base,dotfile);if(options.repo)processContextRepo(options.repo,dotfile)};var run=function run(options){var _getDotfile11=getDotfile(),_getDotfile12=_slicedToArray(_getDotfile11,2),dotfile=_getDotfile12[0],error=_getDotfile12[1];if(error)return;if(options.command)return runCommand(options.command,dotfile);var i=_readline2.default.createInterface(process.stdin,process.stdout,null);i.question('Command: ',function(){var command=arguments.length>0&&arguments[0]!==undefined?arguments[0]:'';runCommand(command,dotfile);i.close();process.stdin.destroy()})};var initProgram=function initProgram(){_commander2.default.command('list [bases...]').alias('l').option('-b, --bases','Lists the bases',false).option('-c, --context','Lists the current context',false).description('List all git repos by base').action(list);_commander2.default.command('search <base>').alias('s').description('Returns the paths for all git repos in the given base').action(search);_commander2.default.command('init').alias('i').description('Initializes the gamma dotfile').action(init);_commander2.default.command('add <base> [otherBases...]').alias('a').description('Adds the specified bases as well as all git repos in them').action(add);_commander2.default.command('remove <base> [otherBases...]').alias('r').description('Removes the specified bases from Gamma').action(remove);_commander2.default.command('set').option('-b, --base <base>','Sets the base of the context').option('-r, --repo <repo>','Sets the repo within the base of the context').description('Set the base or repo of the context').action(set);_commander2.default.command('run').option('-c, --command <Command>','Runs a git command in the context repo. NOTE: Put command inside of single quotes.').description('Runs a git command in the context').allowUnknownOption(true).action(run)};initProgram();_commander2.default.parse(process.argv);