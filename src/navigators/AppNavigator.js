import { navigationRef } from "./NavigationService";
import { NavigationContainer } from "@react-navigation/native";
import AuthStack from "./AuthStack";
import MainStack from "./MainStack";
import { useDispatch, useSelector } from "react-redux";
import NetInfo from "@react-native-community/netinfo";
import { useEffect } from "react";
import { setNetworkStatus } from "../redux/slices/networkSlice";

import ConnectCloud from "../screens/Auth/ConnectCloud";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import COLORS from "../styles/colors";
import imagePaths from "../assets/images";
import SubscriptionManage from "../screens/Auth/SubscriptionManage";
import { IAPProvider } from "../configs/IAPContext";
import BootSplash from "react-native-bootsplash";
import { updateSubscription } from "../redux/slices/authSlice";

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

  const subscription = useSelector((state) => state?.auth?.subscription);
  const needsSubscription =
    token &&
    accessToken &&
    (!subscription?.hasSubscription || !subscription?.isActive);

    console.log('subscription--', subscription, needsSubscription);
    

  const getProfile = async () => {
    try {
      const res = await fetch("http://photomedpro.com/api/getprofile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      console.log("profile data", data.ResponseBody);
      console.log(" subscription profile data", data.ResponseBody);
       dispatch(updateSubscription(data.subscription));
    } catch (error) {
    } finally {
      setTimeout(async () => {
        await BootSplash.hide({ fade: true });
      }, 200);
    }
  };

  useEffect(() => {
    if (token) {
      getProfile();
    }
  }, [token, accessToken]);

  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Modal
          visible={!isConnected}
          transparent
          animationType="slide"
          statusBarTranslucent
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.whiteColor }}>
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                width: 300,
                alignSelf: "center",
                zIndex: 99999,
              }}
            >
              <Image
                tintColor={COLORS.primary}
                source={imagePaths.nointernet}
                style={{ height: 80, width: 80, marginVertical: 15 }}
              />
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 14,
                  color: COLORS.textColor,
                }}
              >
                Looks like you don’t have an internet connection. Please
                reconnect and try again.
              </Text>
            </View>
          </SafeAreaView>
        </Modal>
        <NavigationContainer linking={linking} ref={navigationRef}>
          {!token ? (
            // Step 1: Not logged in
            <AuthStack />
          ) : !accessToken ? (
            // Step 2: Logged in but not connected to cloud
            <ConnectCloud />
          ) : needsSubscription ? (
            // Step 3: Connected, but no subscription
            <IAPProvider>
              <SubscriptionManage />
            </IAPProvider>
          ) : (
            // Step 4: All good → main app
            <MainStack />
          )}

          
          {/* {token && accessToken ? (
            <MainStack />
          ) : token ? (
            <ConnectCloud />
          ) : (
            <AuthStack />
          )} */}
        </NavigationContainer>
      </GestureHandlerRootView>
    </>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: COLORS.whiteColor,
    width: "85%",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    color: COLORS.Error,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: COLORS.textColor,
    textAlign: "center",
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
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#32327C",
    marginRight: 20,
  },
  buttonTextborder: {
    color: "#32327C",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
});
