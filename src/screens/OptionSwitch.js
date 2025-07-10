import React from 'react';
import { StyleSheet, Switch, View, Text } from 'react-native';

const OptionSwitch = ({ value, onChange, label }) => {
  return (
    <View style={styles.switchContainer}>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
      />
      <Text style={styles.switchLabel}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  switchLabel: {
    color: '#333',
    marginLeft: 15,
  },
});

export default OptionSwitch;
