# measure-app

## Development

#### Prerequisites
* [Node v0.12+](https://nodejs.org)
* Ionic framework (`npm install -g cordova ionic`)

#### Getting Started

After installing prerequisites, run:

```bash
# Restore platform and plugin settings
ionic state restore

# Build for browser platform
ionic build browser
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

#### Translating

`grunt nggettext_extract`

