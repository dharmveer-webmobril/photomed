import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import _routes from '../configs/routes';
import { NavigationContainer } from '@react-navigation/native';
import COLORS from '../styles/colors';
import { navigationRef } from './NavigationService';
import FONTS from '../styles/fonts';
import Welcome from '../screens/Auth/Welcome';
import ScreenName from '../configs/screenName';
import { useSelector } from 'react-redux';


const Stack = createNativeStackNavigator();

const AuthStack = () => {
  const welcomeScreen = useSelector((state) => state.auth.welcomeScreen);
  console.log('wellll',welcomeScreen);
  

  return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          headerBackTitleVisible: false,
          headerShadowVisible: false,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          headerTitleAlign:'center',
          headerTitleStyle:{
            fontFamily:FONTS.medium,
            fontSize:15
          }
        }}>
          {welcomeScreen && <Stack.Screen
            name={ScreenName.WELCOME_SCREEN}
            component={Welcome}
            options={{
              headerShown: false,
              headerTitle:'',
              headerTintColor:COLORS.textColor

            }}
          />}
        {_routes?.map(screen => (
          <Stack.Screen
            key={screen.name}
            name={screen.name}
            component={screen.Component}
            options={{
              headerShown: screen.headerShown ?? false,
              headerTitle:screen.headerTitle,
              headerTintColor:COLORS.textColor

            }}
          />
        ))}
      </Stack.Navigator>
  );
};

export default AuthStack;
