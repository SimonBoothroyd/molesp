import pickle

import rich
import uvicorn
from openff.utilities import temporary_cd

from molesp.models import ESPMolecule
from molesp.utilities import set_env


def launch(molecule: ESPMolecule, port: int = 8000):

    with temporary_cd():

        with open("esp-molecule.pkl", "wb") as file:
            pickle.dump(molecule, file)

        with set_env(MOLESP_API_PORT=f"{port}", MOLESP_DATA_PATH="esp-molecule.pkl"):

            rich.print(
                f"The GUI will be available at "
                f"[markdown.link_url]http://localhost:{port}[/markdown.link_url] "
                f"after a few seconds."
            )

            uvicorn.run(
                "molesp.gui._app:app",
                host="0.0.0.0",
                port=port,
                log_level="error",
            )
