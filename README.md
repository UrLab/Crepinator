![Screenshot](screenshots/crepinator.png)

# Requirements

* python, virtualenv
* haml, sass
* node, npm

# Install

`./install.sh`

# Run

`./run.sh`

# Tweak Slic3r config

In slic3r, go to `File > Export Config Bundle...`, and export a file to replace
[Slic3r_config_bundle.ini](Slic3r_config_bundle.ini). Then run `make slic3r.ini`
to generate the production configuration file.

![Slic3r export](screenshots/slic3r_export.png)
