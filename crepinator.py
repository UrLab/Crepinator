import os
import asyncio
import subprocess
from tempfile import mkstemp
from functools import partial
from sys import stdout
from autobahn.asyncio.wamp import ApplicationSession, ApplicationRunner

import stlmaker

import logging
logging.basicConfig(
    stream=stdout, level=logging.INFO,
    format="%(asctime)s %(levelname)7s: %(message)s")
logger = logging.getLogger(__name__)


class Pancake:
    def __init__(self, name, alpha):
        self.name = name
        self.alpha = alpha
        self.stl, self.gcode = None, None
        self.done = False

    @property
    def state(self):
        if not self.stl:
            return "Accepted"
        if not self.gcode:
            return "Extruded"
        if not self.done:
            return "Ready to print"
        return "Finished"

    def __str__(self):
        return "<Pancake {}: {}>".format(self.name, self.state)


class Slic3rError(Exception):
    pass


class Crepinator(ApplicationSession):
    @asyncio.coroutine
    def onJoin(self, details):
        self.queue = []
        self.loop = asyncio.get_event_loop()
        asyncio.async(self.mainloop())

        def print_pancake(name, data):
            logging.info("Print request incoming")
            asyncio.async(self.enqueue(Pancake(name, data)))
            return True

        yield from self.register(lambda: True, 'ping')
        yield from self.register(print_pancake, 'print')
        logger.info("Ready to go")

    @asyncio.coroutine
    def alpha_to_stl(self, pancake):
        """
        Convert an alpha bitmap as sent by the frontend app to an stl file on
        disk, and return its path
        """
        fd, stl = mkstemp(prefix='crepinator.', suffix='.stl')
        out = os.fdopen(fd, 'wb')
        proc = partial(stlmaker.process, out, pancake.alpha, 2)
        yield from self.loop.run_in_executor(None, proc)
        out.close()
        pancake.stl = stl
        return pancake

    @asyncio.coroutine
    def stl_to_gcode(self, pancake):
        """
        Convert an stl file to gcode using slic3r
        """
        gcode = pancake.stl[:-4] + '.gcode'
        # Sad story https://bugs.python.org/issue23548
        p = yield from asyncio.create_subprocess_exec(
            "slic3r", "-o", gcode, "--load", "slic3r.ini", pancake.stl,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            loop=self.loop)
        yield from p.communicate()
        r = yield from p.wait()
        if r != 0:
            raise Slic3rError("Error while slicing pancake !")
        pancake.gcode = gcode
        return pancake

    def enqueue(self, pancake):
        yield from self.alpha_to_stl(pancake)
        logger.info("Created 3D model as {}".format(pancake.stl))

        yield from self.stl_to_gcode(pancake)
        logger.info("Created gcode as {}".format(pancake.gcode))

        self.queue.append(pancake)
        logger.info("Enqueued {}".format(pancake))

    def mainloop(self, idle_wait=5):
        while True:
            try:
                if len(self.queue) == 0:
                    logger.debug("No queued gcode...")
                    yield from asyncio.sleep(idle_wait)
                else:
                    pancake, self.queue = self.queue[0], self.queue[1:]
                    logger.info("Printing {}".format(pancake))
                    yield from asyncio.sleep(15)
                    pancake.done = True
                    os.unlink(pancake.gcode)
                    os.unlink(pancake.stl)
                    logger.info("Finished {}".format(pancake))
            except Exception:
                logger.exception("ERROR IN MAINLOOP")

if __name__ == "__main__":
    ApplicationRunner("ws://localhost:8080/ws", "crepinator").run(Crepinator)
