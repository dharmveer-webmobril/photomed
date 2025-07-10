import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import COLORS from '../../../styles/colors'
import FONTS from '../../../styles/fonts'

const Border = () => {
  return (
    <View>
      <Text style={{color:COLORS.whiteColor,fontFamily:FONTS.regular}}>No grid</Text>
    </View>
  )
}

export default Border

const styles = StyleSheet.create({})