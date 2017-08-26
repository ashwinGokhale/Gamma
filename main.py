# coding: utf-8
import os
import json
import glob
import click
from subprocess import call

def findRepos(bases, dotfile):
    repos = {}
    repo_names = []
    # if bases is None: bases = dotfile['bases']
    for base in bases:
        base = os.path.abspath(os.path.expanduser(base))
        for repo_path in glob.iglob('{}/**/.git'.format(base), recursive=True):
            # Cut off /.git from the filename
            repo_path = repo_path[:-5]
            repo_name = os.path.basename(repo_path)
            repos[repo_name] = {'path': repo_path,}
            repo_names.append(repo_name)
        dotfile['bases'][base]['repos'] = repos
    return dotfile, repo_names

def getGit():
    result = call(['which', 'git', '>', '/dev/null'])
    print('Something') if result == 0 else print('Nothing')

@click.group()
def cli():
    """This helps with git"""
    pass

@cli.command()
def init():
    content = {'bases': {}}
    json.dump(content, open(os.path.expanduser('~/.gamma.json'), 'w+'), indent=4)
    return content

@cli.command()
@click.argument('bases', nargs=-1)
@click.pass_context
def add(ctx, bases):
    """Adds a base and finds all repos in it."""
    if len(bases) == 0:
        click.echo(click.style('No base(s) specified', fg='red'))
        return

    dotfile = None
    try:
        dotfile = json.load(open(os.path.expanduser('~/.gamma.json')))
    except FileNotFoundError:
        click.echo(click.style('~/.gamma.json has been corrupted. Attempting to rebuild...', fg='red'))
        dotfile = ctx.invoke(init)
        click.echo(click.style('~/.gamma.json has been rebuilt', fg='green'))

    to_index = []
    for base in bases:
        base_path = os.path.abspath(os.path.expanduser(base))
        if not base_path in dotfile['bases']:
            if os.path.isdir(base_path):
                dotfile['bases'][base_path] = {'repos': []}
                to_index.append(base_path)
            else:
                click.echo(click.style('%s is not a directory' % base, fg='red'))
        else :
            click.echo(click.style('%s is already a base' % base, fg='red'))

    dotfile, repo_names = findRepos(to_index, dotfile)
    names = ''
    for (number, name) in enumerate(repo_names): names += '\n  {}) {}'.format(number+1, name)
    if names: click.echo(click.style('Repos added: %s' % names, fg='green'))
    json.dump(dotfile, open(os.path.expanduser('~/.gamma.json'), 'w'), indent=4)
    return dotfile

@cli.command()
@click.argument('bases', nargs=-1)
@click.pass_context
def remove(ctx, bases):
    """Removes a base, including all repos in it."""
    if len(bases) == 0:
        click.echo(click.style('No base(s) specified', fg='red'))
        return

    dotfile = None
    try:
        dotfile = json.load(open(os.path.expanduser('~/.gamma.json')))
    except FileNotFoundError:
        click.echo(click.style('~/.gamma.json has been corrupted. Attempting to rebuild...', fg='red'))
        dotfile = ctx.invoke(init)
        click.echo(click.style('~/.gamma.json has been rebuilt', fg='green'))
        return dotfile

    for base in bases:
        names = ''
        base_path = os.path.abspath(os.path.expanduser(base))
        if base_path in dotfile['bases']:
            for (number, name) in enumerate(dotfile['bases'][base_path]['repos'].keys()): names += '\n  {}) {}'.format(number+1, name)
            del dotfile['bases'][base_path]
            click.echo(click.style('Base deleted: %s' % base, fg='red'))
            if names: click.echo(click.style('Repos removed: %s' % names, fg='red'))

    json.dump(dotfile, open(os.path.expanduser('~/.gamma.json'), 'w'), indent=4)
    return dotfile