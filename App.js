import { Linking, StatusBar, StyleSheet, Text, View } from "react-native";
import React, { useEffect } from "react";
import { Provider, useSelector } from "react-redux";
import { store } from "./src/redux/store";
import BootSplash from "react-native-bootsplash";
import AppNavigator from "./src/navigators/AppNavigator";
import {
  notificationListener,
  requestUserPermission,
} from "./src/configs/PushNotification";
import { checkForUpdates } from "./src/configs/helperFunction";
import { decode as atob } from "base-64";
import Orientation from "react-native-orientation-locker";
import { IAPProvider } from "./src/configs/IAPContext";
import { SafeAreaView } from 'react-native-safe-area-context';
import UpdateChecker from "./src/screens/UpdateCheck";
import { MenuProvider } from "react-native-popup-menu";
import FaceRecognitionCamera from "./src/screens/FaceRecognitionCamera";
if (!global.atob) {
  global.atob = atob;
}

const App = () => {
  useEffect(() => {
    Orientation.lockToPortrait();
  }, []);

  // const navigation = useNavigation()
  // React.useEffect(() => {
  //   const unsubscribe = navigation.addListener('focus', () => {
  //     Orientation.unlockAllOrientations()
  //     Orientation.lockToPortrait();
  //   });
  //   return unsubscribe
  // }, []);

  useEffect(() => {
    const init = async () => {
      try {

        await requestUserPermission();
        await notificationListener();
        // checkForUpdates();
        // Simulate loading tasks
        await new Promise((resolve) => setTimeout(resolve, 2500)); // Hold for 2 seconds
      } catch (error) {
        // console.log('Error during initialization:', error);
      }
    };
  BootSplash.hide({ fade: true });
    init().finally(async () => {
      setTimeout(async () => {
        await BootSplash.hide({ fade: true });
      }, 2500);
      // console.log("BootSplash has been hidden successfully");
    });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <MenuProvider>
        <Provider store={store}>
          <StatusBar backgroundColor={"white"} barStyle={"dark-content"} />
          <AppNavigator />
        </Provider>
        <UpdateChecker />
      </MenuProvider>
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({});
