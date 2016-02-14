# measure-app

## Development

#### Prerequisites
* [Node v0.12+](https://nodejs.org)
* Cordova and [CCA](https://github.com/MobileChromeApps/mobile-chrome-apps) toolchain: `npm install -g cordova cca`

#### Getting Started

After installing prerequisites, run:

```bash
# Setup build environment
npm install
```

## Mobile App

#### Building

To build as an Android app:

```bash
# Setup app manifest, bower dependencies, CSS, and translations
gulp app

# Package
cca platform add android
cca build android
```

#### Running

```bash
# Run on emulator
cca run android --emulator

# or run on a connected device
cca run android --device
```

If running on a device, you can open Chrome at `chrome://inspect` to get live debugging using Developer Tools.

#### Packaging

```bash
cca build android --release
```

## Chrome Extension

#### Building

```bash
gulp extension
```

#### Running

In Chrome, add the "unpacked extension":

`chrome://extensions`

* Ensure `Developer mode` is checked.
* Click the `Load unpacked extension...` button and select the `platforms/browser/www` subdirectory

Now you should see the Measure.app icon on the toolbar.

#### Packaging

To create a `.crx` file, open: 

`chrome://extensions`

Click the `Packed extension...` button and select the `platforms/browser/www` subdirectory.

This will create a `www.crx` and associated private key `www.pem`.  You'll need both to distribute this extension to testers.

## Translations

Translations are automatically added during the build process.

Refer to [/www/translations/lang](www/translations/lang) to find currently available translations.
