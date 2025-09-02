import { Linking, StatusBar, StyleSheet, Text, View } from 'react-native';
import React, { useEffect } from 'react';
import { Provider, useSelector } from 'react-redux';
import { store } from './src/redux/store';
import BootSplash from 'react-native-bootsplash';
import AppNavigator from './src/navigators/AppNavigator';
import {
  notificationListener,
  requestUserPermission,
} from "./src/configs/PushNotification";
import { checkForUpdates } from './src/configs/helperFunction';
import { decode as atob } from 'base-64';
import Orientation from 'react-native-orientation-locker';
import { IAPProvider } from './src/configs/IAPContext';

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
        checkForUpdates()
        // Simulate loading tasks
        await new Promise(resolve => setTimeout(resolve, 2500)); // Hold for 2 seconds
      } catch (error) {
        // console.log('Error during initialization:', error);
      }
    };

    init().finally(async () => {
      await BootSplash.hide({ fade: true });
      // console.log("BootSplash has been hidden successfully");
    });
  }, []);

  return (
    <Provider store={store}>
      {/* <IAPProvider> */}
        <StatusBar backgroundColor={'white'} barStyle={'dark-content'} />
        <AppNavigator />
      {/* </IAPProvider> */}
    </Provider>
  );

};

export default App;

const styles = StyleSheet.create({});
