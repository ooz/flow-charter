all: clean
	electron-packager . --platform=linux,darwin,win32 --arch=x64

clean:
	rm -rf Flow\ Charter-darwin-x64/
	rm -rf Flow\ Charter-linux-x64/
	rm -rf Flow\ Charter-win32-x64/

.PHONY: clean
