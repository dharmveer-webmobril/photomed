import TextRecognition from '@react-native-ml-kit/text-recognition';
import { useRoute } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import { View, Button, StyleSheet, Image, Text, Alert, ScrollView } from 'react-native';
import { CropView } from 'react-native-image-crop-tools';

const ImageCropperTool = () => {
  const cropViewRef = useRef(null);
  const [croppedImageUri, setCroppedImageUri] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);

  const route = useRoute();
  const imageuri = route?.params?.imageuri;

  const handleCropResult = async (result) => {
    let uri = result.uri;

    // Fix missing prefix (required for Android)
    if (!uri.startsWith("file://")) {
      uri = `file://${uri}`;
    }

    console.log("Final Cropped URI:", uri);
    setCroppedImageUri(uri);
    
    // OCR Extraction
    setLoading(true);
    try {
      const recText = await TextRecognition.recognize(uri);
      console.log("Extracted OCR:", recText);
      setExtractedText(recText.text || "No Text Detected");
    } catch (err) {
      console.log("OCR Error:", err);
      setExtractedText("Failed to read text");
    }
    setLoading(false);
  };

  const triggerCrop = () => {
    if (cropViewRef.current) {
      cropViewRef.current.saveImage(true, 90);
    }
  };

  const resetAll = () => {
    setCroppedImageUri(null);
    setExtractedText('');
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {!croppedImageUri ? (
        <>
          <CropView
            ref={cropViewRef}
            sourceUrl={imageuri}
            style={styles.cropView}
            onImageCrop={handleCropResult}
          />
          <Button title="Crop & Extract Text" onPress={triggerCrop} />
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <Text style={styles.title}>Cropped Image</Text>
          <Image source={{ uri: croppedImageUri }} style={styles.croppedImage} />

          <Text style={styles.title}>Extracted Text</Text>

          {loading ? (
            <Text style={{ fontSize: 16, color: "gray" }}>Extracting...</Text>
          ) : (
            <Text selectable style={styles.extractedText}>
              {extractedText}
            </Text>
          )}

          <Button title="Reset" onPress={resetAll} />
        </ScrollView>
      )}
    </View>
  );
};

export default ImageCropperTool;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  cropView: { flex: 1 },
  resultContainer: { alignItems: 'center', padding: 20 },
  title: { fontSize: 18, marginVertical: 10, fontWeight: '600' },
  croppedImage: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  extractedText: {
    fontSize: 16,
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    width: "100%",
  }
});
