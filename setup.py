#!/usr/bin/env python

import sys
from setuptools import setup

requirements = [
    'click',
    'colorama',
    'watchdog'
]

python2_requirements = [
    'importlib',
]

if sys.version_info[0] == 2:
    requirements += python2_requirements

setup(
    name='gamma',
    version=0.1,
    description="Manage all of your git repos on your local machine",
    author="Ashwin Gokhale",
    author_email='ashwin.gokhale98@gmail.com',
    url='https://github.com/ashwingokhale/Gamma',
    py_modules=['main'],
    # package_data={'Gamma': ['data/tutorial_lessons.json']},
    entry_points='''
            [console_scripts]
            gamma=main:cli
        ''',
    install_requires=requirements,
    license="MIT",
    classifiers=[
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Natural Language :: English',
        "Programming Language :: Python :: 2",
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6'
    ]
)