# measure-app

## Development

#### Prerequisites
* [Node v0.12+](https://nodejs.org)
  - Preferably via [nvm](https://github.com/creationix/nvm), e.g. `nvm use [version]`
* [Cordova](https://www.npmjs.com/package/cordova), [Gulp](http://gulpjs.com), and [CCA](https://github.com/MobileChromeApps/mobile-chrome-apps) toolchain: `npm install -g cordova cca gulp-cli`
* [Android SDK](http://developer.android.com/sdk/installing/index.html?pkg=tools)
  - To completely install the SDK, you must:
  - run `[sdk directory]/tools/android sdk` and setup the [tools](http://developer.android.com/sdk/installing/adding-packages.html)
  - Minimal packages that must be installed:
    - Android SDK Tools
    - Android Platform-tools
    - Android SDK Build-tools **22.0.1**
    - Android 5.1.1 (API 22) > SDK Platform (this may also require you to install higher SDK Platform versions)
    - Extras > Android Support Repository
    - Extras > Android Support Library

  - Optionally, install a system image for the emulator.

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
cca prepare android
cca build android
```

#### Running

```bash
# Run on emulator
cca run android --emulator

# or run on a connected device
cca run android --device
```

Once running, you can open Chrome at `chrome://inspect` to get live debugging using Developer Tools.

#### Packaging

```bash
cca build android --release
```

## Chrome Extension

#### Building

**NB:** The app can be loaded as a Chrome App (standalone) or Chrome extension (browser-embedded).

Only run this command if you want to build the extension version.  Otherwise skip to [Running](#running).

```bash
gulp extension
```

#### Running

In Chrome, add the "unpacked extension":

`chrome://extensions`

* Ensure `Developer mode` is checked.
* Click the `Load unpacked extension...` button and select the `www` subdirectory

Now you should see the Measure.app icon on the toolbar.

#### Packaging

To create a `.crx` file, open:

`chrome://extensions`

Click the `Packed extension...` button and select the `platforms/browser/www` subdirectory.

This will create a `www.crx` and associated private key `www.pem`.  You'll need both to distribute this extension to testers.

## Translations

User interface strings are tagged in the source code using [getttext](#) tags. When the application is built, an updated set of strings are generated automatically and saved in: /www/translations/source/application.pot



Refer to [/www/translations/lang](www/translations/lang) to find currently available translations.
