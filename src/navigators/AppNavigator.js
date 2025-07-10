import { navigationRef } from "./NavigationService";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import AuthStack from "./AuthStack";
import MainStack from "./MainStack";
import { useDispatch, useSelector } from "react-redux";
import NetInfo from "@react-native-community/netinfo";
import { useEffect } from "react";
import { setNetworkStatus } from "../redux/slices/networkSlice";
import Welcome from "../screens/Auth/Welcome";
import NoInternet from "../components/Nointernet";
import ConnectCloud from "../screens/Auth/ConnectCloud";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Image, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import COLORS from "../styles/colors";
import { logout } from "../redux/slices/authSlice";
import imagePaths from "../assets/images";



const AppNavigator = () => {
  const dispatch = useDispatch();
  const isConnected = useSelector((state) => state.network.isConnected);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const token = useSelector((state) => state?.auth?.user);
 

  const linking = {
    prefixes: ["com.photomedPro.com://"],
    config: {
      initialRouteName: "Home",
      screens: {
        HomeSample: {
          path: "CurrentGames/:invite_points",
        },
      },
    },
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      dispatch(setNetworkStatus(state.isConnected));
    });

    return () => unsubscribe();
  }, [dispatch]);


  return <>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Modal
        visible={!isConnected}
        transparent
        animationType="slide"
        statusBarTranslucent
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.whiteColor }}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", width: 300, alignSelf: 'center', zIndex: 99999 }}>
            <Image
              tintColor={COLORS.primary}
              source={imagePaths.nointernet}
              style={{ height: 80, width: 80, marginVertical: 15 }}
            />
            <Text style={{ textAlign: 'center', fontSize: 14, color: COLORS.textColor }}>Looks like you don’t have an internet connection. Please reconnect and try again.</Text>
          </View>
        </SafeAreaView>
      </Modal>
      <NavigationContainer linking={linking} ref={navigationRef}>
        {token && accessToken ? (
          <MainStack />
        ) : token ? (
          <ConnectCloud />
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
    </GestureHandlerRootView>
  </>;
};

export default AppNavigator;


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: COLORS.whiteColor,
    width: '85%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    color: COLORS.Error,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.textColor,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  buttonText: {
    color: COLORS.whiteColor,
    fontSize: 16,
  },
  buttonborder: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#32327C',
    marginRight: 20
  },
  buttonTextborder: {
    color: '#32327C',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});