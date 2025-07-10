const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const config = {
    transformer: {
        babelTransformerPath: require.resolve('react-native-svg-transformer'),
      },
  resolver: {
    // Add 'svg' to sourceExts so Metro can process SVG files as source code
    sourceExts: [...getDefaultConfig(__dirname).resolver.sourceExts, 'svg'],
    // Remove 'svg' from assetExts so that it is not treated as an asset
    assetExts: ['bin', 'bmp', 'png', 'jpg', 'jpeg', 'gif', 'mp4', 'm4v', 'wav', 'aac', 'otf', 'ttf', 'eot'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);