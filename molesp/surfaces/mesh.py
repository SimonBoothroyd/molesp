from typing import Tuple

import numpy


def apply_marching_cubes(
    density: numpy.ndarray,
    iso_level: float,
    n_smoothing_interations: int = 10,
    smoothing_factor: float = 0.5,
) -> Tuple[numpy.ndarray, numpy.ndarray]:
    """Applies the marching cubes algorithm"""

    from ._molesp import march

    return march(density, iso_level, n_smoothing_interations, smoothing_factor)
