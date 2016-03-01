NODE = node_modules
BUILD = static/app.js static/index.html

all: ${BUILD}

clean:
	rm ${BUILD}

${NODE}: package.json
	npm install

static/app.js: src/*.js src/*.jsx ${NODE}
	npm run build

static/%.html: src/%.haml
	haml $< > $@
