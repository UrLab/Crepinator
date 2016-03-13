"""
Convert a Slic3r exported bundle config to a minimal config file for
use in command line.
"""

from ConfigParser import RawConfigParser


def read_config(filename='Slic3r_config_bundle.ini'):
    """F*ckin OO-Side-Effect style !"""
    conf = RawConfigParser()
    conf.read(filename)
    return {k: dict(conf.items(k)) for k in conf.sections()}


def write_config(conf_dict, filename='slic3r.ini'):
    """F*ckin OO-Side-Effect style !"""
    with open(filename, 'wb') as out:
        for key in sorted(conf_dict.keys()):
            val = conf_dict[key]
            print >>out, "{} = {}".format(key, val)


def extract_minimal_config(conf_dict):
    res = {}
    for key, preset in conf_dict['presets'].items():
        if preset.endswith('.ini'):
            res.update(conf_dict[key+':'+preset[:-4]])
    return res


if __name__ == "__main__":
    write_config(extract_minimal_config(read_config()))
