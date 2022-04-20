import pickle
from typing import Tuple

import click
import numpy
import rich
from openff.recharge.esp import ESPSettings
from openff.recharge.esp.psi4 import Psi4ESPGenerator
from openff.recharge.grids import MSKGridSettings
from openff.recharge.utilities.molecule import extract_conformers
from openff.recharge.utilities.toolkits import VdWRadiiType, compute_vdw_radii
from openff.toolkit.topology import Molecule
from openff.units import unit
from openff.utilities import temporary_cd
from scipy.spatial.distance import cdist

from molesp.gui import launch
from molesp.models import ESPMolecule, Surface
from molesp.surfaces.grids import generate_cubic_grid
from molesp.surfaces.mesh import apply_marching_cubes


def compute_surface(
    molecule: Molecule,
    conformer: unit.Quantity,
    radii: unit.Quantity,
    radii_scale: float = 1.4,
    spacing: unit.Quantity = 0.2 * unit.angstrom,
) -> Tuple[numpy.ndarray, numpy.ndarray]:

    grid, grid_offset, n_grid_points = generate_cubic_grid(
        molecule, conformer, spacing, radii_scale * 2.0
    )
    distances = cdist(conformer.m_as(unit.angstrom), grid.m_as(unit.angstrom))

    is_within_shell = numpy.any(
        (distances < radii.m_as(unit.angstrom) * radii_scale), axis=0
    )
    density = is_within_shell.reshape(n_grid_points)

    vertices, indices = apply_marching_cubes(density, 0.5)
    vertices = grid_offset + vertices * spacing

    return vertices.m_as(unit.angstrom), indices


def esp_molecule_from_smiles(smiles: str) -> ESPMolecule:

    console = rich.get_console()

    with console.status("[1] loading molecule"):

        molecule: Molecule = Molecule.from_smiles(smiles)
        molecule.generate_conformers(n_conformers=1)

        assert molecule.n_conformers == 1, "molecule must have exactly one conformer"
        [conformer] = extract_conformers(molecule)

        conformer -= numpy.mean(conformer, axis=0)

        vdw_radii = compute_vdw_radii(molecule, radii_type=VdWRadiiType.Bondi)

        radii = (
            numpy.array([[radii] for radii in vdw_radii.m_as(unit.angstrom)])
            * unit.angstrom
        )

    console.print("[1] loaded molecule")

    with console.status("[2] generating surface"):

        vertices, indices = compute_surface(
            molecule, conformer, radii, 1.4, 0.2 * unit.angstrom
        )

    console.print("[2] surface generated")

    with console.status("[3] generating QC esp"):

        esp_settings = ESPSettings(
            basis="6-31G*", method="hf", grid_settings=MSKGridSettings()
        )

        with temporary_cd():

            _, esp, _ = Psi4ESPGenerator._generate(
                molecule,
                conformer,
                vertices * unit.angstrom,
                esp_settings,
                "",
                minimize=False,
                compute_esp=True,
                compute_field=False,
            )

    console.print("[3] generated QC esp")

    esp_molecule = ESPMolecule(
        atomic_numbers=[atom.atomic_number for atom in molecule.atoms],
        conformer=conformer.m_as(unit.angstrom).flatten().tolist(),
        surface=Surface(
            vertices=vertices.flatten().tolist(), indices=indices.flatten().tolist()
        ),
        esp={"QC ESP": esp.m_as(unit.hartree / unit.e).flatten().tolist()},
    )
    return esp_molecule


@click.command()
@click.option(
    "--file",
    "file_path",
    type=click.Path(exists=True, file_okay=True, dir_okay=False),
    required=False,
    help="The path to a pickled (.pkl) ESP molecule to load",
)
@click.option(
    "--smiles",
    type=str,
    required=False,
    help="The SMILES representation of the molecule to load",
)
@click.option(
    "--port",
    type=int,
    default=8000,
    show_default=True,
    required=True,
    help="The port to run the GUI on.",
)
@click.pass_context
def main(ctx, file_path: str, smiles: str, port: int):

    console = rich.get_console()
    console.rule("MolESP - a molecule ESP viewer")

    if file_path is not None:
        with open(file_path, "rb") as file:
            esp_molecule: ESPMolecule = pickle.load(file)
    else:
        esp_molecule = esp_molecule_from_smiles(smiles)

    launch(esp_molecule, port=port)


if __name__ == "__main__":
    main()
