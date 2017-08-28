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
    result = call(['which', 'git', '>', '/dev/null'])
    print('Something') if result == 0 else print('Nothing')

# def filterBases(bases):
#     # Filter out non directories
#     bases = [x for x in filter(lambda path: os.path.isdir(path), bases)]
#     bases.sort()
#     still_subs = True
#     while still_subs:
#         common = os.path.commonpath(bases)
#         if common in bases:
#             bases = [x for x in filter(lambda path: path == common, bases)]
#         else:
#             still_subs = False
#     return bases


# CLI commands
@click.group('cli')
def cli():
    """This helps with git"""
    pass

@cli.command()
def init():
    content = {'bases': {}}
    json.dump(content, open(dotfile_path, 'w+'), indent=4)
    call(['eval', '"$(_GAMMA_COMPLETE=source gamma)"'])
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

    # Filter out subdirectories
    bases = [x for x in map(lambda b : os.path.abspath(os.path.expanduser(b)) ,bases)]

    # Validate each base
    to_index = []
    for base in bases:
        # Check to see if the base is not already added
        if not base in dotfile['bases']:
            # Check to see if the base is a directory
            if os.path.isdir(base):
                # Check to see if the base is not contained in another base
                is_subdir = False
                for b in dotfile['bases'].keys():
                    # If the base trying to be added is a subdirectory of an existing base, skip it
                    if os.path.commonpath([b]) == os.path.commonpath([b, base]):
                        click.echo(click.style('%s is inside another base: %s' % (base, b), fg='red'))
                        is_subdir = True
                        break
                    # If the base trying to be added is a parent directory of an existing base, delete the sub directory
                    if os.path.commonpath([base]) == os.path.commonpath([b, base]):
                        click.echo(click.style('%s is inside another base: %s' % (b, base), fg='red'))
                        if to_index.index(b) >= 0: del to_index[to_index.index(b)]
                        if b in dotfile['bases']: del dotfile['bases'][b]
                        break
                # If base is a unique directory, not in another base, add it to the dotfile
                if not is_subdir:
                    dotfile['bases'][base] = {'repos': {}}
                    to_index.append(base)
            else:
                click.echo(click.style('%s is not a directory' % base, fg='red'))
        else :
            click.echo(click.style('%s is already a base' % base, fg='red'))

    # Index the new bases for repos
    dotfile, repo_names = findRepos(to_index, dotfile)

    # Format the output
    for base in repo_names.keys():
        names = '\n'.join(['  %d) %s' % (num+1, name) for num, name in enumerate(repo_names[base])])
        if names: click.echo(click.style('Repos added: \n%s' % names, fg='green'))

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
#     print(filterBases([x for x in map(lambda b : os.path.abspath(os.path.expanduser(b)) ,['.', '../../', './main.py' , '../', '~/Google Drive'])]))