# measure-app

## Development

### Prerequisites

* [Node v0.12+](https://nodejs.org)
  * Preferably via [nvm](https://github.com/creationix/nvm), e.g. `nvm use [version]`
* [Cordova](https://www.npmjs.com/package/cordova), [Gulp](http://gulpjs.com), and [CCA](https://github.com/MobileChromeApps/mobile-chrome-apps) toolchain: `npm install -g cordova cca gulp-cli`
* [Yarn](https://yarnpkg.com/): `npm install -g yarn`
* [Android SDK](http://developer.android.com/sdk/installing/index.html?pkg=tools)
  * To completely install the SDK, you must:
  * run `[sdk directory]/tools/android sdk` and setup the [tools](http://developer.android.com/sdk/installing/adding-packages.html)
  * Minimal packages that must be installed:
    * Android SDK Tools
    * Android Platform-tools
    * Android SDK Build-tools **22.0.1**
    * Android 5.1.1 (API 22) > SDK Platform (this may also require you to install higher SDK Platform versions)
    * Extras > Android Support Repository
    * Extras > Android Support Library

  * Optionally, install a system image for the emulator.

### Getting Started

After installing prerequisites, run:

```bash
# Install dependencies and set up build environment
yarn
```

## Mobile App

### Building as an Android App

To build as an Android app:

```bash
# Setup app manifest, bower dependencies, CSS, and translations
gulp app

# Package
cca prepare android
cca build android
```

### Running

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

### Building as a Chrome Extension

**NB:** The app can be loaded as a Chrome App (standalone) or Chrome extension (browser-embedded).

Only run this command if you want to build the extension version.  Otherwise skip to [Running](#Running).

```bash
gulp extension
```

#### Running in Chrome

In Chrome, add the "unpacked extension":

`chrome://extensions`

* Ensure `Developer mode` is checked.
* Click the `Load unpacked extension...` button and select the `www` subdirectory

Now you should see the Measure.app icon on the toolbar.

#### Packaging as a .crx

To create a `.crx` file, open:

`chrome://extensions`

Click the `Packed extension...` button and select the `platforms/browser/www` subdirectory.

This will create a `www.crx` and associated private key `www.pem`.  You'll need both to distribute this extension to testers.

#### Packaging for Distribution in the Chrome Store

To publish as a Chrome App, you'll need to:

* Edit the version in `www/manifest.json` to be higher than the previous version, Note: 0.15 < 0.16 but 0.15 > 0.2
* Zip up the `www` folder
* Log into the Chrome Developers Console
* Edit the existing application
* Upload new version, and save to publish the app
* Publishing takes ~15-30 minutes to fully publish an update
* Force update the extension in `chrome://extensions` to pull the update

## Translations

User interface strings are tagged in the source code using the [getttext](https://en.wikipedia.org/wiki/Gettext) system. Strings presented in the application's user interface are coded with _gettext_ function calls, for example:

```html
# Examples from an HTML template:

<ion-view view-title="{{ 'About' | translate }}">
<span translate>About M-Lab Measure App</span>
```

```javascript
# Examples from a JS file:

.controller("manualTranslationStrings", function (gettext) {
    var translationStrings = {
        "Time": gettext("Time"),
        "Service Provider": gettext("Service Provider"),
        "Your Location": gettext("Your Location"),

```

When the application is built, all strings properly identified by _gettext_ function calls are automatically parsed into an updated master file of and saved in: **/www/translations/source/application.pot**. All of the strings in the master file are in English.

This file must then be uploaded to the project's [Transifex account](https://www.transifex.com/otf/mlab-app/mlab_app_translations/). Click the button labelled "Updating source file", then notify translators that new strings are available to translate.

When translators have completed their work, the 100% complete language files may be downloaded for use, and saved in [/www/translations/lang](www/translations/lang). Subsequent builds of the extension or app will then automatically include the updated language strings or new language string sets.
