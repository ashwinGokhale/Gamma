#!/usr/bin/env node

'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();
// import omelette from 'omelette';


var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _expandTilde = require('expand-tilde');

var _expandTilde2 = _interopRequireDefault(_expandTilde);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Path to the dotfile
var dotpath = (0, _expandTilde2.default)('~/.gamma.json');

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
var isChildOf = function isChildOf(child, parent) {
	return child !== parent && parent.split('/').every(function (t, i) {
		return child.split('/')[i] === t;
	});
};

var findRepos = function findRepos() {
	var bases = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
	var dotfile = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	var repo_names = {};
	bases.forEach(function (base) {
		base = _path2.default.resolve((0, _expandTilde2.default)(base));
		var repos = {};
		repo_names[base] = [];
		_glob2.default.sync(base + '/**/.git', { dot: true }).forEach(function (repo_path) {
			// Cut off /.git from the filename
			repo_path = repo_path.slice(0, -5);
			var repo_name = _path2.default.basename(repo_path);
			repos[repo_name] = { 'base': base, 'path': repo_path };
			repo_names[base].push(repo_name);
		});
		dotfile['bases'][base]['repos'] = repos;
	});
	return [dotfile, repo_names];
};

var getRepos = function getRepos() {
	var bases = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

	// TODO: Only add bases that aren't in the dotfile
	var repos = [];
	var dotfile = {};
	if (!_fs2.default.existsSync(dotpath)) {
		console.log(_chalk2.default.red('~/.gamma.json has been corrupted. Rebuilding...'));
		dotfile = init();
		console.log(_chalk2.default.green('~/.gamma.json has been rebuilt'));
	} else dotfile = require(dotpath);

	if (bases.length > 0) {
		bases.forEach(function (base) {
			if (base in dotfile['bases']) repos = repos.concat(Object.keys(dotfile['bases'][base]['repos']));else console.log(_chalk2.default.red(base + ' is not a base'));
		});
	} else {
		for (var base in dotfile['bases']) {
			repos = repos.concat(Object.keys(dotfile['bases'][base]['repos']));
		}
	}
	return repos;
};

var filter = function filter() {
	var bases = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

	var tree = {};
	var paths = [];
	bases.forEach(function (base) {
		base = _path2.default.resolve((0, _expandTilde2.default)(base));
		if (!_fs2.default.existsSync(base)) {
			console.log(_chalk2.default.red('Base: ' + base + ' does not exist'));
			return;
		}
		var dirs = base.split(_path2.default.sep);
		for (var i = 0; i < dirs.length; i++) {
			if (tree[dirs[i]]) {
				if (tree[dirs[i]]['marked']) break;
			}

			if (!tree[dirs[i]]) tree[dirs[i]] = {};

			if (i == dirs.length - 1) {
				tree[dirs[i]] = { 'marked': true };
				paths.push(base);
			}
		}
	});
	return paths;
};

// CLI commands
var add = function add() {
	var base = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
	var bases = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

	//Adds the bases and finds all repos in it.
	// Attempt to load the dotfile
	var repos = void 0,
	    repo_names = [];
	var dotfile = {};
	if (!_fs2.default.existsSync(dotpath)) {
		console.log(_chalk2.default.red('~/.gamma.json has been corrupted. Rebuilding...'));
		dotfile = init();
		console.log(_chalk2.default.green('~/.gamma.json has been rebuilt'));
	} else dotfile = require(dotpath);

	bases = bases.concat(base);

	// TODO: Add a spinner because glob is slow

	// Get the absolute path of the bases and filter/validate them
	bases = filter(bases.map(function (b) {
		return _path2.default.resolve((0, _expandTilde2.default)(b));
	}).sort(function (a, b) {
		return a.length - b.length;
	}));
	var to_index = [];
	bases.forEach(function (base) {
		// Check to see if the base is not contained in another base
		var is_subdir = false;
		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = Object.keys(dotfile['bases'])[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var b = _step.value;

				// If the base trying to be added is a subdirectory of an existing base, skip it
				if (isChildOf(base, b)) {
					console.log(_chalk2.default.red(base + ' is inside another base: ' + b));
					is_subdir = true;
					break;
				}
				// If the base trying to be added is a parent directory of an existing base, delete the sub directory
				if (isChildOf(b, base)) {
					console.log(_chalk2.default.red(b + ' is inside another base: ' + base));
					if (to_index.indexOf(b) >= 0) to_index.remove(b);
					if (b in dotfile['bases']) delete dotfile['bases'][b];
					break;
				}
			}
			// If base is a unique directory, not in another base, add it to the dotfile
		} catch (err) {
			_didIteratorError = true;
			_iteratorError = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion && _iterator.return) {
					_iterator.return();
				}
			} finally {
				if (_didIteratorError) {
					throw _iteratorError;
				}
			}
		}

		if (!is_subdir) {
			dotfile['bases'][base] = { 'repos': {} };
			to_index.push(base);
		}
	});

	// Index the new bases for repos

	// Format the output and print it
	var _findRepos = findRepos(to_index, dotfile);

	var _findRepos2 = _slicedToArray(_findRepos, 2);

	dotfile = _findRepos2[0];
	repo_names = _findRepos2[1];
	Object.keys(repo_names).forEach(function (base) {
		console.log(_chalk2.default.green('Base added: ' + base));
		var names = repo_names[base].map(function (name, num) {
			return '  ' + (num + 1) + ') ' + name;
		}).join('\n');
		console.log(_chalk2.default.green('Repos added: \n' + (names ? names : '  None')));
	});

	// Write the dotfile back
	_fs2.default.writeFile(dotpath, JSON.stringify(dotfile, null, '\t'), 'utf8', function (err) {
		if (err) {
			console.error(err);
		}
	});
	return dotfile;
};

var remove = function remove() {
	var base = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
	var bases = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

	// Removes a base, including all repos in it
	var dotfile = {};
	if (!_fs2.default.existsSync(dotpath)) {
		console.log(_chalk2.default.red('~/.gamma.json has been corrupted. Rebuilding...'));
		dotfile = init();
		console.log(_chalk2.default.green('~/.gamma.json has been rebuilt'));
		return dotfile;
	} else dotfile = require(dotpath);

	bases.concat(base).forEach(function (base) {
		var base_path = _path2.default.resolve((0, _expandTilde2.default)(base));
		if (base_path in dotfile['bases']) {
			var names = Object.keys(dotfile['bases'][base_path]['repos']).map(function (name, num) {
				return '  ' + (num + 1) + ') ' + name;
			}).join('\n');
			delete dotfile['bases'][base_path];
			console.log(_chalk2.default.red('Base deleted: ' + base_path));
			if (names) console.log(_chalk2.default.red('Repos deleted: \n' + names));
		} else console.log(_chalk2.default.red(base_path + ' is not a base'));
	});

	_fs2.default.writeFile(dotpath, JSON.stringify(dotfile, null, '\t'), 'utf8', function (err) {
		if (err) {
			console.error(err);
		}
	});
	return dotfile;
};

var init = function init() {
	// Add the autocomplete
	complete.setupShellInitFile();
	// Initializes the gamma dofile and persists to disk
	var content = { 'bases': {}, 'context': { 'base': '', 'repo': '' } };
	_fs2.default.writeFile(dotpath, JSON.stringify(content, null, '\t'), 'utf8', function (err) {
		if (err) {
			console.error(err);
		}
	});
	return content;
};

var listRepos = function listRepos() {
	var bases = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
	getRepos(bases).forEach(function (base) {
		return console.log(base);
	});
};

var search = function search() {
	var base = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
	_glob2.default.sync(_path2.default.resolve((0, _expandTilde2.default)(base)) + '/**/.git', { dot: true }).forEach(function (repo_path) {
		return console.log(repo_path.slice(0, -5));
	});
};

var listBases = function listBases() {
	Object.keys(require(dotpath)['bases']).forEach(function (base) {
		return console.log(base);
	});
};

_commander2.default.command('list [bases...]').alias('l').description('List all git repos by base').action(listRepos);

_commander2.default.command('search <base>').alias('s').description('Returns the paths for all git repos in the given base').action(search);

_commander2.default.command('init').alias('i').description('Initializes the gamma dotfile').action(init);

_commander2.default.command('add <base> [otherBases...]').alias('a').action(add).description('Adds the specified bases as well as all git repos in them');

_commander2.default.command('remove <base> [otherBases...]').alias('r').action(remove).description('Removes the specified bases from Gamma');

_commander2.default.command('context').command('list').command('set');

_commander2.default.parse(process.argv);

console.log(_commander2.default.context);