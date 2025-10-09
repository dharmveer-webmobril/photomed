import {
  Alert,
  Image,
  Linking,
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
import { configUrl } from '../../configs/api';
import { useCurrentUserProfileQuery } from '../../redux/api/user';
import { useNavigation } from '@react-navigation/native';
import Orientation from 'react-native-orientation-locker';
import InAppBrowser from 'react-native-inappbrowser-reborn';

const DROPBOX_REDIRECT_URI = 'https://mycomponent-22b21.web.app/redirect.html';
const GOOGLE_REDIRECT_URI = 'com.photomedpro:/oauth2redirect';
const TOKEN_LIFESPAN = 3600 * 1000; // 1 hour
import { sha256 } from 'js-sha256';
import { encode } from 'base-64';

const generatePKCE = () => {
  const codeVerifier = encode(
    String.fromCharCode.apply(
      null,
      Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))
    )
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const codeChallenge = encode(
    String.fromCharCode.apply(
      null,
      Array.from(sha256.digest(codeVerifier))
    )
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return { codeVerifier, codeChallenge };
};

const ConnectCloudIos = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth?.user);
  const [loading, setLoading] = useState(false);
  const { data: userDetail, refetch } = useCurrentUserProfileQuery({ token });

  useEffect(() => {
    navigation.addListener('focus', () => {
      Orientation.lockToPortrait();
    });
  }, [navigation]);

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

  const exchangeDropboxCodeForTokens = async (code, codeVerifier) => {
    const tokenUrl = 'https://api.dropbox.com/oauth2/token';
    const params = new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: configUrl.DROPBOX_CLIENT_ID,
      code_verifier: codeVerifier,
      redirect_uri: DROPBOX_REDIRECT_URI,
    });


    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });


      const data = await response.json();
      if (response.ok) return data;
      throw new Error(data.error_description || 'Failed to exchange code');
    } catch (error) {
      console.error('Dropbox Token Exchange Error:', error);
      throw error;
    }
  };

  const startDropboxAuth = async () => {
    const canProceed = await checkAndHandleLogout();
    if (!canProceed) return;
    setLoading(true);
    const { codeVerifier, codeChallenge } = generatePKCE();
    const authUrl = `https://www.dropbox.com/oauth2/authorize?response_type=code&client_id=${configUrl.DROPBOX_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      DROPBOX_REDIRECT_URI
    )}&token_access_type=offline&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    console.log('Dropbox Auth URL:', authUrl);
    const browserOptions = {
      showTitle: true,
      enableUrlBarHiding: true,
      enableDefaultShare: false,
      ephemeralWebSession: false,
      forceCloseOnRedirection: false,
    };
    try {
      if (await InAppBrowser.isAvailable()) {
        const result = await InAppBrowser.openAuth(authUrl, DROPBOX_REDIRECT_URI, browserOptions);
        console.log('resultresult--', result);

        if (result.url?.startsWith('com.photomedpro://dropboxredirect')) {
          const code = result.url.match(/code=([^&]*)/)?.[1];
          if (code) {
            const tokens = await exchangeDropboxCodeForTokens(code, codeVerifier);
            if (tokens?.access_token) {
              const { access_token, refresh_token, expires_in } = tokens;
              const expiresIn = Date.now() + parseInt(expires_in) * 1000;
              dispatch(setAccessToken(access_token));
              await storeData('refresh_token', refresh_token);
              await storeData('token_expiry', expiresIn.toString());
              dispatch(setCloudType('dropbox'));
              Toast.show('Dropbox Account Connected Successfully');
            }
          } else {
            Alert.alert('Error', 'Authorization code not found.');
          }
        } else if (result.type === 'cancel') {
          Alert.alert('Cancelled', 'Dropbox authentication was cancelled.');
        } else {
          Alert.alert('Error', 'Unexpected response during Dropbox login.');
        }
      } else {
        Linking.openURL(authUrl);
      }
    } catch (error) {
      console.error('Dropbox Auth Error:', error);
      Alert.alert('Error', 'Failed to connect to Dropbox.');
    } finally {
      setLoading(false);
    }
  };

  GoogleSignin.configure({
    webClientId: configUrl.GOOGLE_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
    scopes: [
      "email",
      "profile",
      "https://www.googleapis.com/auth/drive.file"
      // "email",
      // "profile",
      // 'https://www.googleapis.com/auth/drive',
      // 'https://www.googleapis.com/auth/drive.file',
      // 'https://www.googleapis.com/auth/drive.appdata',
      // 'https://www.googleapis.com/auth/drive.metadata',
      // 'https://www.googleapis.com/auth/drive.readonly',
      // 'https://www.googleapis.com/auth/drive.metadata.readonly',
      // 'https://www.googleapis.com/auth/drive.apps.readonly',
      // 'https://www.googleapis.com/auth/drive.photos.readonly',
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
      <Loading visible={loading} />
      <View style={{ flex: 0.6, width: '100%', alignItems: 'center' }}>
        <Image source={imagePath.cloud} style={{ marginTop: verticalScale(40) }} />
        <Text style={styles.title}>Connect Cloud Storage</Text>
        <Text style={styles.subtitle}>
          Connect your Dropbox or Google Drive to{'\n'}store patient records securely
        </Text>
      </View>

      <View style={{ flex: 0.4, justifyContent: 'center' }}>
        <CustomBtn
          onPress={startDropboxAuth}
          title={'Connect Dropbox'}
          btnStyle={{ marginBottom: verticalScale(20) }}
        />
        <CustomBtn onPress={connectDrive} title={'Connect Google Drive'} />
      </View>
    </WrapperContainer>
  );
};

export default ConnectCloudIos;

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

