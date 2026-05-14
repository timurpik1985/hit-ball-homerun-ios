#!/usr/bin/env node

/**
 * Cordova Hook: Inject ATT Plugin into iOS Project
 *
 * Runs as after_prepare and:
 *   1. Writes ATTPlugin.h and ATTPlugin.m into the iOS project's Plugins folder
 *   2. Registers <feature name="ATTPlugin"> in the iOS config.xml
 *   3. Uses node-xcode to add the .h/.m files to project.pbxproj so they get
 *      compiled into the app binary  <-- THE CRITICAL STEP
 *   4. Links the AppTrackingTransparency framework (weak)
 *
 * The `xcode` npm package is bundled with cordova-ios so we can require it
 * without a separate install.
 */

const fs = require('fs');
const path = require('path');

module.exports = function (context) {
  console.log('');
  console.log('==========================================');
  console.log('  ATT PLUGIN INJECTION HOOK STARTING');
  console.log('==========================================');

  var platforms = (context.opts && context.opts.platforms) || [];
  if (platforms.indexOf('ios') < 0) {
    console.log('[ATT-Hook] Not an iOS build, skipping');
    return;
  }

  var projectRoot = context.opts.projectRoot;
  var iosPath = path.join(projectRoot, 'platforms', 'ios');

  if (!fs.existsSync(iosPath)) {
    console.log('[ATT-Hook] iOS platform folder not found');
    return;
  }

  // Find Xcode project name
  var xcodeProjectName = null;
  var dirEntries = fs.readdirSync(iosPath);
  for (var i = 0; i < dirEntries.length; i++) {
    if (dirEntries[i].endsWith('.xcodeproj')) {
      xcodeProjectName = dirEntries[i].replace('.xcodeproj', '');
      break;
    }
  }

  if (!xcodeProjectName) {
    console.log('[ATT-Hook] ERROR: .xcodeproj not found in platforms/ios');
    return;
  }
  console.log('[ATT-Hook] Xcode project name:', xcodeProjectName);

  var projectDir = path.join(iosPath, xcodeProjectName);
  var pluginsDir = path.join(projectDir, 'Plugins');
  var pbxprojPath = path.join(iosPath, xcodeProjectName + '.xcodeproj', 'project.pbxproj');
  var iosConfigXmlPath = path.join(projectDir, 'config.xml');

  console.log('[ATT-Hook] Plugins dir:', pluginsDir);
  console.log('[ATT-Hook] pbxproj path:', pbxprojPath);

  if (!fs.existsSync(pbxprojPath)) {
    console.log('[ATT-Hook] ERROR: project.pbxproj not found at', pbxprojPath);
    return;
  }

  // 1. Write ATTPlugin.h and ATTPlugin.m
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
  }

  var attHeader =
    '#import <Cordova/CDVPlugin.h>\n\n' +
    '@interface ATTPlugin : CDVPlugin\n\n' +
    '- (void)requestPermission:(CDVInvokedUrlCommand*)command;\n' +
    '- (void)getStatus:(CDVInvokedUrlCommand*)command;\n\n' +
    '@end\n';

  var attImpl =
    '#import "ATTPlugin.h"\n' +
    '#import <AppTrackingTransparency/AppTrackingTransparency.h>\n' +
    '#import <AdSupport/AdSupport.h>\n\n' +
    '@implementation ATTPlugin\n\n' +
    '- (void)requestPermission:(CDVInvokedUrlCommand*)command {\n' +
    '    NSLog(@"[ATTPlugin] requestPermission called");\n' +
    '    if (@available(iOS 14.5, *)) {\n' +
    '        [ATTrackingManager requestTrackingAuthorizationWithCompletionHandler:^(ATTrackingManagerAuthorizationStatus status) {\n' +
    '            NSString* statusString = @"unknown";\n' +
    '            switch (status) {\n' +
    '                case ATTrackingManagerAuthorizationStatusAuthorized:    statusString = @"authorized"; break;\n' +
    '                case ATTrackingManagerAuthorizationStatusDenied:        statusString = @"denied"; break;\n' +
    '                case ATTrackingManagerAuthorizationStatusRestricted:    statusString = @"restricted"; break;\n' +
    '                case ATTrackingManagerAuthorizationStatusNotDetermined: statusString = @"notDetermined"; break;\n' +
    '            }\n' +
    '            NSLog(@"[ATTPlugin] Result: %@", statusString);\n' +
    '            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:statusString];\n' +
    '            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];\n' +
    '        }];\n' +
    '    } else {\n' +
    '        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"notAvailable"];\n' +
    '        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];\n' +
    '    }\n' +
    '}\n\n' +
    '- (void)getStatus:(CDVInvokedUrlCommand*)command {\n' +
    '    if (@available(iOS 14.5, *)) {\n' +
    '        ATTrackingManagerAuthorizationStatus status = [ATTrackingManager trackingAuthorizationStatus];\n' +
    '        NSString* statusString = @"unknown";\n' +
    '        switch (status) {\n' +
    '            case ATTrackingManagerAuthorizationStatusAuthorized:    statusString = @"authorized"; break;\n' +
    '            case ATTrackingManagerAuthorizationStatusDenied:        statusString = @"denied"; break;\n' +
    '            case ATTrackingManagerAuthorizationStatusRestricted:    statusString = @"restricted"; break;\n' +
    '            case ATTrackingManagerAuthorizationStatusNotDetermined: statusString = @"notDetermined"; break;\n' +
    '        }\n' +
    '        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:statusString];\n' +
    '        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];\n' +
    '    } else {\n' +
    '        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"notAvailable"];\n' +
    '        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];\n' +
    '    }\n' +
    '}\n\n' +
    '@end\n';

  fs.writeFileSync(path.join(pluginsDir, 'ATTPlugin.h'), attHeader);
  fs.writeFileSync(path.join(pluginsDir, 'ATTPlugin.m'), attImpl);
  console.log('[ATT-Hook] Wrote ATTPlugin.h and ATTPlugin.m');

  // 2. Register <feature> in iOS config.xml
  if (fs.existsSync(iosConfigXmlPath)) {
    var iosConfig = fs.readFileSync(iosConfigXmlPath, 'utf8');
    if (iosConfig.indexOf('<feature name="ATTPlugin"') < 0) {
      var featureBlock =
        '    <feature name="ATTPlugin">\n' +
        '        <param name="ios-package" value="ATTPlugin" />\n' +
        '    </feature>\n';
      iosConfig = iosConfig.replace('</widget>', featureBlock + '</widget>');
      fs.writeFileSync(iosConfigXmlPath, iosConfig);
      console.log('[ATT-Hook] Registered ATTPlugin in iOS config.xml');
    } else {
      console.log('[ATT-Hook] ATTPlugin already registered in iOS config.xml');
    }
  } else {
    console.log('[ATT-Hook] WARNING: iOS config.xml not found at', iosConfigXmlPath);
  }

  // 3. Load node-xcode and modify pbxproj
  var xcode = null;
  var resolvePaths = [
    path.join(projectRoot, 'node_modules', 'xcode'),
    path.join(projectRoot, 'node_modules', 'cordova-ios', 'node_modules', 'xcode'),
    path.join(iosPath, 'cordova', 'node_modules', 'xcode')
  ];
  for (var j = 0; j < resolvePaths.length; j++) {
    try {
      if (fs.existsSync(resolvePaths[j])) {
        xcode = require(resolvePaths[j]);
        console.log('[ATT-Hook] Loaded xcode module from:', resolvePaths[j]);
        break;
      }
    } catch (e) { /* try next */ }
  }
  if (!xcode) {
    try {
      xcode = require('xcode');
      console.log('[ATT-Hook] Loaded xcode module via default resolution');
    } catch (e) {
      console.log('[ATT-Hook] ERROR: Could not load xcode module:', e.message);
      console.log('[ATT-Hook] Files were written but NOT added to compile sources');
      return;
    }
  }

  var pbxProject = xcode.project(pbxprojPath);
  pbxProject.parseSync();

  // Detect if already added (idempotent across re-runs)
  var pbxFileRefs = pbxProject.hash.project.objects.PBXFileReference || {};
  var alreadyHasM = false;
  var alreadyHasH = false;
  Object.keys(pbxFileRefs).forEach(function (k) {
    var v = pbxFileRefs[k];
    if (v && typeof v === 'object' && v.path) {
      if (v.path.indexOf('ATTPlugin.m') >= 0) alreadyHasM = true;
      if (v.path.indexOf('ATTPlugin.h') >= 0) alreadyHasH = true;
    }
  });

  try {
    if (!alreadyHasH) {
      pbxProject.addHeaderFile('Plugins/ATTPlugin.h');
      console.log('[ATT-Hook] Added ATTPlugin.h to pbxproj');
    } else {
      console.log('[ATT-Hook] ATTPlugin.h already in pbxproj');
    }
    if (!alreadyHasM) {
      pbxProject.addSourceFile('Plugins/ATTPlugin.m');
      console.log('[ATT-Hook] Added ATTPlugin.m to pbxproj (compile sources)');
    } else {
      console.log('[ATT-Hook] ATTPlugin.m already in pbxproj');
    }

    // Link AppTrackingTransparency.framework (weak link for iOS 14.5+ availability)
    try {
      pbxProject.addFramework('AppTrackingTransparency.framework', {
        customFramework: false, embed: false, link: true, weak: true
      });
      console.log('[ATT-Hook] Linked AppTrackingTransparency.framework (weak)');
    } catch (fwErr) {
      console.log('[ATT-Hook] Framework link note:', fwErr.message);
    }

    fs.writeFileSync(pbxprojPath, pbxProject.writeSync());
    console.log('[ATT-Hook] Wrote modified project.pbxproj');
  } catch (e) {
    console.log('[ATT-Hook] ERROR modifying pbxproj:', e.message);
    if (e.stack) console.log(e.stack);
  }

  console.log('==========================================');
  console.log('  ATT PLUGIN INJECTION COMPLETE');
  console.log('==========================================');
  console.log('');
};
