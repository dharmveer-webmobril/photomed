import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Image, ImageBackground, Keyboard, Platform, StyleSheet, ToastAndroid, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Home from '../screens/Tabs/Home';
import AddPatient from '../screens/Tabs/AddPatient';
import Notification from '../screens/Tabs/Notification';
import Profile from '../screens/Tabs/Profile';
import FONTS from '../styles/fonts';
import COLORS from '../styles/colors';
import ScreenName from '../configs/screenName';
import { imagePath } from '../configs/imagePath';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';

const BottomTab = createBottomTabNavigator();

const TabRoutes = (props) => {
    const navigation = useNavigation();
    const backPressedOnceRef = useRef(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            setIsKeyboardVisible(true);
        });
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setIsKeyboardVisible(false);
        });

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);


    const BOTTOM_ROUTE = [
        {
            name: ScreenName.HOME,
            Component: Home,
            icon: imagePath.home,
            headerShown: false
        },
        {
            name: ScreenName.ADD_PATIENT,
            Component: AddPatient,
            icon: imagePath.addPatient,
            headerShown: true
        },
        {
            name: ScreenName.NOTIFICATION,
            Component: Notification,
            icon: imagePath.notification,
            headerShown: true
        },
        {
            name: ScreenName.PROFILE,
            Component: Profile,
            icon: imagePath.userTab,
            headerShown: false
        },
    ];

    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                if (!backPressedOnceRef.current) {
                    ToastAndroid.show("Double click to exit app", ToastAndroid.SHORT);
                    backPressedOnceRef.current = true;
                    setTimeout(() => {
                        backPressedOnceRef.current = false;
                    }, 2000); // Reset after 2 seconds
                    return true;
                } else {
                    return false; // Exit the app
                }
            };

            const backHandler = BackHandler.addEventListener(
                "hardwareBackPress",
                onBackPress
            );
            return () => backHandler.remove();
        }, [navigation])
    );

    const tabBarStyle = {
        backgroundColor: 'transparent', // Ensure transparency
        position: 'absolute',
        height: 92, // Ensure tab bar height matches background
        bottom: 0,
        elevation: 0, // Remove shadow
        borderTopWidth: 0, // Remove any top border
        paddingHorizontal: 10, // Ensure no padding
    };

    return (

        <BottomTab.Navigator
            tabBar={(tabsProps) => (
                <>
                    {!isKeyboardVisible && <ImageBackground
                        source={imagePath.bottomBg}
                        style={styles.tabBarBackgroundImage}
                        resizeMode="stretch"
                    >
                        <BottomTabBar {...tabsProps} />
                    </ImageBackground>}
                </>
            )}
            initialRouteName={ScreenName.HOME}
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
                style: styles.customBottomtabsStyle,
                tabBarActiveTintColor: '#E10F72',
                tabBarInactiveTintColor: 'gray',
                headerTitleAlign: 'center',
                headerStyle: { backgroundColor: COLORS.whiteColor },
                headerTitleStyle: { color: COLORS.textColor, fontFamily: FONTS.medium, fontSize: 15 },
                tabBarStyle: tabBarStyle,
                tabBarShowLabel: false,
                headerShadowVisible: false,
            }}
        >
            {BOTTOM_ROUTE.map(route => (
                <BottomTab.Screen
                    key={route.name}
                    name={route.name}
                    component={route.Component}
                    options={{
                        headerShown: route.headerShown,
                        tabBarIcon: ({ focused }) => (
                            <Image
                                style={[styles.imageStyle, { tintColor: focused ? '#E10F72' : COLORS.whiteColor }]}
                                source={route.icon}
                            />
                        ),
                    }}
                />
            ))}
        </BottomTab.Navigator>
    );
};

const styles = StyleSheet.create({
    customBottomtabsStyle: {},
    imageStyle: {
        marginTop: Platform.OS === 'ios' ? 20 : 0,
        justifyContent: 'center',
        alignItems: 'center',
        resizeMode: 'contain',
        width: 24, // Adjust width of the icon
        height: 24, // Adjust height of the icon
    },
    tabBarBackgroundImage: {
        height: 92, // Set the height to match your tab bar
        width: '100%',
        position: 'absolute',
        bottom: -1, // Adjust position to remove any gap
        justifyContent: 'center',
    },
});

export default TabRoutes;
