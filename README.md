## Molecule ESP Viewer

[![Language grade: Python](https://img.shields.io/lgtm/grade/python/g/SimonBoothroyd/molesp.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/SimonBoothroyd/molesp/context:python)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The `molesp` framework aims to offer a simple set of tools for generating and visualizing the electrostatic potential
(ESP) projected onto the scaled van der Waal surface of a molecule.

### Getting Started

The GUI can easily be launched from the command line using the `molesp` command:

```shell
molesp --smiles "C"
```

A full list of options can be printed using the `--help` flag:

```shell
molesp --help                                                                   
Usage: molesp [OPTIONS]

Options:
  --...
```

### Installation

The framework and its required dependencies can be installed using `conda`:

```shell
conda install -c conda-forge -c simonboothroyd molesp
```

#### From Source

The required dependencies for this framework can be installed using `conda`:

```shell
conda env create --name molesp --file devtools/conda-envs/test-env.yaml
```

after which the GUI can be built by running:

```shell
python setup.py build_gui
```

and the package installed in the normal ways, e.g.:

```shell
python setup.py install
```

### License

The main package is release under the [MIT license](LICENSE). 

### Copyright

Copyright (c) 2022, Simon Boothroyd
