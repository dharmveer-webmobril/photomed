import {
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import WrapperContainer from '../../components/WrapperContainer';
import commonStyles from '../../styles/commonStyles';
import { imagePath } from '../../configs/imagePath';
import FONTS from '../../styles/fonts';
import COLORS from '../../styles/colors';
import { verticalScale } from '../../styles/responsiveLayoute';
import CustomBtn from '../../components/CustomBtn';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setAccessToken, setCloudType } from '../../redux/slices/authSlice';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Toast from 'react-native-simple-toast';
import Loading from '../../components/Loading';
import { storeData } from '../../configs/helperFunction';
import { configUrl, getAppStatus } from '../../configs/api';
import { useCurrentUserProfileQuery } from '../../redux/api/user';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Orientation from 'react-native-orientation-locker';
import { authorize } from 'react-native-app-auth';
const TOKEN_LIFESPAN = 3600 * 1000;

const ConnectCloud = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth?.user);
  const [loading, setLoading] = useState(false);
  const [appStatus, setAppStatus] = useState(0);
  const { data: userDetail, refetch } = useCurrentUserProfileQuery({ token });

  useEffect(() => {
    navigation.addListener('focus', () => {
      Orientation.lockToPortrait();
    });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      loadAppStatus()
    }, [])
  );
  async function loadAppStatus() {
    try {
      setLoading(true)
      let result = await getAppStatus();
      console.log('app status', result?.ResponseBody?.status);
      if (result?.succeeded && result?.ResponseBody?.status) {
        setAppStatus(result?.ResponseBody?.status);
      } else {
        setAppStatus(0)
      }
    } catch (error) {
      setAppStatus(0)
    } finally {
      setLoading(false)
    }
  }

  const checkAndHandleLogout = async () => {
    const userRefetchResult = await refetch();
    const errorData = userRefetchResult?.error?.data;
    if (errorData?.isDeleted || errorData?.status === 2) {
      dispatch(logout());
      Toast.show('Your account is deactivated. Please contact the administrator.');
      return false;
    }
    return true;
  };

  const startDropboxAuth = async () => {

    try {
      const config = {
        clientId: configUrl.DROPBOX_CLIENT_ID,
        clientSecret: configUrl.DROPBOX_CLIENT_SECRET,
        redirectUrl: "com.photomedpro://dropboxredirect",
        scopes: ['files.content.write'],
        serviceConfiguration: {
          authorizationEndpoint: 'https://www.dropbox.com/oauth2/authorize',
          tokenEndpoint: 'https://api.dropboxapi.com/oauth2/token',
        },
        additionalParameters: { token_access_type: 'offline' },
      };
      console.log('Attempting auth with config:', JSON.stringify(config, null, 2));

      const result = await authorize(config);

      if (result?.accessToken) {
        const { accessToken, refreshToken, accessTokenExpirationDate } = result;

        // Convert expiration date to timestamp
        const expiresIn = new Date(accessTokenExpirationDate).getTime();

        // Dispatch to Redux

        dispatch(setAccessToken(accessToken));
        dispatch(setCloudType('dropbox'));

        // Store tokens locally
        await storeData('refresh_token', refreshToken);
        await storeData('token_expiry', expiresIn.toString());

        Toast.show('Dropbox Account Connected Successfully');
      }
      console.log('Auth result:', result);
    } catch (error) {
      console.error('Detailed auth error:', JSON.stringify(error, null, 2));
      Alert.alert('Error', `Code: ${error.code}\nMessage: ${error.message}`);
    }



  };

  const btnDropBox = () => {
    if (appStatus === 0 || appStatus === '0') {
      Alert.alert("Coming Soon", "Dropbox integration will be added in a future update.");
      return;
    }
    startDropboxAuth();
  }

  GoogleSignin.configure({
    webClientId: configUrl.GOOGLE_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    scopes: [
      "email",
      "profile",
      "https://www.googleapis.com/auth/drive.file"
    ],
  });


  const getWebGoogleToken = async (serverAuthCode) => {
    console.log('serverAuthCodeserverAuthCode', serverAuthCode);

    try {
      // Use the refresh token to get a new access token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: configUrl.GOOGLE_CLIENT_ID,
          client_secret: configUrl.GOOGLE_CLIENT_SECRET,
          code: serverAuthCode,
          redirect_uri: '', // Optional for mobile apps
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error exchanging auth code:', errorData);
        throw new Error('Failed to exchange authorization code');
      }

      const Tokens = await response.json();
      console.log('Tokens:', Tokens);
      return Tokens

    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to exchange authorization code');
    }
  }


  const connectDrive = async () => {

    const canProceed = await checkAndHandleLogout();
    if (!canProceed) return;
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      let userInfo = await GoogleSignin.signIn();
      const { accessToken } = await GoogleSignin.getTokens();
      let tokens = await getWebGoogleToken(userInfo.data.serverAuthCode);

      if (tokens) {
        const { access_token, refresh_token, expires_in } = tokens;

        let expiresIn = Date.now() + parseInt(expires_in) * 1000 //convert in milisecond

        dispatch(setAccessToken(access_token));

        await storeData('refresh_token', refresh_token)
        await storeData('token_expiry', expiresIn.toString())

        console.log('expires_inexpires_inexpires_in-', expiresIn);

        const tokenExpiryTime = Date.now() + TOKEN_LIFESPAN;
        await storeData('tokenExpiryTime', tokenExpiryTime.toString());

        Toast.show('Google Account Connected Successfully');
        dispatch(setCloudType('google'));
      }
    } catch (error) {
      console.error('Google Drive Connection Error:', error);
      Alert.alert('Error', 'Failed to connect to Google Drive');
    }
    setLoading(false);

    // Check user status again after authentication
    await checkAndHandleLogout();
  };
  console.log('appStatusappStatus', appStatus);

  return (
    <WrapperContainer wrapperStyle={[commonStyles.innerContainer, styles.container]}>
      <Loading visible={loading} />
      <View style={{ flex: 0.6, width: '100%', alignItems: 'center' }}>
        <Image source={imagePath.cloud} style={{ marginTop: verticalScale(40) }} />
        <Text style={styles.title}>Connect Cloud Storage</Text>
        <Text style={styles.subtitle}>
          {/* {`Connect your ${(appStatus === 1 || appStatus === '1') ? 'Dropbox or' : ''} Google Drive to ${'\n'}store patient records securely`} */}
          {`Connect your Dropbox or Google Drive to ${'\n'}store patient records securely`}
        </Text>
      </View>

      <View style={{ flex: 0.4, justifyContent: 'center' }}>
        <Text style={[styles.subtitle, { marginBottom: verticalScale(10) }]}>
          Note: To connect to the cloud, you need a Google Drive or Dropbox account. If you don’t have one, please create an account first.
        </Text>
        <CustomBtn
          onPress={connectDrive}
          title={'Connect Google Drive'}
          btnStyle={{ marginBottom: verticalScale(20), }}
        />

        <CustomBtn
          onPress={() => { btnDropBox() }}
          title={'Connect Dropbox'}
          btnStyle={{ marginBottom: verticalScale(20), opacity: (appStatus === 0 || appStatus === '0') ? 0.8 : 1 }}
        />
      </View>
    </WrapperContainer>
  );
};

export default ConnectCloud;

const styles = StyleSheet.create({
  container: {},
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: COLORS.primary,
    marginVertical: verticalScale(20),
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: verticalScale(10),
  },
});


