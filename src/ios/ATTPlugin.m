#import "ATTPlugin.h"
#import <AppTrackingTransparency/AppTrackingTransparency.h>
#import <AdSupport/AdSupport.h>

@implementation ATTPlugin

- (void)requestPermission:(CDVInvokedUrlCommand*)command {
    if (@available(iOS 14.5, *)) {
        [ATTrackingManager requestTrackingAuthorizationWithCompletionHandler:^(ATTrackingManagerAuthorizationStatus status) {
            CDVPluginResult* pluginResult = nil;
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
            
            NSLog(@"[ATTPlugin] Authorization status: %@", statusString);
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:statusString];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }];
    } else {
        // iOS < 14.5
        NSLog(@"[ATTPlugin] ATT not available on iOS < 14.5");
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
