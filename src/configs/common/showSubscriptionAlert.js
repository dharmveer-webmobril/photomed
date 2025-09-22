import { Alert } from "react-native";

export const showSubscriptionAlert = (navigation) => {
  Alert.alert(
    "Subscription Required",
    "You need to subscribe first before using this feature.",
    [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => console.log("User cancelled subscription alert"),
      },
      {
        text: "Subscribe",
        onPress: () => {
          // 👉 Navigate to your subscription screen here
          // Example if using navigation:
          // navigation.navigate("Subscription");
          navigation("SubscriptionManage");
          console.log("User wants to subscribe");
        },
      },
    ],
    { cancelable: true }
  );
};