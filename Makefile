all:
	electron-packager . --platform=linux,darwin,win32 --arch=x64

.PHONY: all
