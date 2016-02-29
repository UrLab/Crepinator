NODE = node_modules
BUILD = static/app.js static/index.html

all: ${BUILD}

clean:
	rm ${BUILD}

${NODE}: package.json
	npm install

static/app.js: src/*.js ${NODE}
	npm run build-prod

static/%.html: src/%.haml
	haml $< > $@
