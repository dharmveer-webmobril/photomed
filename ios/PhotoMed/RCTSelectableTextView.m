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
        
        // Set content size mode
        _textView.textContainer.widthTracksTextView = YES;
        _textView.textContainer.heightTracksTextView = NO;
        
        [self addSubview:_textView];
    }
    return self;
}

- (void)layoutSubviews {
    [super layoutSubviews];
    CGRect bounds = self.bounds;
    
    // Ensure textView takes full bounds
    _textView.frame = bounds;
    
    // Force text container to recalculate
    [_textView.layoutManager ensureLayoutForTextContainer:_textView.textContainer];
    
    // Update content size based on actual text content
    CGRect usedRect = [_textView.layoutManager usedRectForTextContainer:_textView.textContainer];
    CGFloat contentHeight = usedRect.size.height + _textView.textContainerInset.top + _textView.textContainerInset.bottom;
    
    // Set content size to enable scrolling if content is larger than view
    if (contentHeight > bounds.size.height) {
        _textView.contentSize = CGSizeMake(bounds.size.width, contentHeight);
        _textView.scrollEnabled = YES;
    } else {
        _textView.contentSize = bounds.size;
        _textView.scrollEnabled = YES; // Keep enabled for selection
    }
}

- (void)setText:(NSString *)text {
    if ([_text isEqualToString:text]) {
        return; // No change
    }
    
    _text = text;
    _textView.text = text;
    
    // Force text container to recalculate layout
    [_textView.layoutManager ensureLayoutForTextContainer:_textView.textContainer];
    
    // Force layout recalculation after text is set
    [self setNeedsLayout];
    
    // Use dispatch to ensure layout happens after text is set
    dispatch_async(dispatch_get_main_queue(), ^{
        [self layoutIfNeeded];
    });
}

- (void)setMenuItems:(NSArray<NSString *> *)menuItems {
    _menuItems = menuItems;
}

- (void)textViewDidChangeSelection:(UITextView *)textView {
    // Selection changed - system will handle menu display
}

@end

