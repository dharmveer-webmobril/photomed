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
  TextInput,
  ScrollView,
} from "react-native";
import SelectableTextInput from "../components/SelectableTextInput";
import FONTS from "../styles/fonts";
import { SafeAreaView } from "react-native-safe-area-context";

const TextRecognizationUi = ({ isVisible, onClose, textData, onDone }) => {

  const handleSelection = (ev) => {
    if (ev?.eventType === "Copy") {
      const selectedText = ev?.content || "";
      if (onDone) {
        onDone(selectedText);
      }
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide">
      <StatusBar backgroundColor="#000" translucent={false} />
      <SafeAreaView style={styles.modalContainer}>

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
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Selectable Text */}
          <View style={styles.textContainer}>
            <SelectableTextInput
              text={textData || ""}
              menuItems={["Copy"]}
              onSelection={handleSelection}
              style={styles.selectableTextContainer}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
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
    marginTop: 10,
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

// import { useRoute, useNavigation } from "@react-navigation/native";
// import React from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   Modal,
//   StatusBar,
//   TouchableOpacity,
//   Image,
//   ScrollView,
// } from "react-native";
// import { SelectableTextView } from '@rob117/react-native-selectable-text';
// import FONTS from "../styles/fonts";
// import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// const TextRecognizationUi = ({ isVisible, onClose, textData, onDone }) => {
//   const handleSelection = (ev) => {
//     const { chosenOption, highlightedText } = ev;
//     if (chosenOption === "Copy") {
//       highlightedText && onDone(highlightedText);
//     }
//   };
//   const insets = useSafeAreaInsets()
//   return (
//     <Modal visible={isVisible} animationType="slide">
//       <StatusBar backgroundColor="#000" translucent={false} />
//       <View style={styles.modalContainer}>
//         <ScrollView contentContainerStyle={{ flexGrow: 1}}>
//           {/* Header */}
//           <View style={[styles.headerContainer, { paddingTop: insets.top + 20 }]}>
//             <TouchableOpacity onPress={onClose} style={styles.backBtn}>
//               <Image
//                 style={styles.backIcon}
//                 source={require("../assets/images/icons/backIcon.png")}
//               />
//             </TouchableOpacity>

//             <Text style={styles.headerTitle}>Patient Details</Text>

//             <View style={styles.headerRightSpace} />
//           </View>
//           {/* Selectable Text */}
//           <SelectableTextView
//             menuOptions={['Copy']}
//             onSelection={handleSelection}
//             style={{ margin: 20  }}
//           >
//             <Text style={styles.ocrText}>{textData || "Text not found, Please try again later"}</Text>
//           </SelectableTextView>
//         </ScrollView>
//       </View>
//     </Modal>
//   );
// };

// export default TextRecognizationUi;

// const styles = StyleSheet.create({
//   modalContainer: {
//     flex: 1,
//     backgroundColor: "#fff",
//     paddingHorizontal: 20,
//   },
//   ocrText: {
//     fontSize: 16,
//     lineHeight: 26,
//     color: "#212121",
//     fontFamily: FONTS.medium,
//   },

//   headerContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: 20,
//   },

//   backBtn: {
//     marginLeft: 10,
//   },

//   backIcon: {
//     height: 40,
//     width: 40,
//   },

//   headerTitle: {
//     fontSize: 15,
//     color: "#424242",
//     marginLeft: -30,
//   },

//   headerRightSpace: {
//     width: 40,
//   },

//   recognizedText: {
//     color: "#424242",
//     marginTop: 30,
//     textAlign: "justify",
//     fontSize: 16,
//     fontFamily: FONTS.medium,
//     lineHeight: 20,
//   },
// });
