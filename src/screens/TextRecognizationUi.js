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
} from "react-native";
import { SelectableText } from "@colaquecez/react-native-selectable-text";
import FONTS from "../styles/fonts";

const TextRecognizationUi = ({ isVisible, onClose, textData, onDone }) => {
  const handleSelection = (ev) => {
    if (ev?.eventType === "Copy") {
      ev?.content && onDone(ev?.content);
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
        <SelectableText
          menuItems={["Copy"]}
          textComponentProps={{
            children: (
              <Text style={styles.recognizedText}>
                {textData || ""}
              </Text>
            ),
          }}
          onSelection={handleSelection}
        />

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

  recognizedText: {
    color: "#424242",
    marginTop: 30,
    textAlign: "justify",
    fontSize: 16,
    fontFamily: FONTS.medium,
    lineHeight: 20,
  },
});
