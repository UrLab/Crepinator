#!./ve3/bin/python

from serial import Serial
from glob import glob
from time import sleep


def repl(port):
    with Serial(port, 250000) as P:
        print("Opening {}".format(port))
        sleep(1)
        P.write(" \r\n".encode('ascii'))
        l = ""
        while l.strip() != 'ok':
            l = P.readline().decode('ascii')

        while True:
            try:
                line = input(">> ")
            except EOFError:
                return
            i = line.find(';')
            if i >= 0:
                line = line[:i]
            line = line.strip()
            if line:
                P.write((line + "\r\n").encode('ascii'))
                l = P.readline().decode('ascii').strip()
                print("--->", l)
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
