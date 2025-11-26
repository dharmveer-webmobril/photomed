import { Alert, Image } from "react-native";
export async function getDriveImageMetadata(fileId, accessToken) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=imageMediaMetadata`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const json = await res.json();
    return {
      imgWidth: json?.imageMediaMetadata?.width,
      imgHeight: json?.imageMediaMetadata?.height
    };
  } catch (e) {
    console.log("Metadata error", e);
    return null;
  }
}

export const askForDermoScopy = (makrCircleFun, campareFun) => {
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
