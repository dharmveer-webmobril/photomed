import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import MlkitOcr from 'react-native-mlkit-ocr';

export default function OCRScanScreen() {
  const [loading, setLoading] = useState(false);
  const [detectedName, setDetectedName] = useState('');

  const extractName = (text) => {
    const match =
      text.match(/name[:\s]*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i) ||
      text.match(/([A-Z][a-z]+\s[A-Z][a-z]+)/);
    return match ? match[1].trim() : '';
  };

  const handleScan = async () => {
    try {
      setLoading(true);
      const image = await ImagePicker.openCamera({
        cropping: true,
      });

      const result = await MlkitOcr.detectFromFile(image.path);
      const allText = result.map(block => block.text).join(' ');
      const name = extractName(allText);

      if (name) {
        setDetectedName(name);
        checkIfPatientExists(name);
      } else {
        Alert.alert('No name found', 'Try scanning again.');
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfPatientExists = async (name) => {
    // Example: check local or backend DB
    // Here we’ll use a dummy local array for example
    const existingPatients = ['John Doe', 'Sarah Connor', 'Tony Stark'];

    // if (existingPatients.includes(name)) {
    //   navigation.navigate('PatientDetail', { name });
    // } else {
    //   navigation.navigate('NewPatientForm', { prefillName: name });
    // }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.scanBtn} onPress={handleScan}>
        <Text style={styles.scanText}>📸 Scan Patient ID</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#00BFFF" />}

      {detectedName ? (
        <Text style={styles.detected}>Detected: {detectedName}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  scanBtn: { backgroundColor: '#007bff', padding: 15, borderRadius: 10 },
  scanText: { color: 'white', fontWeight: '600' },
  detected: { marginTop: 20, fontSize: 16, color: '#333' },
});
