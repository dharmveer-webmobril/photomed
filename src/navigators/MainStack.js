import React from "react";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import COLORS from "../styles/colors";
import BottomTabs from "../navigators/BottomTabs";
import ScreenName from "../configs/screenName";
import EditProfile from "../screens/Profile/EditProfile";
import ChangePassword from "../screens/Profile/ChangePassword";
import HelpCenter from "../screens/Profile/HelpCenter";
import Terms from "../screens/Profile/Terms";
import { goBack } from "./NavigationService";
import PatientDetails from "../screens/PatientDetails";
import FONTS from "../styles/fonts";
import CameraGrid from "../screens/CameraGrid";
import CrossIcon from "../assets/SvgIcons/CrossIcon";
import ImageViewer from "../screens/ImageViewer";
import ImageDetails from "../screens/ImageDetails";
import TagFilter from "../screens/TagFilter";
import CollageAdd from "../screens/CollageAdd";
import EditPatient from "../screens/EditPatient";
import SelectPhoto from "../screens/SelectPhoto";
import Framing from "../screens/Framing";
import CollageDermoscopy from "../screens/CollageDermoscopy";
import ImageZoomML from "../screens/ImageZoomML";
import { Image, TouchableOpacity } from "react-native";
import SubscriptionManage from "../screens/Auth/SubscriptionManage";
import MarkableImage from "../screens/MarkableImage";
import { IAPProvider } from "../configs/IAPContext";

const Stack = createNativeStackNavigator();

const MainStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerBackTitleVisible: false,
        headerShadowVisible: false,
        gestureEnabled: true,
        gestureDirection: "horizontal",
        headerTitleAlign: "center",
        headerTitleStyle: {
          color: COLORS.textColor,
          fontFamily: FONTS.medium,
          fontSize: 15,
        },
      }}
    >
      <Stack.Screen
        name={"Bottom"}
        component={BottomTabs}
        options={{
          headerShown: false,
          headerTitle: "",
          headerTintColor: COLORS.textColor,
          fontFamily: FONTS.regular,
        }}
      />
      <Stack.Screen
        name={ScreenName.EDIT_PROFILE}
        component={EditProfile}
        options={{
          headerShown: true,
          headerTintColor: COLORS.textColor,
        }}
      />
      <Stack.Screen
        name={ScreenName.CHANGE_PASSWORD}
        component={ChangePassword}
        options={{
          headerShown: true,
          headerTintColor: COLORS.textColor,
        }}
      />
      <Stack.Screen
        name={ScreenName.HELP_CENTER}
        component={HelpCenter}
        options={{
          headerShown: true,
          headerTintColor: COLORS.textColor,
        }}
      />
      <Stack.Screen
        name={ScreenName.TERMS}
        component={Terms}
        options={{
          headerShown: true,
          headerTintColor: COLORS.textColor,
        }}
      />
      <Stack.Screen
        name={"MarkableImage"}
        component={MarkableImage}
        options={{
          headerShown: true,
          headerTintColor: COLORS.textColor,
          headerTitle: "Mark Image",
        }}
      />
      <Stack.Screen
        name={"CollageDermoscopy"}
        component={CollageDermoscopy}
        options={{
          headerShown: true,
          headerTintColor: COLORS.textColor,
          headerTitle: "Comapre",
        }}
      />
      <Stack.Screen
        name={ScreenName.PATIENT_DETAILS}
        component={PatientDetails}
        options={{
          headerShown: false,
          headerTintColor: COLORS.textColor,
          headerLeft: () => {
            return (
              <TouchableOpacity
                onPress={() => goBack()}
                style={{ marginLeft: 10 }}
              >
                <Image
                  style={{ marginBottom: 10, height: 40, width: 40 }}
                  source={require("../assets/images/icons/backIcon.png")}
                  onPress={() => goBack()}
                />
              </TouchableOpacity>
            );
          },
        }}
      />
      <Stack.Screen
        name={ScreenName.CAMERA_GRID}
        component={CameraGrid}
        options={{
          headerShown: true,
          headerTintColor: COLORS.textColor,
          headerTitle: "",
          headerLeft: () => {
            return <CrossIcon onPress={() => goBack()} />;
          },
        }}
      />
      <Stack.Screen
        name={ScreenName.IMAGE_VIEWER}
        component={ImageViewer}
        options={{
          headerShown: true,
          headerTintColor: COLORS.textColor,
          headerTitle: "",
          headerLeft: () => {
            return <CrossIcon onPress={() => goBack()} />;
          },
        }}
      />

      <Stack.Screen
        name={"ImageZoomML"}
        component={ImageZoomML}
        options={{
          headerShown: true,
          headerTintColor: COLORS.textColor,
          headerTitle: "",
          headerLeft: () => {
            return <CrossIcon onPress={() => goBack()} />;
          },
        }}
      />

      <Stack.Screen
        name={ScreenName.IMAGE_DETAILS}
        component={ImageDetails}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenName.COLLAGE_ADD}
        component={CollageAdd}
        options={{
          headerShown: true,
          headerTintColor: COLORS.textColor,
          headerTitle: "",
          headerLeft: () => {
            return <CrossIcon onPress={() => goBack()} />;
          },
        }}
      />
      <Stack.Screen
        name={ScreenName.EDIT_PATIENT}
        component={EditPatient}
        options={{
          headerShown: true,
          headerTintColor: COLORS.textColor,
        }}
      />
      {/* <Stack.Screen
        name={ScreenName.SUB_MANAGE}
        component={SubscriptionManage}
        options={{
          headerShown: false,
          headerTintColor: COLORS.textColor
        }}
      /> */}
      <Stack.Screen
        name={ScreenName.SUB_MANAGE}
        options={{ headerShown: false }}
      >
        {() => (
          <IAPProvider>
            <SubscriptionManage page="profile"/>
          </IAPProvider>
        )}
      </Stack.Screen>
      <Stack.Screen
        name={ScreenName.SELECT_PHOTO}
        component={SelectPhoto}
        options={{
          headerShown: true,
          headerTintColor: COLORS.textColor,
        }}
      />
      <Stack.Screen
        name={ScreenName.FRAMING}
        component={Framing}
        options={{
          headerShown: true,
          headerTintColor: COLORS.textColor,
          headerTitle: "Reframe",
        }}
      />
      <Stack.Screen
        name={ScreenName.TAG_FILTER}
        component={TagFilter}
        options={{
          headerShown: false,
          headerTintColor: COLORS.textColor,
        }}
      />
    </Stack.Navigator>
  );
};

export default MainStack;
