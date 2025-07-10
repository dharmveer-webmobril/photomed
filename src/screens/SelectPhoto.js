import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import WrapperContainer from '../components/WrapperContainer';
import commonStyles from '../styles/commonStyles';
import { height, moderateScale, verticalScale, width } from '../styles/responsiveLayoute';
import FONTS from '../styles/fonts';
import COLORS from '../styles/colors';
import { navigate } from '../navigators/NavigationService';
import ScreenName from '../configs/screenName';
import {  useGetAllImageUrlsQuery } from '../redux/api/common';
import { useDispatch, useSelector } from 'react-redux';
import Loading from '../components/Loading';
import { getFolderId, listFolderImages, setFilePublic, ensureValidAccessToken, configUrl } from '../configs/api';
import ImageWithLoader from '../components/ImageWithLoader';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { setAccessToken } from '../redux/slices/authSlice';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getData, storeData } from '../configs/helperFunction';


const SelectPhoto = (props) => {
    const route = useRoute()
  const dispatch = useDispatch()
  const TOKEN_LIFESPAN = 3600 * 1000; // 1 hour in milliseconds
  const [images, setImages] = useState([]);
  const [id, setId] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  const accessToken = useSelector((state) => state.auth.accessToken);
  const provider = useSelector((state) => state.auth.cloudType);
  const patientId = useSelector((state) => state?.auth?.patientId?.patientId);
    const patientName = useSelector((state) => state?.auth?.patientName?.patientName);

  const { data: imageUrls = [], error, isLoading } = useGetAllImageUrlsQuery({
    userId: `${patientName}${patientId}` || '', // Default to empty string if undefined
    accessToken: accessToken || '',
  });

  // console.log('image urllls',imageUrls);


  console.log('is loading and loading ',loading, isLoading);
  


  

  GoogleSignin.configure({
    webClientId: configUrl.GOOGLE_CLIENT_ID,
    offlineAccess: false,
    scopes: [
      "email",
      "profile",
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.appdata',
      'https://www.googleapis.com/auth/drive.metadata',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'https://www.googleapis.com/auth/drive.apps.readonly',
      'https://www.googleapis.com/auth/drive.photos.readonly',
    ],
  });

  const checkAndRefreshToken = async () => {
    try {
      const tokenExpiryTime = await getData('tokenExpiryTime');
      const currentTime = Date.now();
      // console.log(' tokenExpiryTime and curr', tokenExpiryTime, currentTime);
      // If token expiry time is not set or token has expired
      if (!tokenExpiryTime || currentTime > parseInt(tokenExpiryTime) - 60 * 1000) {
        // console.log('Access token expired or about to expire. Refreshing...');

        // Refresh the token by signing in again
        await GoogleSignin.hasPlayServices();
        await GoogleSignin.signIn();
        const { accessToken } = await GoogleSignin.getTokens();

        const newTokenExpiryTime = Date.now() + TOKEN_LIFESPAN; // Recalculate expiry time

        // Update AsyncStorage with new token and expiry time
        dispatch(setAccessToken(accessToken));
        await storeData('tokenExpiryTime', newTokenExpiryTime.toString());
        return accessToken; // Return the new access token
      }

      // If token is still valid, return the stored token
      const storedToken = accessToken
      // console.log('token is still valid and stored token', storedToken);

      return storedToken;
    } catch (error) {
      console.error('Error checking or refreshing token:', error);
      throw error;
    }
  };

  const ensureValidToken = async () => {
    try {
      const validToken = await checkAndRefreshToken();
      // console.log('Valid Access Token:', validToken);
      // Use the valid token as needed
      dispatch(setAccessToken(validToken));
    } catch (error) {
      console.error('Error ensuring valid token:', error);
    }
  };


  const handleImagePress = (item) => {
    const imageDetails = provider === 'google' ? {
      id: item.id,
      mimeType: item.mimeType,
      name: item.name,
      webContentLink: item.webContentLink,
      // other relevant fields
    } : {
      id: item.id,  // Assuming item has a 'path_display' field in the other provider
      mimeType: item.mimeType,
      name: item.name,
      publicUrl: item.publicUrl,
      // other relevant fields for the second provider
    };
  
    navigate(ScreenName.COLLAGE_ADD, { selectedImage: imageDetails });
  };
  

  const fetchGoogleDriveImages = async () => {
    await ensureValidToken()
    try {
      setLoading(true)
      // Step 1: Locate the "PhotoMed" folder
      const photoMedFolderId = await getFolderId('PhotoMed', accessToken);
      // console.log('abscd folder', photoMedFolderId);

      if (!photoMedFolderId) {
        console.error('PhotoMed folder not found');
        setLoading(false)
        return;
      }

      // Step 2: Locate the patient folder inside "PhotoMed"
      const patientFolderId = await getFolderId(patientName + patientId, accessToken, photoMedFolderId);
      if (!patientFolderId) {
        setLoading(false)
        console.error('Patient folder not found');
        return;
      }

      // Step 3: Locate the "All Images" folder inside the patient folder
      const allImagesFolderId = await getFolderId('All Images', accessToken, patientFolderId);
      if (!allImagesFolderId) {
        setLoading(false)
        console.error('All Images folder not found');
        return;
      }

      // Step 4: Fetch images from the "All Images" folder
      const uploadedImages = await listFolderImages(allImagesFolderId, accessToken);
      const publicImages = await Promise.all(
        uploadedImages.map(async (image) => {
          const publicUrl = await setFilePublic(image.id, accessToken);
          // console.log('Public URL for image:', publicUrl);
          return { ...image, publicUrl };
        })
      );
      setLoading(false)
      setImages(publicImages);
    } catch (error) {
      setLoading(false)
      console.error('Error fetching Google Drive images:', error);
    }
  };


  const loadImages = async () => {
    // setLoading(true);
    try {
      if (provider === 'google') {
        await fetchGoogleDriveImages();
      } else {
        await ensureValidAccessToken(accessToken)
        // await fetchDropboxImages();
      }
    } catch (error) {
      // Handle error (e.g., alert user)
    } finally {
    //   setLoading(false);
    }
  };


  const setPatientId = async () => {
    try {
      const preId = await getData('patientId');
      if (!preId) {
        console.error("Patient ID not found in storage.");
        return;
      }
      const trimmedId = preId.slice(0, 5);
      setId(trimmedId);
  
      const patientName = await getData('patientName');
      if (!patientName) {
        console.error("Patient Name not found in storage.");
        return;
      }
      setFullName(patientName);
    } catch (error) {
      console.error("Error setting patient ID or name:", error);
    }
  };
  


  useEffect(() => {
    const initialize = async () => {
        await loadImages();
    };
  
    initialize();
  }, [accessToken, provider,]);






  return (
    <WrapperContainer wrapperStyle={[commonStyles.innerContainer,]}>
      <Loading visible={loading || isLoading} />
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <FlatList
            numColumns={3}
            data={provider == 'google' ? images : imageUrls}
            renderItem={({ item }) => {
              return (
                <TouchableOpacity
                  onPress={() => handleImagePress(item)} // Adjusted to pass the item
                  style={{ borderRadius: 22, overflow: 'hidden', margin: 5, alignItems: 'center', }}
                >
                  <ImageWithLoader
                    uri={provider === 'google' ? item.webContentLink : item.publicUrl} style={{ height: 100, width: 100 }} />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center',flex:1,justifyContent:'center',height:height/1.2 }}>
          <Text style={styles.info}>{loading || isLoading ? 'Loading...' :'No Photo Available'}</Text>
        </View>
            }
          />
        </View>
    </WrapperContainer>
  );
};

export default SelectPhoto;

const styles = StyleSheet.create({
  imgStyle: {
    height: 75,
    width: 75,
    borderRadius: 75,
    marginRight: 10
  },
  title: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textColor
  },
  info: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textColor
  },
  subTitle: {
    color: COLORS.placeHolderTxtColor,
    marginTop: verticalScale(60),
    marginBottom: 10,
    fontSize: 12
  },
  check: {
    height: 18,
    width: 18,
    borderRadius: 5,
    borderColor: COLORS.primary,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(10),
    backgroundColor: 'white'
  }
})