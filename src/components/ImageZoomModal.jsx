import React from "react";
import { Modal, Pressable, View, StyleSheet } from "react-native";
import ImageViewing from "react-native-image-viewing";

const ImageZoomModal = ({ visible, onClose, imageUri, imageIndex }) => {
  console.log('imageIndex',imageIndex);
  
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          <ImageViewing
            images={imageUri}
            imageIndex={imageIndex}
            visible={true}
            onRequestClose={onClose}
            swipeToCloseEnabled={false}
            doubleTapToZoomEnabled
          />
        </View>
      </View>
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
});

export default ImageZoomModal;
