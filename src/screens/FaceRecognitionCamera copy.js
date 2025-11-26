import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,

  TouchableOpacity,

} from 'react-native';

import ImageCropPicker from 'react-native-image-crop-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import FullScreenTextSelector from './TextRecognizationUi';
import Loading from '../components/Loading';

// ──────────────────────
// 2. MAIN COMPONENT
// ──────────────────────
function SelectableText({ children }) {
  if (Platform.OS === "ios") {
    return <TextInput multiline editable={false}>{children}</TextInput>
  } else {
    return <Text selectable>{children}</Text>
  }
}
export default function FaceRecognitionCamera() {
  const [textData, setTextData] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isLoading, setLoading] = useState(false);


  const openCamera = () => {
    ImageCropPicker.openCamera({
      mediaType: "photo",
      compressImageQuality: 0.8,
    })
      .then(async (img) => {
        const newImg = { ...img };
        if (!newImg.path.startsWith("file://")) {
          newImg.path = `file://${newImg.path}`;
        }
        setLoading(true)
        const result = await TextRecognition.recognize(newImg.path);
        console.log('resultresultresult-', result);
        if (result.text) {
          setTextData(result.text);
          setVisible(true);
          setLoading(false)
        }
      })
      .catch((e) => console.log("Camera cancelled or error:", e)).finally(() => {
        setLoading(false);
      });
  };


  return (
    <View style={styles.container}>
      <Loading visible={isLoading} />
      <TouchableOpacity
        style={{ height: 40,padding:6, backgroundColor: 'red' }}
        onPress={() => openCamera()}
      >
        <Text style={{ color: '#fff', fontSize: 20, borderRadius: 6 }}>{'Open camera'}</Text>
      </TouchableOpacity>
      <FullScreenTextSelector
        isVisible={visible}
        onClose={() => setVisible(false)}
        textData={textData}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: "center", alignItems: "center" },
});


















import React, { useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from "react-native";
import { WebView } from "react-native-webview";

export default function FullScreenTextSelector({ isVisible, onClose, textData }) {
  const webviewRef = useRef(null);
  const [selected, setSelected] = useState("");

  const htmlContent = `
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1, maximum-scale=1" />
        <style>
          body { font-size: 18px; padding: 12px; line-height: 1.45; }
        </style>
      </head>
      <body>
        <div>${textData}</div>
        <script>
          document.addEventListener("selectionchange", function () {
            var txt = window.getSelection().toString();
            window.ReactNativeWebView.postMessage(txt);
          });
        </script>
      </body>
    </html>
  `;

  const handleDone = () => {
    if (!selected.trim()) {
      Alert.alert("No text selected");
    } else {
      Alert.alert("Selected Text", selected);
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={false}>
      <StatusBar hidden={false} translucent backgroundColor="#000" />
      
      <View style={styles.modalContainer}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.headerBtn}>Close</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Select Text</Text>

          <TouchableOpacity onPress={handleDone}>
            <Text style={styles.headerBtn}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Full Screen WebView */}
        <WebView
          style={{ flex: 1 }}
          source={{ html: htmlContent }}
          originWhitelist={["*"]}
          onMessage={e => setSelected(e.nativeEvent.data)}
          showsVerticalScrollIndicator
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: "#fff" },

  header: {
    height: 55,
    backgroundColor: "#F7F7F7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },

  title: { fontSize: 17, fontWeight: "600" },
  headerBtn: { fontSize: 16, color: "#007AFF", fontWeight: "600" },
});
