import os
import asyncio
import subprocess
from tempfile import mkstemp
from functools import partial
from sys import stdout

import stlmaker

import logging
logging.basicConfig(
    stream=stdout, level=logging.INFO,
    format="%(asctime)s %(levelname)7s: %(message)s")
logger = logging.getLogger(__name__)


class Slic3rError(Exception):
    pass


class Crepinator:
    def __init__(self, loop=None):
        self.queue = []
        self.loop = asyncio.get_event_loop() if loop is None else loop

    @asyncio.coroutine
    def alpha_to_stl(self, alpha):
        """
        Convert an alpha bitmap as sent by the frontend app to an stl file on
        disk, and return its path
        """
        fd, stl = mkstemp(prefix='crepinator.', suffix='.stl')
        out = os.fdopen(fd, 'wb')
        proc = partial(stlmaker.process, out, alpha)
        yield from self.loop.run_in_executor(None, proc)
        out.close()
        return stl

    @asyncio.coroutine
    def stl_to_gcode(self, stl):
        """
        Convert an stl file to gcode using slic3r
        """
        gcode = stl[:-4] + '.gcode'
        # Sad story https://bugs.python.org/issue23548
        p = yield from asyncio.create_subprocess_exec(
            "slic3r", "-o", gcode, stl,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            loop=self.loop)
        yield from p.communicate()
        r = yield from p.wait()
        if r != 0:
            raise Slic3rError("Error while slicing pancake !")
        return gcode

    def enqueue(self, alpha):
        stl = yield from self.alpha_to_stl(alpha)
        logger.info("Created 3D model as {}".format(stl))

        gcode = yield from self.stl_to_gcode(stl)
        self.queue.append(gcode)
        logger.info("Enqueued {}".format(gcode))

    def mainloop(self, idle_wait=5):
        while True:
            try:
                if len(self.queue) == 0:
                    logger.debug("No queued gcode...")
                    yield from asyncio.sleep(idle_wait)
                else:
                    gcode, self.queue = self.queue[0], self.queue[1:]
                    logger.info("Printing {}".format(gcode))
                    yield from asyncio.sleep(5)
                    os.unlink(gcode)
                    os.unlink(gcode[:-6]+'.stl')
                    logger.info("Finished printing {}".format(gcode))
            except Exception:
                logger.exception("ERROR IN MAINLOOP")

if __name__ == "__main__":
    import json

    alpha = json.load(open("alpha.json"))
    c = Crepinator()
    asyncio.async(c.enqueue(alpha))
    asyncio.async(c.enqueue(alpha))
    asyncio.get_event_loop().run_until_complete(asyncio.sleep(10))
