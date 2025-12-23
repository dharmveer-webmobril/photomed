
import { View, Text, StatusBar, SafeAreaView } from 'react-native'
import React, { useEffect } from 'react'
import BootSplash from "react-native-bootsplash";
import { notificationListener, requestUserPermission, } from "./src/configs/PushNotification";
import { decode as atob } from "base-64";
import Orientation from "react-native-orientation-locker";
import { MenuProvider } from "react-native-popup-menu";
import { Provider, useSelector } from "react-redux";
import AppNavigator from "./src/navigators/AppNavigator";
import UpdateChecker from "./src/screens/UpdateCheck";
import { store } from "./src/redux/store";

// if (!global.atob) {
//   global.atob = atob;
// }

export default function App() {

  // const App = () => {
  // useEffect(() => {
  //   Orientation.lockToPortrait();
  // }, []);

  useEffect(() => {
    const init = async () => {
      try {

        await requestUserPermission();
        await notificationListener();
        await new Promise((resolve: any) => setTimeout(resolve, 2500));
      } catch (error) {
        // console.log('Error during initialization:', error);
      }
    };
    BootSplash.hide({ fade: true });
    init().finally(async () => {
      setTimeout(async () => {
        await BootSplash.hide({ fade: true });
      }, 2500);
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
  )
}

// import { View, Text } from 'react-native'
// import React from 'react'

// export default function App() {
//   return (
//     <View>
//       <Text>App</Text>
//     </View>
//   )
// }

// import { View, Text } from 'react-native'
// import React from 'react'

// export default function App() {
//   return (
//     <View>
//       <Text>App</Text>
//     </View>
//   )
// }