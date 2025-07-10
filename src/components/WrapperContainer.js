import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import COLORS from '../styles/colors'

const WrapperContainer = ({
  children,
  wrapperStyle
}) => {

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.container, wrapperStyle]}>
        {children}
      </View>
    </SafeAreaView>
  )
}

export default WrapperContainer

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.whiteColor
  }
})