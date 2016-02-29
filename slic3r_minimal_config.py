"""
Convert a Slic3r exported config to a minimal config file
"""

from ConfigParser import RawConfigParser


def load_config(filename='Slic3r_config_bundle.ini'):
    conf = RawConfigParser()
    conf.read(filename)
    return {k: dict(conf.items(k)) for k in conf.sections()}


def write_config(conf_dict, filename='slic3r.ini'):
    config = RawConfigParser()
    for section, pairs in conf_dict.items():
        config.add_section(section)
        for key, val in pairs.items():
            config.set(section, key, val)
    with open(filename, 'wb') as out:
        config.write(out)


def extract_minimal_config(conf_dict):
    res = {}
    for key, preset in conf_dict['presets'].items():
        if preset.endswith('.ini'):
            res[key] = conf_dict[key+':'+preset[:-4]]
    return res


if __name__ == "__main__":
    write_config(extract_minimal_config(load_config()))
