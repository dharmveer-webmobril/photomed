import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Platform } from "react-native";
import InAppUpdates from 'sp-react-native-in-app-updates';

export const storeData = async (key, value) => {
    try {
        var jsonValue = value
        if (typeof (value) !== 'string') {
            jsonValue = JSON.stringify(value);
        }
        await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
        return e
    }
};


export const getData = async (key) => {
    try {
        const res = await AsyncStorage.getItem(key);
        return res != null ? typeof (res) !== 'string' ? JSON.parse(res) : res : null;
    } catch (e) {
        return e
        // error reading value
    }
};

export const removeData = async (key) => {
    try {
        const res = await AsyncStorage.removeItem(key);
        return res != null ? typeof (res) !== 'string' ? JSON.parse(res) : res : null;
    } catch (e) {
        return e
        // error reading value
    }
};

export const checkForUpdates = () => {
  
  const inAppUpdates = new InAppUpdates({ isDebug: true });
  const updateType = Platform.OS === 'android' ? 0 : 1; // 0 for flexible, 1 for immediate updates (Android only)
  inAppUpdates.checkNeedsUpdate().then((result) => {
    console.log('ressullllllstt',result);
    
    if (result.shouldUpdate) {
      if (Platform.OS === 'android') {
        // For Android, use flexible or immediate updates
        inAppUpdates.startUpdate({ updateType }).then((status) => {
          if (status === 'DOWNLOAD_COMPLETE') {
            Alert.alert('Update downloaded', 'Please restart the app to apply the update.');
          }
        });
      } else {
        // For iOS, redirect to the App Store
        Alert.alert(
          'Update Available',
          'A new version of the app is available. Please update to the latest version.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Update', onPress: () => inAppUpdates.openAppStore() },
          ]
        );
      }
    }
  }).catch((error) => {
    console.error('Error checking for updates:', error);
  });
};
