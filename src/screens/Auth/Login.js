import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useState } from "react";
import WrapperContainer from "../../components/WrapperContainer";
import { imagePath } from "../../configs/imagePath";
import commonStyles from "../../styles/commonStyles";
import AppTextInput from "../../components/AppTextInput";
import { verticalScale } from "../../styles/responsiveLayoute";
import COLORS from "../../styles/colors";
import FONTS from "../../styles/fonts";
import CustomBtn from "../../components/CustomBtn";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import ScreenName from "../../configs/screenName";
import { navigate } from "../../navigators/NavigationService";
import Loading from "../../components/Loading";
import { useDispatch, useSelector } from "react-redux";
import {
  saveUserData,
  setIsRemeberOn,
  setUserId,
  updateSubscription,
} from "../../redux/slices/authSlice";
import { useLoginMutation } from "../../redux/api/user";
import { validateEmail } from "../../components/Validation";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useSocialLoginMutation } from "../../redux/api/common";
import Toast from "react-native-simple-toast";
import DeviceInfo from "react-native-device-info";
import { getData } from "../../configs/helperFunction";
import { configUrl } from "../../configs/api";
import { jwtDecode } from "jwt-decode";
import Orientation from "react-native-orientation-locker";
import {
  appleAuth,
  AppleButton,
} from "@invertase/react-native-apple-authentication";

const Login = () => {
  const navigation = useNavigation();
  React.useEffect(() => {
    navigation.addListener("focus", () => {
      Orientation.lockToPortrait();
    });
  }, [navigation]);

  const [socialLogin, { isLoading: loading, isSuccess, error }] =
    useSocialLoginMutation();

  GoogleSignin.configure({
    webClientId: configUrl.GOOGLE_CLIENT_ID,
    offlineAccess: false,
    scopes: [
      "email",
      "profile",
      "https://www.googleapis.com/auth/drive.file"
    ],
  });
  const isConnected = useSelector((state) => state.network.isConnected);

  const dispatch = useDispatch();
  const [loginMutation, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isRemeberMe, setIsRemeberMe] = useState(false);
  const removeSubscription = () => {
    dispatch(updateSubscription(null));
  };
  useFocusEffect(
    useCallback(() => {
      removeSubscription();
      checkRemeberMe();
    }, [])
  );
  const isRemeberOn = useSelector((state) => state.auth.isRemeberOn);
  const email1 = useSelector((state) => state.auth.email);
  const password1 = useSelector((state) => state.auth.password);
  const checkRemeberMe = () => {
    if (isRemeberOn) {
      setIsRemeberMe(true);
      setEmail(email1);
      setPassword(password1);
    } else {
      setIsRemeberMe(false);
      // setEmail("test@mailinator.com");
      // setPassword("Qwerty@1");
      setEmail("");
      setPassword("");
    }
  };
  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  const validateFields = () => {
    if (email.trim() === "") {
      Toast.show("Please enter email address");
      return false;
    }
    if (!validateEmail(email.trim())) {
      Toast.show("Please enter a valid email address");
      return false;
    }
    if (password.trim() === "") {
      Toast.show("Please enter password");
      return false;
    }
    return true;
  };

  const getPlatformValue = () => {
    if (Platform.OS === "android") {
      return 1; // For Android
    } else {
      return 2; // For iOS
    }
  };

  const handleLogin = async () => {
    const fcmToken = (await getData("fcmToken")) || "default_fcm_token"; // Default value if not set
    const device_id = (await DeviceInfo.getUniqueId()) || "default_device_id"; // Default value if not set
    const device_type = getPlatformValue();
    // setIsRemeberOn
    if (!isConnected) {
      Toast.show("No internet connection. Please try again.");
      return;
    }
    if (!validateFields()) return;
    try {
      const loginApiResponse = await loginMutation({
        email,
        password,
        device_id,
        device_type,
        fcmToken,
      });
      console.log("loginApiResponse", loginApiResponse);
      if (loginApiResponse.data?.succeeded) {
        if (loginApiResponse.data.ResponseBody.is_verified == false) {
          navigate(ScreenName.OTP_VERIFICATION, {
            screenName: ScreenName.SIGN_UP,
            userToken: loginApiResponse.data.ResponseBody.token,
            email,
            email,
          });
        } else {
          if (isRemeberMe) {
            dispatch(
              setIsRemeberOn({
                isRemeberOn: true,
                email,
                password,
              })
            );
          } else {
            dispatch(
              setIsRemeberOn({
                isRemeberOn: false,
              })
            );
          }
          Toast.show(loginApiResponse.data.ResponseMessage);
          dispatch(saveUserData(loginApiResponse.data.ResponseBody.token));
          dispatch(setUserId(loginApiResponse.data.ResponseBody.id));
          dispatch(
            updateSubscription(loginApiResponse.data.ResponseBody.subscription)
          );
        }
      } else {
        Toast.show(
          loginApiResponse?.data?.ResponseMessage ||
          loginApiResponse.error?.data?.ResponseMessage ||
          "Something went wrong. Please try again."
        );
      }
    } catch (error) {
      console.error("Login API Error:", error);
    }
  };

  async function onAppleButtonPress() {
    try {
      const fcmToken = (await getData("fcmToken")) || "default_fcm_token"; // Default value if not set
      const device_type = getPlatformValue(); // Default value for Android
      const device_id = (await DeviceInfo.getUniqueId()) || "deault";

      // Start the sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      // Get user data
      const { user, email, fullName, identityToken, authorizationCode } =
        appleAuthRequestResponse;

      const decoded = jwtDecode(identityToken);
      console.log("---decodeddecoded--", decoded);

      if (!identityToken) {
        throw new Error("No idToken received from Apple Sign-In");
      }

      console.log(
        "appleAuthRequestResponseappleAuthRequestResponse",
        appleAuthRequestResponse
      );

      console.log("apple signup", {
        social_id: identityToken,
        full_name: "Apple user",
        login_type: "apple",
        email: decoded.email,
        device_id,
        device_type,
        fcmToken,
      });

      const result = await socialLogin({
        social_id: identityToken,
        full_name: "Apple user",
        login_type: "apple",
        email: decoded.email,
        device_id,
        device_type,
        fcmToken,
      });

      console.log("apple result", JSON.stringify(result, null, 2));

      if (result?.data?.succeeded) {
        Toast.show(result?.data?.ResponseMessage);
        dispatch(setUserId(result?.data?.ResponseBody?.userData?._id));
        dispatch(saveUserData(result?.data?.ResponseBody?.token));
        dispatch(updateSubscription(result?.data?.ResponseBody?.subscription));
      }
    } catch (error) {
      console.error("Apple Sign-In Error:", error);
    }
  }

  const onGoogleButtonPress = async () => {
    try {
      const fcmToken = (await getData("fcmToken")) || "default_fcm_token"; // Default value if not set
      const device_type = getPlatformValue();
      const device_id = (await DeviceInfo.getUniqueId()) || "default_device_id"; // Default value if not set
      await GoogleSignin.signOut();
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const data = await GoogleSignin.signIn();
      console.log("data", data);

      if (!data.data.idToken) {
        throw new Error("No idToken received from Google Sign-In");
      }

      if (data.data.user) {
        const result = await socialLogin({
          social_id: data.data.user.id,
          full_name: data.data.user.name,
          login_type: "google",
          email: data.data.user.email,
          device_id,
          device_type,
          fcmToken,
        });

        console.log('resultresultresult', result);

        if (result?.data?.succeeded) {
          dispatch(setUserId(result?.data?.ResponseBody?.userData?._id));
          dispatch(
            updateSubscription(result?.data?.ResponseBody?.subscription)
          );
          Toast.show(result?.data?.ResponseMessage);
          dispatch(saveUserData(result?.data?.ResponseBody?.token));
        }
      } else {
        // console.log('google sign in error');
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      //   Toast.show(error.message || "Google SignIn Error");
    }
  };

  return (
    <WrapperContainer
      wrapperStyle={[commonStyles.innerContainer, styles.container]}
    >
      <Loading visible={isLoading || loading} />
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContentContainer}
        extraScrollHeight={10}
      >
        <Image source={imagePath.logo} style={styles.logoStyle} />
        <AppTextInput
          value={email}
          onChangeText={(txt) => setEmail(txt)}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          keyboardType="email-address"
          placeholder="Email"
          leftIcon={imagePath.email}
        />

        <AppTextInput
          value={password}
          secureTextEntry={!isPasswordVisible}
          toggleSecureTextEntry={togglePasswordVisibility}
          onChangeText={(txt) => setPassword(txt)}
          placeholder="Password"
          leftIcon={imagePath.lock}
          rightIcon
        />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setIsRemeberMe(!isRemeberMe);
            }}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {
              <Image
                source={
                  !isRemeberMe
                    ? imagePath.checkbox_unchecked
                    : imagePath.checkbox_checked
                }
                style={{ height: 12, width: 12, marginRight: 8 }}
              />
            }
            <Text style={styles.frgtTxtStyle}>Remember me?</Text>
          </TouchableOpacity>
          <Text
            onPress={() => navigate(ScreenName.FORGOT_PASSWORD)}
            style={styles.frgtTxtStyle}
          >
            Forgot Password?
          </Text>
        </View>

        <CustomBtn
          onPress={handleLogin}
          title="Login"
          btnStyle={{ marginTop: verticalScale(120) }}
        />

        <View style={[commonStyles.flexView, { width: "100%", padding: 20 }]}>
          <View style={styles.devider} />
          <Text style={styles.orTxt}>Or</Text>
          <View style={styles.devider} />
        </View>

        <TouchableOpacity
          onPress={() => onGoogleButtonPress()}
          style={{
            width: 220,
            height: 45,
            flexDirection: "row",
            backgroundColor: COLORS.primary,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 10,
          }}
        >
          <Image
            style={{ height: 18, width: 18, marginRight: 6 }}
            source={require("../../assets/images/icons/google.png")}
          />
          <Text
            style={{
              color: "#fff",
              marginLeft: 6,
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            Continue with Google
          </Text>
        </TouchableOpacity>
        {Platform.OS == "ios" && (
          <AppleButton
            buttonStyle={AppleButton.Style.WHITE}
            buttonType={AppleButton.Type.CONTINUE}
            style={{
              width: 220, // You must specify a width
              height: 45, // You must specify a height
              borderRadius: 10,
              borderWidth: 1,
              borderColor: COLORS.primary,
              marginTop: 10,
            }}
            onPress={() => onAppleButtonPress()}
          />
        )}

        <Text style={styles.infoTxt}>
          Don’t have an account?{" "}
          <Text
            onPress={() => navigation.navigate(ScreenName.SIGN_UP)}
            style={{
              color: COLORS.primary,
              fontSize: 16,
              fontFamily: FONTS.semiBold,
            }}
          >
            Sign Up
          </Text>
        </Text>
      </KeyboardAwareScrollView>
    </WrapperContainer>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 30,
  },
  logoStyle: {
    height: 120,
    width: 120,
    marginBottom: verticalScale(120),
  },
  frgtTxtStyle: {
    color: COLORS.textColor,
    fontSize: 10,
    fontFamily: FONTS.regular,
    alignSelf: "flex-end",
    textDecorationLine: "underline",
    textAlign: "right",
  },
  devider: {
    height: 1,
    backgroundColor: COLORS.textColor,
    flex: 1,
  },
  orTxt: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textColor,
    marginHorizontal: 15,
  },
  infoTxt: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.textColor,
    marginTop: 30,
  },
  scrollViewContentContainer: {
    flexGrow: 1,
    width: "100%",
    alignItems: "center",
  },
});
