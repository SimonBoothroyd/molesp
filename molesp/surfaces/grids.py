from typing import Tuple

import numpy
from openff.recharge.utilities.toolkits import VdWRadiiType, compute_vdw_radii
from openff.toolkit.topology import Molecule
from openff.units import unit


def generate_cubic_grid(
    molecule: Molecule,
    conformer: unit.Quantity,
    spacing: unit.Quantity,
    radii_scale: float = 1.4,
) -> Tuple[unit.Quantity, unit.Quantity, numpy.ndarray]:

    conformer = conformer.m_as(unit.bohr)
    spacing = spacing.m_as(unit.bohr)

    vdw_radii = compute_vdw_radii(molecule, radii_type=VdWRadiiType.Bondi)
    radii = numpy.array([[radii] for radii in vdw_radii.m_as(unit.bohr)])

    minimum_bounds = numpy.min(conformer - radii * radii_scale, axis=0)
    maximum_bounds = numpy.max(conformer + radii * radii_scale, axis=0)

    grid_bounds = maximum_bounds - minimum_bounds

    n_grid_points = numpy.ceil(grid_bounds / spacing / 2.0).astype(int) * 2 + 1

    grid_origin = numpy.mean(conformer, axis=0) - spacing * (n_grid_points - 1) / 2
    grid = numpy.zeros((n_grid_points[0] * n_grid_points[1] * n_grid_points[2], 3))

    for x in range(n_grid_points[0]):
        for y in range(n_grid_points[1]):
            for z in range(n_grid_points[2]):

                point = grid_origin + numpy.array([[x, y, z]]) * spacing

                index = (
                    z + y * n_grid_points[2] + x * n_grid_points[2] * n_grid_points[1]
                )

                grid[index] = point

    return grid * unit.bohr, grid_origin * unit.bohr, n_grid_points
