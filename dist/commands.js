'use strict';Object.defineProperty(exports,"__esModule",{value:true});exports.status=exports.daemon=exports.rebase=exports.install=exports.run=exports.set=exports.search=exports.list=exports.init=exports.remove=exports.add=undefined;var _slicedToArray=function(){function sliceIterator(arr,i){var _arr=[];var _n=true;var _d=false;var _e=undefined;try{for(var _i=arr[Symbol.iterator](),_s;!(_n=(_s=_i.next()).done);_n=true){_arr.push(_s.value);if(i&&_arr.length===i)break;}}catch(err){_d=true;_e=err;}finally{try{if(!_n&&_i["return"])_i["return"]();}finally{if(_d)throw _e;}}return _arr;}return function(arr,i){if(Array.isArray(arr)){return arr;}else if(Symbol.iterator in Object(arr)){return sliceIterator(arr,i);}else{throw new TypeError("Invalid attempt to destructure non-iterable instance");}};}();var _expandTilde=require('expand-tilde');var _expandTilde2=_interopRequireDefault(_expandTilde);var _path=require('path');var _path2=_interopRequireDefault(_path);var _chalk=require('chalk');var _chalk2=_interopRequireDefault(_chalk);var _fs=require('fs');var _fs2=_interopRequireDefault(_fs);var _glob=require('glob');var _glob2=_interopRequireDefault(_glob);var _shelljs=require('shelljs');var _shelljs2=_interopRequireDefault(_shelljs);var _readline=require('readline');var _readline2=_interopRequireDefault(_readline);var _inquirer=require('inquirer');var _inquirer2=_interopRequireDefault(_inquirer);var _fuzzy=require('fuzzy');var _fuzzy2=_interopRequireDefault(_fuzzy);var _chokidar=require('chokidar');var _chokidar2=_interopRequireDefault(_chokidar);var _psNode=require('ps-node');var _psNode2=_interopRequireDefault(_psNode);var _logUpdate=require('log-update');var _logUpdate2=_interopRequireDefault(_logUpdate);var _child_process=require('child_process');var _helpers=require('./helpers');function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}var add=exports.add=function add(){var base=arguments.length>0&&arguments[0]!==undefined?arguments[0]:'';var bases=arguments.length>1&&arguments[1]!==undefined?arguments[1]:[];var repos=void 0,repo_names=[];var _getDotfile=(0,_helpers.getDotfile)(),_getDotfile2=_slicedToArray(_getDotfile,1),dotfile=_getDotfile2[0];bases=bases.concat(base);(0,_logUpdate2.default)(_chalk2.default.yellow('Adding bases...'));bases=(0,_helpers.filter)(bases.map(function(b){return _path2.default.resolve((0,_expandTilde2.default)(b));}).sort(function(a,b){return a.length-b.length;}));var to_index=[];bases.forEach(function(base){var is_subdir=false;var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=Object.keys(dotfile['bases'])[Symbol.iterator](),_step;!(_iteratorNormalCompletion=(_step=_iterator.next()).done);_iteratorNormalCompletion=true){var b=_step.value;if((0,_helpers.isChildOf)(base,b)){console.log(_chalk2.default.red(base+' is inside another base: '+b));is_subdir=true;break;}if((0,_helpers.isChildOf)(b,base)){console.log(_chalk2.default.red(b+' is inside another base: '+base));if(to_index.indexOf(b)>=0)to_index.remove(b);if(b in dotfile['bases'])delete dotfile['bases'][b];break;}}}catch(err){_didIteratorError=true;_iteratorError=err;}finally{try{if(!_iteratorNormalCompletion&&_iterator.return){_iterator.return();}}finally{if(_didIteratorError){throw _iteratorError;}}}if(!is_subdir){dotfile['bases'][base]={'repos':{}};to_index.push(base);}});var _findRepos=(0,_helpers.findRepos)(to_index,dotfile);var _findRepos2=_slicedToArray(_findRepos,2);dotfile=_findRepos2[0];repo_names=_findRepos2[1];_logUpdate2.default.clear();Object.keys(repo_names).forEach(function(base){console.log(_chalk2.default.green('Base added: '+base));var names=repo_names[base].map(function(name,num){return'  '+(num+1)+') '+name;}).join('\n');console.log(_chalk2.default.green('Repos added: \n'+(names?names:'  None')));});return(0,_helpers.dumpDotfile)(dotfile);};var remove=exports.remove=function remove(){var base=arguments.length>0&&arguments[0]!==undefined?arguments[0]:'';var bases=arguments.length>1&&arguments[1]!==undefined?arguments[1]:[];(0,_child_process.spawn)('gamma',['rebase'],{detached:true,stdio:'ignore'}).unref();var _getDotfile3=(0,_helpers.getDotfile)(),_getDotfile4=_slicedToArray(_getDotfile3,2),dotfile=_getDotfile4[0],error=_getDotfile4[1];if(error)return dotfile;bases.concat(base).forEach(function(base){var base_path=_path2.default.resolve((0,_expandTilde2.default)(base));if(base==dotfile['context']['base'])dotfile['context']={context:'',repo:{}};if(base_path in dotfile['bases']){var names=Object.keys(dotfile['bases'][base_path]['repos']).map(function(name,num){return'  '+(num+1)+') '+name;}).join('\n');delete dotfile['bases'][base_path];console.log(_chalk2.default.red('Base deleted: '+base_path));if(names)console.log(_chalk2.default.red('Repos deleted: \n'+names));}else console.log(_chalk2.default.red(base_path+' is not a base'));});return(0,_helpers.dumpDotfile)(dotfile);};var init=exports.init=function init(){var content={'bases':{},'context':{'base':'','repo':''}};return(0,_helpers.dumpDotfile)(content);};var list=exports.list=function list(){var bases=arguments.length>0&&arguments[0]!==undefined?arguments[0]:[];var options=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{};(0,_child_process.spawn)('gamma',['rebase'],{detached:true,stdio:'ignore'}).unref();var _getDotfile5=(0,_helpers.getDotfile)(),_getDotfile6=_slicedToArray(_getDotfile5,1),dotfile=_getDotfile6[0];if(options.bases)return(0,_helpers.listBases)(dotfile);if(options.context)return console.log('Base: '+(dotfile['context']['base']?dotfile['context']['base']:'')+'\nRepo: '+(dotfile['context']['repo']['name']?dotfile['context']['repo']['name']:''));return(0,_helpers.listRepos)(bases);};var search=exports.search=function search(){var base=arguments.length>0&&arguments[0]!==undefined?arguments[0]:'';(0,_child_process.spawn)('gamma',['rebase'],{detached:true,stdio:'ignore'}).unref();var _getDotfile7=(0,_helpers.getDotfile)(),_getDotfile8=_slicedToArray(_getDotfile7,2),dotfile=_getDotfile8[0],error=_getDotfile8[1];var repos=[];Object.keys(dotfile['bases']).forEach(function(b){return Object.entries(dotfile['bases'][b]['repos']).forEach(function(key){return repos.push(key[1]['path']);});});var filtered=_fuzzy2.default.filter(base,repos);filtered.length?console.log(filtered[0].string):console.log('');};var set=exports.set=function set(options){var _getDotfile9=(0,_helpers.getDotfile)(),_getDotfile10=_slicedToArray(_getDotfile9,1),dotfile=_getDotfile10[0];var context=void 0;if(options.base){var baseContext=(0,_helpers.processContextBase)(options.base,dotfile);context=baseContext?baseContext:context;}if(options.repo){var repoContext=(0,_helpers.processContextRepo)(options.repo,dotfile);context=repoContext?repoContext:context;}if(context){console.log(_chalk2.default.green('Updated context:'));list(null,{context:true});}};var run=exports.run=async function run(){for(var _len=arguments.length,options=Array(_len),_key=0;_key<_len;_key++){options[_key]=arguments[_key];}var _getDotfile11=(0,_helpers.getDotfile)(),_getDotfile12=_slicedToArray(_getDotfile11,2),dotfile=_getDotfile12[0],error=_getDotfile12[1];if(error)return;options=options[options.length-1];if(options.command&&typeof options.command==='string')return(0,_helpers.runCommand)(options.command,dotfile);while(true){var _ref=await _inquirer2.default.prompt({type:'input',name:'command',message:'Command: '}),command=_ref.command;if(command&&command!='q'&&command!='quit')(0,_helpers.runCommand)(command,dotfile);else return;}};var install=exports.install=async function install(){var COMMAND_INFO='\nThis installs the \'gd\' command, which cd\'s into a git repo fuzzy matching a repo in the context base\nExample:\n\t\u279C  Dropbox $ ad gam\n\t\u279C  Gamma (master) \u2717 pwd\n\t/Users/ashwin/Dropbox/gitHub/Gamma\n';console.log(COMMAND_INFO);var _ref2=await _inquirer2.default.prompt({type:'confirm',name:'confirm',message:'Continue with installation?'}),confirm=_ref2.confirm;if(!confirm)return;var _ref3=await _inquirer2.default.prompt({type:'input',name:'name',message:'Name of the command? (Default: \'gd\'): '}),name=_ref3.name;name=/^[a-z][a-zA-Z0-9_]*$/g.exec(name)?name:'gd';var command='\n\n'+name+'(){cd $(gamma search $1)}';var installed=false;var messages=[];var _arr=['~/.bashrc','~/.zshrc'];for(var _i=0;_i<_arr.length;_i++){var shellPath=_arr[_i];shellPath=_path2.default.resolve((0,_expandTilde2.default)(shellPath));var _ref4=await _inquirer2.default.prompt({type:'confirm',name:'install',message:'Install '+name+' function to '+shellPath+'?'}),_install=_ref4.install;if(!_install)continue;try{_fs2.default.accessSync(shellPath,_fs2.default.W_OK);_fs2.default.appendFileSync(shellPath,command);messages.push(_chalk2.default.green(name+' command has been installed in '+shellPath));}catch(error){messages.push(_chalk2.default.red('No write access for '+shellPath));}}if(!messages.length)return console.log('Did not install the '+name+' command');messages.forEach(function(message){return console.log(message);});};var rebase=exports.rebase=function rebase(){var bases=arguments.length>0&&arguments[0]!==undefined?arguments[0]:[];var _getDotfile13=(0,_helpers.getDotfile)(),_getDotfile14=_slicedToArray(_getDotfile13,2),dotfile=_getDotfile14[0],error=_getDotfile14[1];if(error)return dotfile;var dotBases=Object.keys(dotfile['bases']);bases=bases.length?bases.map(function(b){return _path2.default.resolve((0,_expandTilde2.default)(b));}).filter(function(base){return dotfile['bases'][base];}):dotBases;(0,_logUpdate2.default)(_chalk2.default.yellow('Reindexing bases...'));var original={};Object.keys(dotfile['bases']).forEach(function(base){return original[base]=Object.keys(dotfile['bases'][base]['repos']);});var repo_names=void 0;var _findRepos3=(0,_helpers.findRepos)(bases,dotfile);var _findRepos4=_slicedToArray(_findRepos3,2);dotfile=_findRepos4[0];repo_names=_findRepos4[1];_logUpdate2.default.clear();Object.keys(original).forEach(function(base){var reposAdded=repo_names[base].filter(function(b){return!original[base].includes(b);}).map(function(name,num){return'  '+(num+1)+') '+name;}).join('\n');var reposRemoved=original[base].filter(function(b){return!repo_names[base].includes(b);}).map(function(name,num){return'  '+(num+1)+') '+name;}).join('\n');if(_fs2.default.existsSync(base)){console.log('Base reindexed: '+base);console.log(_chalk2.default.green('Repos added: \n'+(reposAdded?reposAdded:'  None')));}else{console.log(_chalk2.default.red(base+' does not exist'));delete dotfile['bases'][base];}console.log(_chalk2.default.red('Repos removed: \n'+(reposRemoved?reposRemoved:'  None')));});if(dotfile['context']['base']&&!_fs2.default.existsSync(dotfile['context']['base']))dotfile['context']={'base':'','repo':''};if(dotfile['context']['repo']&&!_fs2.default.existsSync(dotfile['context']['repo']['path']))dotfile['context']['repo']={};return(0,_helpers.dumpDotfile)(dotfile);};var daemon=exports.daemon=function daemon(){_psNode2.default.lookup({command:'node',arguments:['gamma','daemon']},function(err,processes){if(err)return console.error(err);if(processes.length>1)return;console.log('Gamma deamon started');_chokidar2.default.watch(Object.keys((0,_helpers.getDotfile)()[0]['bases']),{ignored:/(^|\/)\.[^\/\.]|(node_modules)/gm}).on('addDir',function(dirPath){var _getDotfile15=(0,_helpers.getDotfile)(),_getDotfile16=_slicedToArray(_getDotfile15,2),dotfile=_getDotfile16[0],error=_getDotfile16[1];if(!/(\.git(\0|\/|\n|\r))/gm.exec(dirPath))return;if(_shelljs2.default.exec('git -C '+dirPath+' rev-parse').code!=0)return;dirPath=dirPath.substring(0,dirPath.indexOf('.git')-1);var dirName=_path2.default.basename(dirPath);var base=(0,_helpers.getBase)(dirPath);if(dotfile['bases'][base]['repos'][dirName])return;dotfile['bases'][base]['repos'][dirName]={'base':base,'path':dirPath};return(0,_helpers.dumpDotfile)(dotfile);}).on('unlinkDir',function(dirPath){var _getDotfile17=(0,_helpers.getDotfile)(),_getDotfile18=_slicedToArray(_getDotfile17,2),dotfile=_getDotfile18[0],error=_getDotfile18[1];var _iteratorNormalCompletion2=true;var _didIteratorError2=false;var _iteratorError2=undefined;try{for(var _iterator2=Object.keys(dotfile['bases'])[Symbol.iterator](),_step2;!(_iteratorNormalCompletion2=(_step2=_iterator2.next()).done);_iteratorNormalCompletion2=true){var base=_step2.value;if(!(0,_helpers.isChildOf)(dirPath,base))continue;if(!dotfile['bases'][base]['repos'][_path2.default.basename(dirPath)])continue;delete dotfile['bases'][base]['repos'][_path2.default.basename(dirPath)];(0,_helpers.dumpDotfile)(dotfile);break;}}catch(err){_didIteratorError2=true;_iteratorError2=err;}finally{try{if(!_iteratorNormalCompletion2&&_iterator2.return){_iterator2.return();}}finally{if(_didIteratorError2){throw _iteratorError2;}}}});});};var status=exports.status=function status(){var _getDotfile19=(0,_helpers.getDotfile)(),_getDotfile20=_slicedToArray(_getDotfile19,2),dotfile=_getDotfile20[0],error=_getDotfile20[1];if(error)return dotfile;(0,_child_process.spawn)('gamma',['rebase'],{detached:true,stdio:'ignore'}).unref();var names=[];Object.keys(dotfile['bases']).forEach(function(base){return Object.keys(dotfile['bases'][base]['repos']).concat('Base: '+base).forEach(function(repo){return names.push(repo);});});var pad=names.reduce(function(r,s){return r>s.length?r:s.length;},0);Object.keys(dotfile['bases']).forEach(function(base){console.log(_chalk2.default.magenta('Base: '+base+' '.repeat(Math.abs(pad-base.length+5))+'Status'));Object.keys(dotfile['bases'][base]['repos']).forEach(function(repoName){var repo=dotfile['bases'][base]['repos'][repoName]['path'].replace(/ /g,'\\ ');var messages=[];if((0,_helpers.repoEmpty)(repo))messages.push(_chalk2.default.green('Empty'));if((0,_helpers.commitPending)(repo))messages.push(_chalk2.default.blue('Uncommitted'));if((0,_helpers.unpushed)(repo))messages.push(_chalk2.default.yellow('Unpushed'));if(!messages.length)messages.push(_chalk2.default.green('Up to date'));console.log(''+repoName+' '.repeat(Math.abs(pad-repoName.length+11))+messages.join(' | '));});console.log();});};