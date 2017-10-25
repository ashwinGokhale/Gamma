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
    set [options]                    Set the base and/or repo of the context
    run [options]                    Runs a git command in the context
    rebase|re [bases...]             Rescan base(s) and removes any base or repo that does not exist anymore
    daemon|d                         Runs background process that maintains all bases and their repos
```

## How does it work?
Gamma keeps track of "base" directories and from those, it tracks all git repos in them.  
Gamma also has something called the "context" which contains the default base directory and default repo.  
The context is used to resolve naming conflicts for commands like 'run'

## GD command
You can cd into any repo in any base after running `gamma install`. This will install the "gd" (you can change the name) command in your .bashrc and/or .zshrc files. After that, just run `gd <fuzzy matched repo>`

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b new-feature`)
3. Commit your changes (`git commit -am 'Added some new feature'`)
4. Push to the branch (`git push origin new-feature`)
5. Create new Pull Request