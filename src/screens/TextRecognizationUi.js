
import { useRoute, useNavigation } from "@react-navigation/native";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  StatusBar,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { SelectableTextView } from '@rob117/react-native-selectable-text';
import FONTS from "../styles/fonts";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const TextRecognizationUi = ({ isVisible, onClose, textData, onDone }) => {
  const handleSelection = (ev) => {
    const { chosenOption, highlightedText } = ev;
    if (chosenOption === "Copy") {
      highlightedText && onDone(highlightedText);
    }
  };
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={isVisible} animationType="slide">
      <StatusBar backgroundColor="#000" translucent={false} />
      <View style={styles.modalContainer}>
        <ScrollView contentContainerStyle={{ flexGrow: 1}}>
          {/* Header */}
          <View style={[styles.headerContainer, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Image
                style={styles.backIcon}
                source={require("../assets/images/icons/backIcon.png")}
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Patient Details</Text>

            <View style={styles.headerRightSpace} />
          </View>
          {/* Selectable Text */}
          <SelectableTextView
            menuOptions={['Copy']}
            onSelection={handleSelection}
            style={{ margin: 20  }}
          >
            <Text style={styles.ocrText}>{textData || "Text not found, Please try again later"}</Text>
          </SelectableTextView>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default TextRecognizationUi;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  ocrText: {
    fontSize: 16,
    lineHeight: 26,
    color: "#212121",
    fontFamily: FONTS.medium,
  },

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  backBtn: {
    marginLeft: 10,
  },

  backIcon: {
    height: 40,
    width: 40,
  },

  headerTitle: {
    fontSize: 15,
    color: "#424242",
    marginLeft: -30,
  },

  headerRightSpace: {
    width: 40,
  },

  recognizedText: {
    color: "#424242",
    marginTop: 30,
    textAlign: "justify",
    fontSize: 16,
    fontFamily: FONTS.medium,
    lineHeight: 20,
  },
});
