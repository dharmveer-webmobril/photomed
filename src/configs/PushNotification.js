import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { navigate } from '../navigators/NavigationService';  // Import navigate from NavigationService
import ScreenName from './screenName';  // Import screen names

// Request notification permissions
const checkApplicationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        // console.log('Notification permission denied');
      } else {
        // console.log('Notification permission granted');
      }
    } catch (error) {
      // console.log('Permission request error:', error);
    }
  }
};

export async function requestUserPermission() {
  await checkApplicationPermission();

  // iOS permission request
  if (Platform.OS === 'ios') {
    await messaging().requestPermission();
  }

  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  if (enabled) {
    // console.log('Authorization status:', authStatus);
    await getFcmToken();
  } else {
    // console.log('Notification permission not granted');
  }
}

const getFcmToken = async () => {
  try {
    const checkToken = await AsyncStorage.getItem('fcmToken');
    console.log("The old fcm token:", checkToken);
    if (!checkToken) {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log("FCM token generated:", fcmToken);
        await AsyncStorage.setItem('fcmToken', fcmToken);
      }
    }
  } catch (error) {
    // console.log("Error in FCM token generation:", error);
  }
}

async function onDisplayNotification(data) {
  // Request permissions (required for iOS)
  if (Platform.OS === 'ios') {
    await notifee.requestPermission();
  }

  // Create a channel (required for Android)
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });

  // Display a notification
  await notifee.displayNotification({
    title: data?.notification?.title,
    body: data?.notification?.body,
    data: data.data,
    android: {
      channelId,
      pressAction: {
        launchActivity: "default",
        id: "default",
      },
    },
  });
}

export const notificationListener = async () => {
  // Handle foreground messages
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    // console.log('A new FCM message arrived!', remoteMessage);
    await onDisplayNotification(remoteMessage);
  });

  // Handle notification opens from background state
  messaging().onNotificationOpenedApp(remoteMessage => {
    // console.log('Notification caused app to open from background state:', remoteMessage.notification);
    navigate(ScreenName.NOTIFICATION, {});  // Navigate to the notification screen
  });

  // Handle initial notification when the app is launched from a quit state
  messaging().getInitialNotification().then(remoteMessage => {
    if (remoteMessage) {
      // console.log('Notification caused app to open from quit state:', remoteMessage.notification);
      navigate(ScreenName.NOTIFICATION, {});  // Navigate to the notification screen
    }
  });

  // Set background event handler for Notifee
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    // console.log('Message handled in the background!', remoteMessage);
    if (remoteMessage) {
      // console.log('Notification caused app to open from quit state:', remoteMessage.notification);
      navigate(ScreenName.NOTIFICATION, {});  // Navigate to the notification screen
    }
  });

  return unsubscribe;
}

// Set background event handler for Notifee
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification } = detail;
  switch (type) {
    case EventType.DISMISSED:
      // console.log('Notification dismissed:', notification);
      break;
    case EventType.PRESS:
      // console.log('Notification pressed:', notification);
      navigate(ScreenName.NOTIFICATION, {});  // Navigate to the notification screen
      break;
  }
});

notifee.onForegroundEvent(async ({ type, detail }) => {
  const { notification } = detail;
  switch (type) {
    case EventType.DISMISSED:
      // console.log('Notification dismissed2:', notification);
      break;
    case EventType.PRESS:
      // console.log('Notification pressed2:', notification);
      navigate(ScreenName.NOTIFICATION, {});  // Navigate to the notification screen
      break;
  }
});
