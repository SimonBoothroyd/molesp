"""
molesp

Generate and visualize the ESP at the surface of a molecule
"""
import os
import re
import shutil
import subprocess
import sys

from setuptools import Command, find_packages, setup
from setuptools.command.build_ext import build_ext
from setuptools.extension import Extension

import versioneer


class CMakeExtension(Extension):
    def __init__(self, name, sourcedir=""):
        Extension.__init__(self, name, sources=[])
        self.sourcedir = os.path.abspath(sourcedir)


class NodeExtension(Extension):
    def __init__(self, name, sourcedir=""):
        Extension.__init__(self, name, sources=[])
        self.sourcedir = os.path.abspath(sourcedir)


class BuildLibraryCommand(build_ext):
    """A custom command to build the C++ marching cube library and include it in the project root.

    Based on the ``pybind11`` CMake example.
    """

    def build_extension(self, ext):

        extdir = os.path.abspath(os.path.dirname(self.get_ext_fullpath(ext.name)))

        if not extdir.endswith(os.path.sep):
            extdir += os.path.sep

        debug = int(os.environ.get("DEBUG", 0)) if self.debug is None else self.debug
        cfg = "Debug" if debug else "Release"

        cmake_args = [
            f"-DCMAKE_LIBRARY_OUTPUT_DIRECTORY={extdir}",
            f"-DPYTHON_EXECUTABLE={sys.executable}",
            f"-DCMAKE_BUILD_TYPE={cfg}",
        ]

        if "CMAKE_ARGS" in os.environ:
            cmake_args += [item for item in os.environ["CMAKE_ARGS"].split(" ") if item]

        if sys.platform.startswith("darwin"):
            # Cross-compile support for macOS - respect ARCHFLAGS if set
            archs = re.findall(r"-arch (\S+)", os.environ.get("ARCHFLAGS", ""))

            if archs:
                cmake_args += ["-DCMAKE_OSX_ARCHITECTURES={}".format(";".join(archs))]

        build_args = []

        if "CMAKE_BUILD_PARALLEL_LEVEL" not in os.environ:
            if hasattr(self, "parallel") and self.parallel:
                build_args += [f"-j{self.parallel}"]

        build_temp = os.path.join(self.build_temp, ext.name)

        if not os.path.exists(build_temp):
            os.makedirs(build_temp)

        subprocess.check_call(["cmake", ext.sourcedir] + cmake_args, cwd=build_temp)
        subprocess.check_call(["cmake", "--build", "."] + build_args, cwd=build_temp)


class BuildGUICommand(Command):
    """A custom command to build the GUI and include it in the packages ``data``
    directory.
    """

    user_options = []

    def initialize_options(self) -> None:
        pass

    def finalize_options(self) -> None:
        pass

    description = "build the GUI"

    def run(self):
        cwd = os.getcwd()

        try:
            os.chdir("gui")
            subprocess.check_call(["npm", "install"])
            subprocess.check_call(["npm", "run", "build", "--", "--base", "/static/"])

            output_directory = os.path.join(os.pardir, "molesp", "gui", "_static")

            shutil.rmtree(output_directory, True)
            shutil.move("dist", output_directory)

        finally:
            os.chdir(cwd)


short_description = __doc__.split("\n")

# from https://github.com/pytest-dev/pytest-runner#conditional-requirement
needs_pytest = {"pytest", "test", "ptr"}.intersection(sys.argv)
pytest_runner = ["pytest-runner"] if needs_pytest else []

try:
    with open("README.md", "r") as handle:
        long_description = handle.read()
except IOError:
    long_description = "\n".join(short_description[2:])


setup(
    name="molesp",
    author="Simon Boothroyd",
    description=short_description[0],
    long_description=long_description,
    long_description_content_type="text/markdown",
    version=versioneer.get_version(),
    requires=[],
    setup_requires=[],
    cmdclass={
        **versioneer.get_cmdclass(),
        "build_gui": BuildGUICommand,
        "build_ext": BuildLibraryCommand,
    },
    ext_modules=[CMakeExtension("molesp.surfaces._molesp", "cpp")],
    license="MIT",
    packages=find_packages(),
    include_package_data=True,
    entry_points={
        "console_scripts": [
            "molesp=molesp.cli:main",
        ],
    },
)
