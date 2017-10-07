#!/usr/local/bin/babel-node
'use strict';

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _omelette = require('omelette');

var _omelette2 = _interopRequireDefault(_omelette);

var _expandTilde = require('expand-tilde');

var _expandTilde2 = _interopRequireDefault(_expandTilde);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var dotpath = (0, _expandTilde2.default)('~/.gamma.json');
var dotfile = require(dotpath);

// # Helper functions
// def findRepos(bases, dotfile):
//     repo_names = {}
//     for base in bases:
//         base = os.path.abspath(os.path.expanduser(base))
//         repos = {}
//         repo_names[base] = []
//         for repo_path in glob.iglob('%s/**/.git' % base, recursive=True):
//             # Cut off /.git from the filename
//             repo_path = repo_path[:-5]
//             repo_name = os.path.basename(repo_path)
//             repos[repo_name] = {'base': base, 'path': repo_path}
//             repo_names[base].append(repo_name)
//         dotfile['bases'][base]['repos'] = repos
//     return dotfile, repo_names


var getRepos = function getRepos(bases) {
    repos = [];
    var dotfile = void 0;
    if (!_fs2.default.existsSync(dotpath)) dotfile = init();else dotfile = require(dotpath);
    if (bases) {
        for (base in bases) {
            if (base in dotfile['bases']) {
                for (dotbase in dotfile['bases']) {
                    repos.concat(Object.keys(dotfile['bases'][dotbase]['repos'].keys()));
                }
            } else {
                console.log(_chalk2.default.red(base + ' is not a base'));
            }
        }
    } else {
        for (base in Object.keys(dotfile['bases'])) {
            repos.concat(Object.keys(dotfile['bases'][base]['repos']));
        }
    }
    return repos;
};

// def getGit():
//     result = os.system('which git > /dev/null')
//     print('Something') if result == 0 else print('Nothing')


// def splitall(path):
//     allparts = []
//     while True:
//         parts = os.path.split(path)
//         if parts[0] == path:  # sentinel for absolute paths
//             allparts.insert(0, parts[0])
//             break
//         elif parts[1] == path:  # sentinel for relative paths
//             allparts.insert(0, parts[1])
//             break
//         else:
//             path = parts[0]
//             allparts.insert(0, parts[1])
//     return allparts


// def filter(bases):
//     tree = {}
//     paths = []
//     for path in bases:
//         dirs = splitall(os.path.abspath(os.path.expanduser(path)))
//         for i in range(len(dirs)):
//             if dirs[i] in tree:
//                 if tree[dirs[i]].get('marked'):
//                     break

//             if not dirs[i] in tree:
//                 tree[dirs[i]] = {}

//             if i == len(dirs) - 1:
//                 tree[dirs[i]] = {'marked': True}
//                 paths.append(path)

//     return paths


// # CLI commands
// def init():
//     """Initializes the gamma dofile"""
//     content = {'bases': {}}
//     json.dump(content, open(dotfile_path, 'w+'), indent=4)
//     # os.system('eval "$(_GAMMA_COMPLETE=source gamma)"')
//     return content


// def add(bases):
//     """Adds the bases and finds all repos in it."""
//     # Attempt to load the dotfile
//     dotfile = None
//     try:
//         # Successfully loaded dotfile
//         dotfile = json.load(open(dotfile_path))
//     except FileNotFoundError:
//         # If dotfile not found, rebuild it
//         click.echo(click.style('~/.gamma has been corrupted. Attempting to rebuild...', fg='red'))
//         dotfile = init()
//         click.echo(click.style('~/.gamma has been rebuilt', fg='green'))

//     # Get the absolute path of the bases and filter/validate them
//     bases = filter(sorted([x for x in map(lambda b: os.path.abspath(os.path.expanduser(b)), bases)], key=len))
//     to_index = []
//     for base in bases:
//         # Check to see if the base is not contained in another base
//         is_subdir = False
//         for b in dotfile['bases'].keys():
//             # If the base trying to be added is a subdirectory of an existing base, skip it
//             if os.path.commonpath([b]) == os.path.commonpath([b, base]) and b != base:
//                 click.echo(click.style('%s is inside another base: %s' % (base, b), fg='red'))
//                 is_subdir = True
//                 break
//             # If the base trying to be added is a parent directory of an existing base, delete the sub directory
//             if os.path.commonpath([base]) == os.path.commonpath([b, base]) and b != base:
//                 click.echo(click.style('%s is inside another base: %s' % (b, base), fg='red'))
//                 if b in to_index >= 0: to_index.remove(b)
//                 if b in dotfile['bases']: del dotfile['bases'][b]
//                 break
//         # If base is a unique directory, not in another base, add it to the dotfile
//         if not is_subdir:
//             dotfile['bases'][base] = {'repos': {}}
//             to_index.append(base)

//     # Index the new bases for repos
//     dotfile, repo_names = findRepos(to_index, dotfile)

//     # Format the output and print it
//     for base in repo_names.keys():
//         click.echo(click.style('Base added: %s' % base, fg='green'))
//         names = '\n'.join(['  %d) %s' % (num + 1, name) for num, name in enumerate(repo_names[base])])
//         click.echo(click.style('Repos added: \n%s' % (names if names else '  None'), fg='green'))

//     # Write the dotfile back
//     json.dump(dotfile, open(dotfile_path, 'w'), indent=4)
//     return dotfile


// CLI commands
var init = function init() {
    // Initializes the gamma dofile and persists to disk
    var content = { 'bases': {} };
    _fs2.default.writeFile(dotpath, JSON.stringify(content), 'utf8');
    return content;
};

var listBases = function listBases(bases) {
    getRepos(bases).forEach(function (base) {
        return console.log(base);
    });
};

(0, _omelette2.default)('gamma').tree({
    init: [],
    list: [],
    add: [],
    remove: []
}).init();

_commander2.default.version('0.1.0').command('list', 'list packages installed', { isDefault: false }).parse(process.argv);