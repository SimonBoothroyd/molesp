import os
import pickle

from fastapi import FastAPI
from pkg_resources import resource_filename
from pydantic import BaseSettings
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import HTMLResponse
from starlette.staticfiles import StaticFiles

import molesp
from molesp.models import ESPMolecule


class Settings(BaseSettings):

    MOLESP_API_PORT: int = 8000
    MOLESP_DATA_PATH: str = ""


settings = Settings()

static_directory = resource_filename("molesp", os.path.join("gui", "_static"))

if not os.path.isdir(static_directory) or not os.path.isfile(
    os.path.join(static_directory, "index.html")
):
    raise RuntimeError("`index.html` is missing - make sure `frontend` was built.")

app = FastAPI(title="molesp", openapi_url="/api/openapi.json", docs_url="/api/docs")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=static_directory), name="static")


@app.get("/")
def get_app():

    with open(os.path.join(static_directory, "index.html")) as file_index:
        html_content = file_index.read().replace(
            "http://localhost:8000/api",
            f"http://localhost:{settings.MOLESP_API_PORT}/api",
        )

    return HTMLResponse(html_content, status_code=200)


@app.get("/api")
async def get_api_root():
    return {
        "version": molesp.__version__,
        "settings": {"api_port": settings.MOLESP_API_PORT},
    }


@app.get("/api/molecule")
async def get_molecule() -> ESPMolecule:

    with open(settings.MOLESP_DATA_PATH, "rb") as file:
        data: ESPMolecule = pickle.load(file)

    return data
