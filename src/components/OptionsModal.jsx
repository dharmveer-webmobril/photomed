import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Text
} from 'react-native';

const OptionsModal = ({ visible, onClose, onAddImage ,onCompare}) => {
 
  const openGallery = async () => {

  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      // onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Title</Text>
          <View style={{ height: 1, color: "#7F7F7F" }} />
          <TouchableOpacity
            style={[styles.button, { marginBottom: 8 }]}
            onPress={onAddImage}
          >
            <Text style={styles.buttonText}>Add image</Text>
          </TouchableOpacity>
          <View style={{ height: 1, color: "#7F7F7F" }} />
          <TouchableOpacity style={styles.button} onPress={()=>{onCompare()}}>
            <Text style={styles.buttonText}>Compare</Text>
          </TouchableOpacity>
          <View style={{ height: 1, color: "#7F7F7F" }} />
          <TouchableOpacity
            style={[styles.button, { marginBottom: 8 }]}
            onPress={openGallery}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>

          <View style={{ height: 0.5, color: "#7F7F7F" }} />
        </View>
        <View style={styles.cancelButtonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>{'Cancel'}</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    paddingTop: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  cancelButtonContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  title: {
    fontSize: 12,
    fontFamily: '600',
    marginBottom: 15,
    color: '#7F7F7F',
  },
  button: {
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: '600',
  },
  cancelButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: 'red',
    fontFamily: '600',
  },
});

export default OptionsModal;