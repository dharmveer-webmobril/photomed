import { Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import imagePath from '../configs/imagePath'
import COLORS from '../styles/colors'
import imagePaths from '../assets/images'

const NoInternet = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.whiteColor }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", width: 300, alignSelf: 'center' }}>
        <Image
          tintColor={COLORS.primary}
          source={imagePaths.nointernet}
          style={{ height: 80, width: 80, marginVertical: 15 }}
        />
        <Text style={{ textAlign: 'center', fontSize: 14, color: COLORS.textColor }}>Looks like you don’t have an internet connection. Please reconnect and try again.</Text>
      </View>
    </SafeAreaView>
  )
}

export default NoInternet

const styles = StyleSheet.create({})