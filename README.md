# Gamma

`gamma ` is a tool for managing all git repos on your local machine.

NOTE: Gamma has only been tested on a Unix system

## Installation
```
npm i -g gamma-cli
```

## Usage
```
$ gamma --help

  Usage: gamma [options] [command]


  Options:

    -V, --version  output the version number
    -h, --help     output usage information


  Commands:

    list|l [options] [bases...]      List all git repos in the base(s)
    search|s <base>                  Fuzzy matches a git repo inside the context base
    init|i                           Initializes the gamma dotfile
    install|ins                      Installs the 'ad' command, which cd's into a git repo fuzzy matching a repo in the context base
    add|a <base> [otherBases...]     Adds the specified bases as well as all git repos in them
    remove|r <base> [otherBases...]  Removes the specified bases from Gamma
    set|se [options]                 Set the base and/or repo of the context. Supports fuzzy matching
    run|ru [options]                 Runs a git command in the context repo
    rebase|re [bases...]             Rescan base(s) and removes any base or repo that does not exist anymore
    daemon|d                         Runs background process that maintains all bases and their repos
    status|st                        Prints the status of each repo in each base
```

## What is it? How does it work?
I saw a project, [Pro](https://github.com/trishume/pro), and have been rewriting it in Javascript with a few changes.  
Gamma keeps track of "base" directories and from those, it tracks all git repos in them. It resolves naming conflicts, runs commands, and formats output by grouping repos by their base folder.  
Gamma also has something called the "context" which contains the default base directory and default repo, which can be set through fuzzy matching.

## GD command
You can cd into any repo in any base after running `gamma install`. This will install the "gd" (you can change the name) command in your .bashrc and/or .zshrc files. After that, just run `gd <fuzzy matched repo>`

## Todo:
  * Add tab completion
  * Run daemon on startup
  * Optimize status command

## Contributing
1. Fork it
2. Create your feature branch (`git checkout -b new-feature`)
3. Commit your changes (`git commit -am 'Added a new feature'`)
4. Push to the branch (`git push origin new-feature`)
5. Create new Pull Request