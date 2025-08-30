import { Alert } from "react-native";

export const askForDermoScopy = (makrCircleFun,campareFun) => {
  Alert.alert(
    "Choose an Action",
    "Would you like to mark a circle on this image, or compare it with the previous image?",
    [
      {
        text: "Mark Circle",
        onPress: () => {
            makrCircleFun()
          console.log("User chose to mark circle");
          // 👉 navigate to marking screen or enable drawing mode
        },
      },
      {
        text: "Compare with Previous",
        onPress: () => {
            campareFun()
          console.log("User chose to compare with previous image");
          // 👉 navigate to comparison screen or overlay previous image
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ],
    { cancelable: true }
  );
};
