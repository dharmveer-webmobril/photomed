import React, { useRef, useState } from 'react';
import {
  View,
  Button,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { detectFaces } from 'react-native-vision-camera-face-detector';
import {
  Skia,
  Paint,
  Path,
  ImageFilter,
  TileMode,
  ClipOp,
} from '@shopify/react-native-skia';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

export default function App() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [imageUri, setImageUri] = useState(null);
  const [showCamera, setShowCamera] = useState(true);
  const cameraRef = useRef(null);

  const device = useCameraDevice('back');

  const faceDetectionOptions = {
    performanceMode: 'fast',
    classificationMode: 'all',
    contourMode: 'all',
    landmarkMode: 'all',
  };

  const pickImage = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 800,
        height: 800,
        cropping: true,
        cropperCircleOverlay: false,
        includeBase64: false,
        mediaType: 'photo',
      });

      setImageUri(image.path);
      setShowCamera(false);

      const faces = await detectFaces({ image: image.path });
      console.log('Detected faces from picked image:', faces.length);
      Alert.alert('Success', `Found ${faces.length} face(s) in picked photo!`);
    } catch (error) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.log('ImagePicker Error: ', error);
        Alert.alert('Error', error.message || 'Failed to pick image');
      }
    }
  };

  const takeSnapshotAndDetect = async () => {
    if (!cameraRef.current) return;

    try {
      const snapshot = await cameraRef.current.takeSnapshot({
        quality: 90,
      });

      const uri = Platform.OS === 'android' 
        ? `file://${snapshot.path}` 
        : snapshot.path;

      const faces = await detectFaces({ image: uri });
      console.log('Detected faces from snapshot:', faces.length);
      console.log('Detected faces from snapshot:', JSON.stringify(faces,null,2));
      Alert.alert('Snapshot Result', `Found ${faces.length} face(s) in camera snapshot!`);
    } catch (error) {
      console.log('Snapshot error:', error);
      Alert.alert('Error', 'Failed to take or analyze snapshot');
    }
  };

  const skiaActions = (faces, frame) => {
    'worklet';

    if (faces.length === 0) return;

    const face = faces[0];
    const { bounds, contours, landmarks } = face;
 
    const blurRadius = 30;
    const blurFilter = ImageFilter.MakeBlur(blurRadius, blurRadius, TileMode.Decal, null);
    const blurPaint = Paint();
    blurPaint.setImageFilter(blurFilter);

    const facePath = Path.Make();
    if (contours?.FACE && contours.FACE.length > 0) {
      contours.FACE.forEach((point, i) => {
        if (i === 0) facePath.moveTo(point.x, point.y);
        else facePath.lineTo(point.x, point.y);
      });
      facePath.close();
    }

    frame.save();
    frame.clipPath(facePath, ClipOp.Intersect, true);
    frame.drawPaint(blurPaint);
    frame.restore();
 
    const mouthPath = Path.Make();
    const mouthPaint = Paint();
    mouthPaint.setColor(Skia.Color('red'));
    mouthPaint.setStyle('stroke');
    mouthPaint.setStrokeWidth(8);

    const mouthPoints = [
      landmarks?.MOUTH_LEFT,
      landmarks?.MOUTH_BOTTOM,
      landmarks?.MOUTH_RIGHT,
    ].filter(Boolean);

    if (mouthPoints.length > 1) {
      mouthPoints.forEach((p, i) => {
        if (i === 0) mouthPath.moveTo(p.x, p.y);
        else mouthPath.lineTo(p.x, p.y);
      });
      mouthPath.close();
      frame.drawPath(mouthPath, mouthPaint);
    }


    const rectPaint = Paint();
    rectPaint.setColor(Skia.Color('cyan'));
    rectPaint.setStyle('stroke');
    rectPaint.setStrokeWidth(6);
    frame.drawRect(bounds, rectPaint);
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera Permission Required</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No Camera Found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showCamera && (
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true}
          faceDetectionOptions={faceDetectionOptions}
          faceDetectionCallback={(faces) => {
            if (faces.length > 0) {
              console.log('Live faces detected:', faces.length);
            }
          }}
          skiaActions={skiaActions}
        />
      )}

      {imageUri && !showCamera && (
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
      )}

      <View style={styles.buttonContainer}>
        <Button title="Pick Photo & Detect Face" onPress={pickImage} />
        <View style={{ height: 10 }} />
        <Button
          title="Take Snapshot & Detect"
          onPress={takeSnapshotAndDetect}
          disabled={!showCamera}
        />
        <View style={{ height: 10 }} />
        <Button
          title={showCamera ? 'Hide Camera' : 'Show Camera'}
          onPress={() => setShowCamera(!showCamera)}
        />
      </View>

      <View style={styles.status}>
        <Text style={styles.statusText}>
          {showCamera ? 'Live Camera + Face Effects' : 'Static Image'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 12,
  },
  status: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
});