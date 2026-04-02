#import <UIKit/UIKit.h>
#import <React/RCTComponent.h>

@interface RCTSelectableTextView : UIView

@property (nonatomic, copy) NSString *text;
@property (nonatomic, copy) NSArray<NSString *> *menuItems;
@property (nonatomic, copy) RCTBubblingEventBlock onSelection;

@end

