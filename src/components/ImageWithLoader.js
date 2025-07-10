import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import COLORS from '../styles/colors';

const ImageWithLoader = ({ uri, style,resizeMode,containerStyle }) => {
  const [loading, setLoading] = useState(true);

  return (
    <View style={[containerStyle,style]}>
      {loading &&
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#000" />
        </View>
      }
      <FastImage
        resizeMode={resizeMode}
        source={{ uri }}
        style={style}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
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
    backgroundColor: COLORS.greyBgColor, // Semi-transparent background for overlay effect
  },
});
