import contextlib
import os.path


@contextlib.contextmanager
def set_env(**environ):

    old_environ = dict(os.environ)
    os.environ.update(environ)

    try:
        yield
    finally:
        os.environ.clear()
        os.environ.update(old_environ)
