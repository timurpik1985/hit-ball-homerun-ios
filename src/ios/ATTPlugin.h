#import <Cordova/CDVPlugin.h>

@interface ATTPlugin : CDVPlugin

- (void)requestPermission:(CDVInvokedUrlCommand*)command;
- (void)getStatus:(CDVInvokedUrlCommand*)command;

@end
