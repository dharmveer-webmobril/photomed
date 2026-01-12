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
        <TouchableOpacity onPress={() => { onClose() }} style={styles.removeFaceBtn}>
          <Image source={require('../assets/images/icons/close.png')} style={{ height: 12, width: 12, tintColor: COLORS.primary }} />
        </TouchableOpacity>
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
    backgroundColor: "rgba(0,0,0)",
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
    right: 40,
    backgroundColor: COLORS.whiteColor,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    zIndex: 9999
  }
});

export default ImageZoomModal;
