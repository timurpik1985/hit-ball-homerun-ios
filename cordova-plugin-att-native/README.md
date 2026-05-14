# ATT Plugin - Upload Instructions

## How to Upload This Folder to GitHub

### Method 1: Upload Entire Folder (Easiest)

1. Go to: https://github.com/timurpik1985/hit-ball-homerun-ios/tree/main/plugins
2. Delete the existing wrong files:
   - Delete `plugins/package.json`
   - Delete `plugins/plugin.xml`
3. Click "Add file" → "Upload files"
4. Drag and drop this ENTIRE `cordova-plugin-att-native` folder
5. Commit changes

### Method 2: Upload Files One by One

Upload each file to the correct location:

1. `plugin.xml` → `plugins/cordova-plugin-att-native/plugin.xml`
2. `package.json` → `plugins/cordova-plugin-att-native/package.json`
3. `www/att.js` → `plugins/cordova-plugin-att-native/www/att.js`
4. `src/ios/ATTPlugin.h` → `plugins/cordova-plugin-att-native/src/ios/ATTPlugin.h`
5. `src/ios/ATTPlugin.m` → `plugins/cordova-plugin-att-native/src/ios/ATTPlugin.m`

## Final Structure Should Look Like:

```
plugins/
└── cordova-plugin-att-native/
    ├── plugin.xml
    ├── package.json
    ├── www/
    │   └── att.js
    └── src/
        └── ios/
            ├── ATTPlugin.h
            └── ATTPlugin.m
```

## After Uploading Plugin

1. Also delete `www/att.js` if it exists in your www folder (wrong location)
2. Also delete `src/` folder if it exists at root level (wrong location)
3. Update your config.xml to use this plugin
4. Update your index.html to call the plugin
5. Build!
