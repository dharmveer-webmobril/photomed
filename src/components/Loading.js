import { StyleSheet, Text, View, Modal } from 'react-native'
import React from 'react'
import LottieView from 'lottie-react-native'
const Loading = ({ visible }) => {
  
  return (
    <Modal
      transparent
      visible={visible}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <LottieView source={require('../components/loader.json')} autoPlay loop style={{ height: 100, width: 100 }} />
      </View>
    </Modal>
  )
}

export default Loading

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
})