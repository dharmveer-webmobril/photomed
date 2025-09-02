import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import COLORS from '../styles/colors';

const ImageWithLoader = ({ uri, style, resizeMode, containerStyle }) => {
  const [loading, setLoading] = useState(true);

  // Check if uri is a string (remote) or require (local number)
  const isRemote = typeof uri === 'string';

  return (
    <View style={[containerStyle, style]}>
      {loading && isRemote && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#000" />
        </View>
      )}
      <FastImage
        resizeMode={resizeMode || FastImage.resizeMode.cover}
        source={isRemote ? { uri } : uri}
        style={style}
        onLoadStart={() => isRemote && setLoading(true)}
        onLoadEnd={() => isRemote && setLoading(false)}
      />
    </View>
  );
};

export default ImageWithLoader;

const styles = StyleSheet.create({
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.greyBgColor,
  },
});
