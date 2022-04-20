from typing import Dict, List

from pydantic import BaseModel, Extra


class MolESPModel(BaseModel):
    class Config:
        extra = Extra.forbid


class Surface(MolESPModel):

    vertices: List[float]
    indices: List[int]


class ESPMolecule(MolESPModel):

    atomic_numbers: List[int]

    conformer: List[float]

    surface: Surface
    esp: Dict[str, List[float]]
