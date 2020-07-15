all: clean transpile
	electron-packager . --platform=linux,darwin,win32 --arch=x64

transpile:
	browserify --exclude electron renderer.js -t babelify -o bundle.js

dev: transpile
	npm start

clean:
	rm -rf Flow\ Charter-darwin-x64/
	rm -rf Flow\ Charter-linux-x64/
	rm -rf Flow\ Charter-win32-x64/

.PHONY: transpile clean
