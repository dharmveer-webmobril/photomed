import React from "react";
import { Modal, Pressable, View, StyleSheet, Dimensions, Image, TouchableOpacity } from "react-native";
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../styles/colors";

const ImageZoomModal = ({ visible, onClose, imageUriJson, imageIndex }) => {
  console.log('imageIndex', imageIndex);
  console.log('imageUriJson', imageUriJson);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
    >
      <SafeAreaView style={styles.backdrop}>
        <View style={styles.closeBtnContainer}>

          <TouchableOpacity onPress={() => { onClose() }} style={styles.removeFaceBtn}>
            <Image source={require('../assets/images/icons/close.png')} style={{ height: 12, width: 12, tintColor: COLORS.whiteColor }} />
          </TouchableOpacity>
        </View>
        <View style={styles.modalContent}>
          <ReactNativeZoomableView
            maxZoom={30}
            contentWidth={300}
            contentHeight={150}
          >
            <Image source={{ uri: imageUriJson?.path }} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
          </ReactNativeZoomableView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    height: "100%",
  },
  removeFaceBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    zIndex: 9999
  },
  closeBtnContainer: {
    backgroundColor: "red",
    width: "100%",
    zIndex: 9999,
  }
});

export default ImageZoomModal;
