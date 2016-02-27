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
    import json
    import numpy as np

    def load_json(filename="alpha.json"):
        alpha = json.load(open(filename))
        k, l = 0, 0
        e = alpha[0]
        matrix = [[False for j in range(800)] for i in range(600)]
        for i in range(600):
            for j in range(800):
                matrix[i][j] = e & 0x80 != 0
                e <<= 1
                l += 1
                if l == 8:
                    k += 1
                    l = 0
                    e = alpha[k]
        return matrix

    def extrude_cubes(matrix):
        shapes = []
        for i in range(len(matrix)):
            for j in range(len(matrix[i])):
                if matrix[i][j]:
                    shapes.append({'xmin': j, 'xmax': j+1, 'ymin': i, 'ymax': i+1})
        return shapes

    def find_largest_polyhedrons(matrix):
        shapes = []
        H, W = matrix.shape
        # Iterate over matrix...
        for i in range(H):
            for j in range(W):
                # If the current pixel is not activated, just skip
                if not matrix[i][j]:
                    continue
                # Find the largest possible rectangle
                di, dj = 1, 1
                while matrix[i:i+di, j:j+dj].all() and i+di < H:
                    while matrix[i:i+di, j:j+dj].all() and j+dj < W:
                        dj += 1
                    if dj > 1:
                        dj -= 1
                    di += 1
                if di > 1:
                    di -= 1

                # Then create a rectangle there and set the pixels to 0
                shapes.append({'xmin': j, 'xmax': j+dj, 'ymin': i, 'ymax': i+di})
                matrix[i:i+di, j:j+dj] = 0
        return shapes

    with open('polyhedron.stl', 'w') as out:
        shapes = find_largest_polyhedrons(np.array(load_json()))
        stl_header(out, 12*len(shapes))
        for p in shapes:
            extrude_rect(out, **p)

    with open('cubes.stl', 'w') as out:
        shapes = extrude_cubes(load_json())
        stl_header(out, 12*len(shapes))
        for p in shapes:
            extrude_rect(out, **p)
