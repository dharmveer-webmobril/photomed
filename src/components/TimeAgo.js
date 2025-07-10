// TimeAgo.js
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import moment from 'moment';
import FONTS from '../styles/fonts'
import COLORS from '../styles/colors'

const TimeAgo = ({ timestamp }) => {
  if (!timestamp) return null;

  const timeAgo = moment(timestamp).fromNow();

  return <Text style={styles.subtitle}>{timeAgo}</Text>;
};

export default TimeAgo;

const styles = StyleSheet.create({
    subtitle: {
        fontFamily: FONTS.regular,
        fontSize: 10,
        color: COLORS.textColor,
        alignSelf:'flex-end',
        marginLeft:20
      },
})
