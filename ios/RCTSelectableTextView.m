#import "RCTSelectableTextView.h"

// Custom UITextView subclass to intercept copy action
@interface SelectableTextView : UITextView
@property (nonatomic, weak) RCTSelectableTextView *parentView;
@end

@implementation SelectableTextView

- (void)copy:(id)sender {
    NSRange selectedRange = self.selectedRange;
    if (selectedRange.length > 0) {
        NSString *selectedText = [self.text substringWithRange:selectedRange];
        
        // Copy to pasteboard (default behavior)
        UIPasteboard *pasteboard = [UIPasteboard generalPasteboard];
        pasteboard.string = selectedText;
        
        // Send event to React Native
        if (self.parentView && self.parentView.onSelection && selectedText) {
            NSDictionary *event = @{
                @"eventType": @"Copy",
                @"content": selectedText
            };
            self.parentView.onSelection(event);
        }
    }
}

@end

@interface RCTSelectableTextView () <UITextViewDelegate>

@property (nonatomic, strong) SelectableTextView *textView;

@end

@implementation RCTSelectableTextView

- (instancetype)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        _textView = [[SelectableTextView alloc] initWithFrame:self.bounds];
        _textView.parentView = self;
        _textView.delegate = self;
        _textView.editable = NO;
        _textView.selectable = YES;
        _textView.scrollEnabled = YES;
        _textView.backgroundColor = [UIColor clearColor];
        _textView.textContainerInset = UIEdgeInsetsMake(10, 10, 10, 10);
        _textView.textContainer.lineFragmentPadding = 0;
        _textView.font = [UIFont systemFontOfSize:16];
        _textView.textColor = [UIColor colorWithRed:0.26 green:0.26 blue:0.26 alpha:1.0];
        
        // Enable text selection
        _textView.userInteractionEnabled = YES;
        
        [self addSubview:_textView];
    }
    return self;
}

- (void)layoutSubviews {
    [super layoutSubviews];
    _textView.frame = self.bounds;
}

- (void)setText:(NSString *)text {
    _text = text;
    _textView.text = text;
}

- (void)setMenuItems:(NSArray<NSString *> *)menuItems {
    _menuItems = menuItems;
}

- (void)textViewDidChangeSelection:(UITextView *)textView {
    // Selection changed - system will handle menu display
}

@end

