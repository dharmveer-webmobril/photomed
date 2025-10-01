import { Alert, Image, Modal, SafeAreaView, StyleSheet, Text, View, Platform } from 'react-native';
import React, { useState } from 'react';
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
import { WebView } from 'react-native-webview';
import Toast from 'react-native-simple-toast';
import Loading from '../../components/Loading';
import { storeData } from '../../configs/helperFunction';
import { configUrl } from '../../configs/api';
import { useCurrentUserProfileQuery } from '../../redux/api/user';
import { useNavigation } from '@react-navigation/native';
import Orientation from 'react-native-orientation-locker';

const DROPBOX_REDIRECT_URI = 'https://your-glitch-project.glitch.me/redirect';

const ConnectCloud = () => {
  const navigation = useNavigation()
  React.useEffect(() => {
    navigation.addListener("focus", () => {
      Orientation.lockToPortrait();
    });
  }, [navigation]);
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth?.user);


  const [showWebView, setShowWebView] = useState(false);
  const [loading, setLoading] = useState(false);
  const { data: userDetail, isLoading, error, refetch } = useCurrentUserProfileQuery({ token });

  const TOKEN_LIFESPAN = 3600 * 1000; // 1 hour in milliseconds

  const checkAndHandleLogout = async () => {
    const userRefetchResult = await refetch();
    const errorData = userRefetchResult?.error?.data;

    if (errorData?.isDeleted || errorData?.status === 2) {
      // console.log('Logout triggered before authentication due to:', errorData);
      dispatch(logout());
      Toast.show('Your account is deactivated. Please contact the administrator.')
      return false; // Indicate that further processing should stop
    }
    return true; // Allow the flow to continue
  };


  const handleNavigationStateChange = async (navState) => {
    const { url } = navState;

    if (url.startsWith(DROPBOX_REDIRECT_URI)) {
      setShowWebView(false);
      setLoading(true);
      const code = url.match(/code=([^&]*)/)?.[1];
      if (code) {
        const tokens = await exchangeCodeForTokens(code);
        if (tokens) {
          const { access_token, refresh_token, expires_in } = tokens;
          console.log('expires_inexpires_in', expires_in);
          let expiresIn = Date.now() + parseInt(expires_in) * 1000 //convert in milisecond
          dispatch(setAccessToken(access_token));
          await storeData('refresh_token', refresh_token)
          await storeData('token_expiry', expiresIn)
          dispatch(setCloudType('dropbox'));
          Toast.show('Dropbox Account Connected Successfully');
          // console.log('Dropbox Access Token:', tokens);
        }
      }
      setLoading(false);
    }
  };

  const exchangeCodeForTokens = async (code) => {
    const tokenUrl = 'https://api.dropboxapi.com/oauth2/token';
    const params = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: configUrl.DROPBOX_CLIENT_ID,
      client_secret: configUrl.DROPBOX_CLIENT_SECRET,
      redirect_uri: DROPBOX_REDIRECT_URI,
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
        };
      } else {
        console.error('Token exchange error:', data);
        throw new Error(data.error_description || 'Failed to exchange code for tokens');
      }
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  };


  const startDropboxAuth = async () => {
    // Check user status before starting authentication
    const canProceed = await checkAndHandleLogout();
    if (!canProceed) return; // Stop if user needs to log out

    setShowWebView(true);
    setLoading(true);

  };
console.log('configUrl.GOOGLE_CLIENT_IDconfigUrl.GOOGLE_CLIENT_ID',configUrl.GOOGLE_CLIENT_ID);

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
      console.log('Tokens:', Tokens);
      return Tokens

    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to exchange authorization code');
    }
  }


  const connectDrive = async () => {
    // Check user status before starting authentication
    const canProceed = await checkAndHandleLogout();
    if (!canProceed) return; // Stop if user needs to log out
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      let userInfo = await GoogleSignin.signIn();
      const { accessToken } = await GoogleSignin.getTokens();
      // console.log('Google Drive Access Token:', accessToken);
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

  return (
    <WrapperContainer wrapperStyle={[commonStyles.innerContainer, styles.container]}>
      <Modal visible={showWebView} onRequestClose={() => setShowWebView(false)}>
        <SafeAreaView style={{ flex: 1, }}>
          <Loading visible={loading} />
          <Text onPress={() => setShowWebView(false)}
            style={[styles.title, { alignSelf: 'flex-end', marginBottom: 0, top: Platform.OS == 'ios' ? 40 : -10, zIndex: 2, position: 'absolute', right: 15, color: '#0061FE' }]}>Close</Text>
          <WebView
            originWhitelist={['*']}
            source={{
              uri: `https://www.dropbox.com/oauth2/authorize?response_type=code&client_id=${configUrl.DROPBOX_CLIENT_ID}&redirect_uri=${encodeURIComponent(DROPBOX_REDIRECT_URI)}&token_access_type=offline`,
            }}
            onLoadEnd={() => setLoading(false)}
            onNavigationStateChange={handleNavigationStateChange}
          />
        </SafeAreaView>
      </Modal>
      <View style={{ flex: 0.6, width: '100%', alignItems: 'center' }}>
        <Image source={imagePath.cloud} style={{ marginTop: verticalScale(40) }} />
        <Text style={styles.title}>Connect Cloud Storage</Text>
        <Text style={styles.subtitle}>Connect your Dropbox or Google Drive to{'\n'}
          store patient records securely
        </Text>
      </View>
      <View style={{ flex: 0.4, justifyContent: 'center' }}>
        <CustomBtn
          onPress={startDropboxAuth}
          title={'Connect Dropbox'}
          btnStyle={{ marginBottom: verticalScale(20) }}
        />
        <CustomBtn
          onPress={connectDrive}
          title={'Connect Google Drive'}
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
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});