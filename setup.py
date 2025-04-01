# -*- coding: utf-8 -*-

# Learn more: https://github.com/kennethreitz/setup.py

from setuptools import setup, find_packages


with open('README.rst') as f:
    readme = f.read()

with open('LICENSE') as f:
    license = f.read()

setup(
    name='fact_checker',
    version='0.1.0',
    description='Factual checker for politicians',
    long_description=readme,
    author='Florin Balint',
    url='https://github.com/FlorinBalint/factual_checker',
    license=license,
    packages=find_packages(exclude=('tests', 'docs'))
)
