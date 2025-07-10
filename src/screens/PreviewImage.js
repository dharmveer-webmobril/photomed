import React from 'react';
import { StyleSheet, Image } from 'react-native';

const PreviewImage = ({ source }) => {
  return <Image source={{ uri: source }} style={styles.image} />;
};

const styles = StyleSheet.create({
  image: {
    aspectRatio: 1,
    width: '100%',
    resizeMode: 'contain', // Use 'resizeMode' instead of 'objectFit'
    backgroundColor: 'black',
  },
});

export default PreviewImage;
