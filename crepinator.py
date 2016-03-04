import os
import asyncio
import subprocess
from tempfile import mkstemp
from functools import partial
from sys import stdout
from autobahn.asyncio.wamp import ApplicationSession, ApplicationRunner
from serial import Serial

import stlmaker

import logging
logging.basicConfig(
    stream=stdout, level=logging.INFO,
    format="%(asctime)s %(levelname)7s: %(message)s")
logger = logging.getLogger(__name__)


SERIAL_PORT = "/dev/ttyACM0"


class Pancake:
    def __init__(self, name, alpha):
        self.name = name
        self.alpha = alpha
        self.stl, self.gcode = None, None
        self.printing, self.done = False, False
        self.percent = 0

    @property
    def state(self):
        if not self.stl:
            return 0
        if not self.gcode:
            return 1
        if not self.printing:
            return 2
        if not self.done:
            return 3
        return 4

    def as_dict(self):
        return {
            'name': self.name,
            'state': self.state,
            'percent': self.percent,
        }

    def __str__(self):
        return "<Pancake {}: {} {}%>".format(self.name, self.state, self.percent)


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
        yield from self.register(self.formatted_queue, 'get-queue')
        logger.info("Ready to go")

    def formatted_queue(self):
        return [p.as_dict() for p in self.queue]

    def publish_queue(self):
        self.publish('queue', *self.formatted_queue())

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

    @asyncio.coroutine
    def enqueue(self, pancake):
        self.queue.append(pancake)
        self.publish_queue()

        yield from self.alpha_to_stl(pancake)
        logger.info("Created 3D model as {}".format(pancake.stl))
        self.publish_queue()

        yield from self.stl_to_gcode(pancake)
        logger.info("Created gcode as {}".format(pancake.gcode))
        self.publish_queue()

    def print_pancake(self, pancake):
        with Serial(SERIAL_PORT, 250000) as printer:
            def sync_readline():
                return printer.readline().decode()

            def async_readline():
                return self.loop.run_in_executor(None, sync_readline)

            def async_command(cmd):
                printer.write((cmd + '\r\n').encode('ascii'))
                line = yield from async_readline()
                assert line == "ok"

            yield from asyncio.sleep(1)

            # Consume input buffer
            printer.write(" \r\n".encode('ascii'))
            l = ""
            while l.strip() != 'ok':
                l = yield from async_readline()

            def read_file():
                # Send lines to printer
                for line in open(pancake.gcode):
                    i = line.find(';')
                    if i >= 0:
                        line = line[:i]
                    line = line.strip()
                    # Ignore temperature commands for now
                    if line.startswith('M104') or line.startswith('M109'):
                        continue
                    if line:
                        yield line

            lines = list(read_file())
            last_percent = -1
            for i, line in enumerate(lines):
                yield from async_command(line)
                percent = int(100*float(i)/len(lines))
                if percent != last_percent:
                    pancake.percent = percent
                    self.publish_queue()
                    last_percent = percent
            pancake.done = True
            self.publish_queue()
            yield from async_command("G28")
            yield from async_command("M84")

    def cleanup_pancake(self, pancake):
        os.unlink(pancake.gcode)
        os.unlink(pancake.stl)
        logger.info("Finished {}".format(pancake))

    @asyncio.coroutine
    def _mainloop_step(self, idle_wait):
        Q = self.queue
        if len(Q) == 0 or Q[0].printing or not Q[0].gcode:
            logger.debug("No queued gcode...")
            yield from asyncio.sleep(idle_wait)
        else:
            pancake = Q[0]
            pancake.printing = True
            self.publish_queue()
            logger.info("Printing {}".format(pancake))

            try:
                yield from self.print_pancake(pancake)
            except:
                logger.exception("Error while printing")

            self.cleanup_pancake(pancake)
            self.queue = self.queue[1:]
            self.publish_queue()

    @asyncio.coroutine
    def mainloop(self, idle_wait=5):
        while True:
            try:
                yield from self._mainloop_step(idle_wait)
            except Exception:
                logger.exception("ERROR IN MAINLOOP")


class Fakinator(Crepinator):
    def alpha_to_stl(self, pancake):
        yield from asyncio.sleep(5)
        pancake.stl = pancake.name + '.stl'

    def stl_to_gcode(self, pancake):
        yield from asyncio.sleep(5)
        pancake.gcode = pancake.name + '.gcode'

    def print_pancake(self, pancake):
        for i in range(11):
            pancake.percent = 10*i
            self.publish_queue()
            yield from asyncio.sleep(1)

    def cleanup_pancake(self, pancake):
        logger.info("Cleanup {}".format(pancake))

if __name__ == "__main__":
    ApplicationRunner("ws://localhost:8080/ws", "crepinator").run(Crepinator)
