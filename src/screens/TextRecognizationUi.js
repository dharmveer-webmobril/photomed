import { useRoute, useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  StatusBar,
  TouchableOpacity,
  Image,
} from "react-native";
import SelectableTextInput from "../components/SelectableTextInput";
import FONTS from "../styles/fonts";

const TextRecognizationUi = ({ isVisible, onClose, textData, onDone }) => {
  const [copiedText, setCopiedText] = useState("");

  const handleSelection = (ev) => {
    if (ev?.eventType === "Copy") {
      const selectedText = ev?.content || "";
      setCopiedText(selectedText);
      if (onDone) {
        onDone(selectedText);
      }
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide">
      <StatusBar backgroundColor="#000" translucent={false} />
      <View style={styles.modalContainer}>

        {/* Header */}
        <View style={styles.headerContainer}>
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
        <View style={styles.textContainer}>
          <SelectableTextInput
            text={textData || ""}
            menuItems={["Copy"]}
            onSelection={handleSelection}
            style={styles.selectableTextContainer}
          />
        </View>

        {/* Input Box for Copied Text */}
        

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

  textContainer: {
    flex: 1,
    marginTop: 10,
  },
  selectableTextContainer: {
    flex: 1,
    width: '100%',
  },
  recognizedText: {
    color: "#424242",
    textAlign: "justify",
    fontSize: 16,
    fontFamily: FONTS.medium,
    lineHeight: 20,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: "#f5f5f5",
  },
  inputLabel: {
    fontSize: 14,
    color: "#424242",
    marginBottom: 8,
    fontFamily: FONTS.medium,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    color: "#424242",
    fontSize: 14,
    fontFamily: FONTS.regular,
    minHeight: 80,
    textAlignVertical: "top",
  },
});
