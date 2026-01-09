#import "RCTSelectableTextViewManager.h"
#import "RCTSelectableTextView.h"
#import <React/RCTUIManager.h>
#import <React/RCTBridge.h>
#import <React/RCTViewManager.h>
#import <React/RCTLog.h>

@implementation RCTSelectableTextViewManager

RCT_EXPORT_MODULE()

- (UIView *)view {
    RCTSelectableTextView *view = [[RCTSelectableTextView alloc] init];
    return view;
}

RCT_EXPORT_VIEW_PROPERTY(text, NSString)
RCT_EXPORT_VIEW_PROPERTY(menuItems, NSArray)
RCT_EXPORT_VIEW_PROPERTY(onSelection, RCTBubblingEventBlock)

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

@end

