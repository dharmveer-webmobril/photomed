import React from 'react';
import { requireNativeComponent, Platform } from 'react-native';
import PropTypes from 'prop-types';

let RCTSelectableTextView;

try {
  RCTSelectableTextView = requireNativeComponent('RCTSelectableTextView');
} catch (error) {
  if (Platform.OS === 'ios') {
    console.warn('RCTSelectableTextView native module not found. Make sure the native files are added to Xcode project.');
  } else if (Platform.OS === 'android') {
    console.warn('RCTSelectableTextView native module not found. Make sure the package is registered in MainApplication.');
  }
  RCTSelectableTextView = null;
}

const SelectableTextInput = ({ text, menuItems, onSelection, style, ...props }) => {
  const handleSelection = (event) => {
    if (onSelection && event.nativeEvent) {
      onSelection(event.nativeEvent);
    }
  };

  // Fallback for iOS if native module is not available
  if (Platform.OS === 'ios' && !RCTSelectableTextView) {
    console.warn('Using fallback text view. Native module not loaded.');
    // You could return a regular Text component here as fallback
    return null;
  }

  if (!RCTSelectableTextView) {
    return null;
  }

  return (
    <RCTSelectableTextView
      {...props}
      style={style}
      text={text}
      menuItems={menuItems || ['Copy']}
      onSelection={handleSelection}
    />
  );
};

SelectableTextInput.propTypes = {
  text: PropTypes.string,
  menuItems: PropTypes.arrayOf(PropTypes.string),
  onSelection: PropTypes.func,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

// Set display name for better debugging
SelectableTextInput.displayName = 'SelectableTextInput';

export default SelectableTextInput;

