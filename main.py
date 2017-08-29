# !/usr/bin/env python
# -*- coding:utf-8 -*-

import os
import json
import glob
import click
from subprocess import call

# Declare globals
dotfile_path = os.path.expanduser('~/.gamma.json')

# Helper functions
def findRepos(bases, dotfile):
    repo_names = {}
    for base in bases:
        base = os.path.abspath(os.path.expanduser(base))
        repos = {}
        repo_names[base] = []
        for repo_path in glob.iglob('%s/**/.git' % base, recursive=True):
            # Cut off /.git from the filename
            repo_path = repo_path[:-5]
            repo_name = os.path.basename(repo_path)
            repos[repo_name] = {'base': base, 'path': repo_path}
            repo_names[base].append(repo_name)
        dotfile['bases'][base]['repos'] = repos
    return dotfile, repo_names

def getRepos(bases):
    repos = []
    dotfile = None
    try:
        # Successfully loaded dotfile
        dotfile = json.load(open(dotfile_path))
    except FileNotFoundError:
        # If dotfile not found, return empty list
        return repos
    if bases:
        for base in bases:
            if base in dotfile['bases']:
                for dotbase in dotfile['bases']:
                    repos.extend(dotfile['bases'][dotbase]['repos'].keys())
            else:
                click.echo(click.style('%s is not a base' % base, fg='red'))
    else:
        for base in dotfile['bases'].keys(): repos.extend(dotfile['bases'][base]['repos'].keys())
    return repos


def getGit():
    result = os.system('which git > /dev/null')
    print('Something') if result == 0 else print('Nothing')

@click.pass_context
def filterBases(ctx, bases):
    # Attempt to load the dotfile
    dotfile = None
    try:
        # Successfully loaded dotfile
        dotfile = json.load(open(dotfile_path))
    except FileNotFoundError:
        # If dotfile not found, rebuild it
        click.echo(click.style('~/.gamma has been corrupted. Attempting to rebuild...', fg='red'))
        dotfile = ctx.invoke(init)
        click.echo(click.style('~/.gamma has been rebuilt', fg='green'))

    tempBases = []
    for base in bases:
        # Filter out non directories
        if not os.path.isdir(base):
            click.echo(click.style('%s is not a directory' % base, fg='red'))
        else:
            # Filter out bases already added
            if dotfile['bases'].get(base):
                click.echo(click.style('%s is already a base' % base, fg='red'))
            else:
                tempBases.append(base)

    bases = tempBases

    for i in range(len(bases)-1, 0, -1):
        # If bases[i] is a parent, delete the subdirectory, bases[i-1]
        if os.path.commonpath([bases[i], bases[i-1]]) == os.path.commonpath([bases[i]]): del bases[i-1]
        # If bases[i-1] is a parent, delete the subdirectory, bases[i]
        elif os.path.commonpath([bases[i], bases[i-1]]) == os.path.commonpath([bases[i-1]]): del bases[i]
    return bases


# CLI commands
@click.group('cli')
def cli():
    """This helps with git"""
    pass

@cli.command()
def init():
    content = {'bases': {}}
    json.dump(content, open(dotfile_path, 'w+'), indent=4)
    os.system('eval "$(_GAMMA_COMPLETE=source gamma)"')
    return content

@cli.command()
@click.argument('bases', nargs=-1, type=click.Path(exists=True), required=True)
@click.pass_context
def add(ctx, bases):
    """Adds a base and finds all repos in it."""
    # Attempt to load the dotfile
    dotfile = None
    try:
        # Successfully loaded dotfile
        dotfile = json.load(open(dotfile_path))
    except FileNotFoundError:
        # If dotfile not found, rebuild it
        click.echo(click.style('~/.gamma has been corrupted. Attempting to rebuild...', fg='red'))
        dotfile = ctx.invoke(init)
        click.echo(click.style('~/.gamma has been rebuilt', fg='green'))

    # Get the absolute path of the bases and filter/validate them
    bases = ctx.invoke(filterBases, [x for x in map(lambda b : os.path.abspath(os.path.expanduser(b)) ,bases)])
    print(bases)
    to_index = []
    for base in bases:
        # Check to see if the base is not contained in another base
        is_subdir = False
        for b in dotfile['bases'].keys():
            # If the base trying to be added is a subdirectory of an existing base, skip it
            if os.path.commonpath([b]) == os.path.commonpath([b, base]) and b != base:
                click.echo(click.style('%s is inside another base: %s' % (base, b), fg='red'))
                is_subdir = True
                break
            # If the base trying to be added is a parent directory of an existing base, delete the sub directory
            if os.path.commonpath([base]) == os.path.commonpath([b, base]) and b != base:
                click.echo(click.style('%s is inside another base: %s' % (b, base), fg='red'))
                if b in to_index >= 0: to_index.remove(b)
                if b in dotfile['bases']: del dotfile['bases'][b]
                break
        # If base is a unique directory, not in another base, add it to the dotfile
        if not is_subdir:
            dotfile['bases'][base] = {'repos': {}}
            to_index.append(base)

    # Index the new bases for repos
    dotfile, repo_names = findRepos(to_index, dotfile)

    # Format the output and print it
    for base in repo_names.keys():
        click.echo(click.style('Base added: %s' % base, fg='green'))
        names = '\n'.join(['  %d) %s' % (num+1, name) for num, name in enumerate(repo_names[base])])
        click.echo(click.style('Repos added: \n%s' % (names if names else '  None'), fg='green'))

    # Write the dotfile back
    json.dump(dotfile, open(dotfile_path, 'w'), indent=4)
    return dotfile

@cli.command()
@click.argument('bases', nargs=-1, type=click.Path(exists=True), required=True)
@click.pass_context
def remove(ctx, bases):
    """Removes a base, including all repos in it."""
    dotfile = None
    try:
        dotfile = json.load(open(dotfile_path))
    except FileNotFoundError:
        click.echo(click.style('~/.gamma has been corrupted. Attempting to rebuild...', fg='red'))
        dotfile = ctx.invoke(init)
        click.echo(click.style('~/.gamma has been rebuilt', fg='green'))
        return dotfile

    for base in bases:
        base_path = os.path.abspath(os.path.expanduser(base))
        if base_path in dotfile['bases']:
            names = '\n'.join(['  {}) {}'.format(num + 1, name) for num, name in enumerate(dotfile['bases'][base_path]['repos'].keys())])
            del dotfile['bases'][base_path]
            click.echo(click.style('Base deleted: %s' % base_path, fg='red'))
            if names: click.echo(click.style('Repos removed: \n%s' % names, fg='red'))
        else:
            click.echo(click.style('%s is not a base' % base_path, fg='red'))

    json.dump(dotfile, open(dotfile_path, 'w'), indent=4)
    return dotfile

@cli.command()
@click.option('--bases', '-b', type=click.Path(), default=None, multiple=True)
def list(bases):
    for repo in getRepos(bases):
        click.echo(repo)

# if __name__ == '__main__':
    print(add(None, [
        '~/Google Drive',
        '.',
        '~/Dropbox/gitHub/Gamma/venv',
        '~/Dropbox/gitHub',
        '~/Dropbox/gitHub/Gamma/venv/pip-selfcheck.json',
        '~/Dropbox/gitHub/Gamma',
        '~/Dropbox'
    ]))