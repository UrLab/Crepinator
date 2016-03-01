#!/usr/bin/env python2

from serial import Serial
from glob import glob


def repl(port):
    with Serial(port, 250000) as P:
        P.write("\r\n")
        l = ""
        while l.strip() != 'echo:Unknown command: ""':
            l = P.readline()

        while True:
            try:
                line = raw_input(">> ")
            except EOFError:
                return
            i = line.find(';')
            if i >= 0:
                line = line[:i]
            line = line.strip()
            if line:
                P.write(line + "\r\n")
                l = P.readline().strip()
                print "--->", l
                assert l == "ok", l


if __name__ == "__main__":
    from sys import argv

    ports = glob("/dev/ttyACM*")
    if len(argv) > 1:
        repl(argv[1])
    elif len(ports) == 1:
        repl(ports[0])
    else:
        print("Could not determine the printer port")
