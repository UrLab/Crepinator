from struct import pack


def point(fd, x, y, z):
    fd.write(pack('fff', x, y, z))


def triangle(fd, normal, p1, p2, p3):
    point(fd, *normal)
    point(fd, *p1)
    point(fd, *p2)
    point(fd, *p3)
    fd.write('\x00\x00')


def extrude_rect(fd, xmin, ymin, h=1, xmax=None, ymax=None):
    if xmax is None:
        xmax = xmin + 1
    if ymax is None:
        ymax = ymin + 1

    # bottom
    triangle(fd, (0, 0, 1), (xmin, ymin, 0), (xmin, ymax, 0), (xmax, ymax, 0))
    triangle(fd, (0, 0, 1), (xmin, ymin, 0), (xmax, ymax, 0), (xmax, ymin, 0))

    # top
    triangle(fd, (0, 0, 1), (xmin, ymin, h), (xmax, ymax, h), (xmin, ymax, h))
    triangle(fd, (0, 0, 1), (xmin, ymin, h), (xmax, ymin, h), (xmax, ymax, h))

    # side ymin
    triangle(fd, (0, 1, 0), (xmin, ymin, 0), (xmax, ymin, h), (xmin, ymin, h))
    triangle(fd, (0, 1, 0), (xmin, ymin, 0), (xmax, ymin, 0), (xmax, ymin, h))

    # side ymax
    triangle(fd, (0, 1, 0), (xmin, ymax, 0), (xmin, ymax, h), (xmax, ymax, h))
    triangle(fd, (0, 1, 0), (xmin, ymax, 0), (xmax, ymax, h), (xmax, ymax, 0))

    # side xmin
    triangle(fd, (1, 0, 0), (xmin, ymin, 0), (xmin, ymin, h), (xmin, ymax, h))
    triangle(fd, (1, 0, 0), (xmin, ymin, 0), (xmin, ymax, h), (xmin, ymax, 0))

    # side xmax
    triangle(fd, (1, 0, 0), (xmax, ymin, 0), (xmax, ymax, h), (xmax, ymin, h))
    triangle(fd, (1, 0, 0), (xmax, ymin, 0), (xmax, ymax, 0), (xmax, ymax, h))


def stl_header(fd, n_triangles):
    fd.write('\x2A'*80)
    fd.write(pack('I', n_triangles))


if __name__ == "__main__":
    pixels = [(i, j) for i in range(400) for j in range(400)]

    with open('python.stl', 'w') as out:
        stl_header(out, 12*len(pixels))
        for p in pixels:
            extrude_rect(out, *p)
