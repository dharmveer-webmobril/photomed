import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import COLORS from '../styles/colors'
import FONTS from '../styles/fonts'

const CustomBtn = ({ title, btnStyle, onPress, titleStyle, isLoadin = false }) => {
  return (
    <TouchableOpacity onPress={onPress}
      style={[styles.btnContainer, btnStyle]}>
      {isLoadin ? <ActivityIndicator size={'small'} color={COLORS.whiteColor} /> : <Text style={[styles.title, titleStyle]}>{title}</Text>}

    </TouchableOpacity>
  )
}

export default CustomBtn

const styles = StyleSheet.create({
  btnContainer: {
    backgroundColor: COLORS.primary,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 44,
    width: '100%',
  }, title: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.whiteColor,
  }
})