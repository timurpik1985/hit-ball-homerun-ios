#!/usr/bin/env node

/**
 * After Prepare Hook - Directly Inject ATT Plugin Files into iOS Project
 * This runs after 'cordova prepare ios' and adds ATT files directly to the Xcode project
 */

const fs = require('fs');
const path = require('path');

module.exports = function(context) {
    const projectRoot = context.opts.projectRoot;
    const iosPath = path.join(projectRoot, 'platforms', 'ios');
    
    console.log('');
    console.log('=====================================');
    console.log('🎯 INJECTING ATT PLUGIN FILES...');
    console.log('=====================================');
    
    // Check if iOS platform exists
    if (!fs.existsSync(iosPath)) {
        console.log('❌ iOS platform not found');
        return;
    }
    
    // Find the Xcode project
    const files = fs.readdirSync(iosPath);
    let xcodeProject = null;
    
    for (let file of files) {
        if (file.endsWith('.xcodeproj')) {
            xcodeProject = file.replace('.xcodeproj', '');
            break;
        }
    }
    
    if (!xcodeProject) {
        console.log('❌ Xcode project not found');
        return;
    }
    
    console.log('✅ Found Xcode project:', xcodeProject);
    
    const pluginsPath = path.join(iosPath, xcodeProject, 'Plugins');
    
    // Create Plugins directory if it doesn't exist
    if (!fs.existsSync(pluginsPath)) {
        fs.mkdirSync(pluginsPath, { recursive: true });
        console.log('✅ Created Plugins directory');
    }
    
    // ATT Plugin Header File
    const attPluginH = `#import <Cordova/CDVPlugin.h>

@interface ATTPlugin : CDVPlugin

- (void)requestPermission:(CDVInvokedUrlCommand*)command;
- (void)getStatus:(CDVInvokedUrlCommand*)command;

@end
`;
    
    // ATT Plugin Implementation File
    const attPluginM = `#import "ATTPlugin.h"
#import <AppTrackingTransparency/AppTrackingTransparency.h>
#import <AdSupport/AdSupport.h>

@implementation ATTPlugin

- (void)requestPermission:(CDVInvokedUrlCommand*)command {
    NSLog(@"[ATTPlugin] requestPermission called");
    
    if (@available(iOS 14.5, *)) {
        [ATTrackingManager requestTrackingAuthorizationWithCompletionHandler:^(ATTrackingManagerAuthorizationStatus status) {
            CDVPluginResult* pluginResult = nil;
            NSString* statusString = @"unknown";
            
            switch (status) {
                case ATTrackingManagerAuthorizationStatusAuthorized:
                    statusString = @"authorized";
                    NSLog(@"[ATTPlugin] User AUTHORIZED tracking");
                    break;
                case ATTrackingManagerAuthorizationStatusDenied:
                    statusString = @"denied";
                    NSLog(@"[ATTPlugin] User DENIED tracking");
                    break;
                case ATTrackingManagerAuthorizationStatusRestricted:
                    statusString = @"restricted";
                    NSLog(@"[ATTPlugin] Tracking RESTRICTED");
                    break;
                case ATTrackingManagerAuthorizationStatusNotDetermined:
                    statusString = @"notDetermined";
                    NSLog(@"[ATTPlugin] Tracking NOT DETERMINED");
                    break;
            }
            
            NSLog(@"[ATTPlugin] Final status: %@", statusString);
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:statusString];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }];
    } else {
        NSLog(@"[ATTPlugin] iOS < 14.5, ATT not available");
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"notAvailable"];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }
}

- (void)getStatus:(CDVInvokedUrlCommand*)command {
    if (@available(iOS 14.5, *)) {
        ATTrackingManagerAuthorizationStatus status = [ATTrackingManager trackingAuthorizationStatus];
        NSString* statusString = @"unknown";
        
        switch (status) {
            case ATTrackingManagerAuthorizationStatusAuthorized:
                statusString = @"authorized";
                break;
            case ATTrackingManagerAuthorizationStatusDenied:
                statusString = @"denied";
                break;
            case ATTrackingManagerAuthorizationStatusRestricted:
                statusString = @"restricted";
                break;
            case ATTrackingManagerAuthorizationStatusNotDetermined:
                statusString = @"notDetermined";
                break;
        }
        
        NSLog(@"[ATTPlugin] Current status: %@", statusString);
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:statusString];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } else {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"notAvailable"];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }
}

@end
`;
    
    // Write header file
    const headerPath = path.join(pluginsPath, 'ATTPlugin.h');
    fs.writeFileSync(headerPath, attPluginH);
    console.log('✅ Created ATTPlugin.h');
    
    // Write implementation file
    const implPath = path.join(pluginsPath, 'ATTPlugin.m');
    fs.writeFileSync(implPath, attPluginM);
    console.log('✅ Created ATTPlugin.m');
    
    // Update config.xml to register the plugin
    const configXmlPath = path.join(iosPath, xcodeProject, 'config.xml');
    if (fs.existsSync(configXmlPath)) {
        let configXml = fs.readFileSync(configXmlPath, 'utf8');
        
        // Add feature if not already present
        if (!configXml.includes('<feature name="ATTPlugin">')) {
            const featureXml = `
    <feature name="ATTPlugin">
        <param name="ios-package" value="ATTPlugin" />
    </feature>
`;
            // Insert before </widget>
            configXml = configXml.replace('</widget>', featureXml + '</widget>');
            fs.writeFileSync(configXmlPath, configXml);
            console.log('✅ Registered ATTPlugin in config.xml');
        }
    }
    
    console.log('=====================================');
    console.log('✅ ATT PLUGIN INJECTION COMPLETE!');
    console.log('=====================================');
    console.log('');
};
