import { StatusBar, StyleSheet, View } from 'react-native'
import React from 'react'
import COLORS from '../styles/colors'
import { SafeAreaView } from 'react-native-safe-area-context'

const WrapperContainer = ({
  children,
  wrapperStyle
}) => {

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'light-content'} backgroundColor={'#fff'} />
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