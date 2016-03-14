NODE = node_modules
BUILD = static/app.js static/index.html

all: slic3r.ini ${BUILD}

clean:
	rm ${BUILD}

${NODE}: package.json
	npm install

static/app.js: src/*.js src/*.jsx ${NODE}
	npm run build-prod

static/%.html: src/%.haml
	haml $< > $@

slic3r.ini: Slic3r_config_bundle.ini
	python slic3r_minimal_config.py
