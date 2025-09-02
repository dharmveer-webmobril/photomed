import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  TextInput,
  Platform,
  useWindowDimensions,
  Alert,
} from "react-native";
import React, { useEffect, useState, useCallback, useRef } from "react";
import WrapperContainer from "../../components/WrapperContainer";
import SubscriptionExpiredModal from "../../components/SubscriptionExpiredModal";
import commonStyles from "../../styles/commonStyles";
import { imagePath } from "../../configs/imagePath";
import useTokenManagement from "../../configs/useTokenManagement";
import {
  configUrl,
  getUserPlans,
  validateReceiptData,
  validateSubscription,
} from "../../configs/api";
import { SwiperFlatList } from "react-native-swiper-flatlist";
import COLORS from "../../styles/colors";
import { height, moderateScale, verticalScale } from "../../styles/responsiveLayoute";
import FONTS from "../../styles/fonts";
import { navigate } from "../../navigators/NavigationService";
import ScreenName from "../../configs/screenName";
import {
  useGetBannersQuery,
  useGetItemsQuery,
  useGetUserProfileQuery,
  useSearchPatientQuery,
} from "../../redux/api/common"; // Changed to query
import { useDispatch, useSelector } from "react-redux";
import Loading from "../../components/Loading";
import CustomBtn from "../../components/CustomBtn";
import Toast from "react-native-simple-toast";
import CrossIcon from "../../assets/SvgIcons/CrossIcon";
import ImageWithLoader from "../../components/ImageWithLoader";
import { logout } from "../../redux/slices/authSlice";
import { removeData } from "../../configs/helperFunction";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  setCurrentPatient,
  setPatientImages,
  setUserSubscription,
} from "../../redux/slices/patientSlice";
import Orientation from "react-native-orientation-locker";
const { width } = Dimensions.get("window");
import Swiper from 'react-native-swiper'
const Home = () => {
  const dispatch = useDispatch();
  const provider = useSelector((state) => state.auth.cloudType);

  GoogleSignin.configure({
    webClientId: configUrl.GOOGLE_CLIENT_ID,
    offlineAccess: false,
    scopes: [
      "email",
      "profile",
      "https://www.googleapis.com/auth/drive.file"
    ],
  });

  const token = useSelector((state) => state.auth?.user);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const [refreshing, setRefreshing] = useState(false); // State for pull-to-refresh
  const [patients, setPatients] = useState(null); // State for pull-to-refresh
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false); // State for pull-to-refresh
  const [isSubscriptionModal, setIsSubscriptionModal] = useState(false); // State for pull-to-refresh

  const {
    data: banner,
    isLoading: loading,
    refetch: refetchBanner,
  } = useGetBannersQuery();
  const banners = banner?.ResponseBody;


  // const { data: profileData, isLoading: profileLoading, isError: err, error } = useGetUserProfileQuery({ token });
  // if (profileData) {
  //   console.log('profileDataprofileData', profileData);
  // }

  const showSubscriptionAlert = () => {
    Alert.alert(
      "Your subscription has expired",
      "To continue enjoying full access, please renew or choose a new plan.",
      [
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            dispatch(logout());
          },
        },
        {
          text: "View Plans",
          style: "default",
          onPress: () => {
            navigate('SubscriptionManage', { token: token });
          },
        },
      ],
      { cancelable: false }
    );
  };

  async function getSubs() {
    try {
      if (token) {
        setIsSubscriptionLoading(true)
        let res = await validateSubscription(token)
        if (res?.succeeded) {
          let subRes = res?.ResponseBody
          if (subRes?.isExpired === 'yes') {
            showSubscriptionAlert()
          }
          dispatch(setUserSubscription(subRes));
        } else {
          showSubscriptionAlert()
        }
        setIsSubscriptionLoading(false)

      }
    } catch (error) {
      showSubscriptionAlert()
      setIsSubscriptionLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      // Platform.OS == 'ios' && getSubs()
    }, [token])
  );

  useTokenManagement(provider, accessToken);

  useFocusEffect(
    useCallback(() => {
      setSearchTerm("");
      dispatch(setPatientImages([]));
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchBanner();
    setRefreshing(false);
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm); // Update API query only after delay
    }, 500); // 500ms delay
    return () => {
      clearTimeout(handler); // Cleanup timeout on each keystroke
    };
  }, [searchTerm]);

  // API query runs only when debouncedSearchTerm changes
  const { data: patientsData, isLoading, isError } = useSearchPatientQuery({
    term: debouncedSearchTerm, // your search input value
    token: token, // your auth token
  });

  useEffect(() => {
    setPatients(patientsData?.ResponseBody?.patientData || []);
  }, [patientsData]);

  const formatUrl = (url) => {
    // Replace backslashes with forward slashes
    let formattedUrl = url.replace(/\\/g, "/");
    // Encode the URI to handle special characters
    return encodeURI(formattedUrl);
  };
  const { width, height } = useWindowDimensions();


  const goPatientDetailPage = async (item) => {
    await removeData("patientFolderId");
    dispatch(setCurrentPatient(item));
    navigate(ScreenName.PATIENT_DETAILS, { item });
  };

  const renderBannerItem = (item) => {

    const rawUrl = `${configUrl.imageUrl}${item?.profiles[0]}`;
    const formattedUrl = formatUrl(rawUrl);
    return (
      <View style={{ width: width }}>
        <View style={{
          borderRadius: 10,
          borderColor: COLORS.blackColor,
          borderWidth: 1,
          marginHorizontal: 30,
          paddingHorizontal: 8
        }}>
          <ImageWithLoader
            uri={formattedUrl}
            resizeMode={'contain'}
            style={{
              width: width * 0.8,
              alignSelf: "center",
              height: verticalScale(150),
            }}
          />
        </View>
      </View>
    );
  };

  const renderItem = ({ item }) => {

    return (
      <TouchableOpacity
        onPress={() => goPatientDetailPage(item)}
        activeOpacity={0.8}
        style={styles.cardContainer}
      >
        <ImageWithLoader
          uri={item?.profileImage ? configUrl?.imageUrl + item?.profileImage: imagePath.no_user_img}
          style={styles.imgStyle}
        />
        <View style={[commonStyles.flexView, { flex: 1 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.full_name}</Text>
            <Text style={styles.subTitle}>{item.dob}</Text>
            {item?.mobile && (
              <Text style={styles.subTitle}>{item?.mobile}</Text>
            )}
            {item?.email && <Text style={styles.subTitle}>{item.email}</Text>}
          </View>

        </View>
      </TouchableOpacity>
    );
  };


  return (
    <WrapperContainer
      wrapperStyle={[commonStyles.innerContainer, { paddingHorizontal: 0 }]}
    >
      <SubscriptionExpiredModal
        visible={isSubscriptionModal}
        onViewPlans={() => {
          setIsSubscriptionModal(false);
          navigate('SubscriptionManage', { token: token }); // Or your view plans screen
        }}
      />
      <Loading visible={isSubscriptionLoading || isLoading} />
      <View style={{ paddingHorizontal: 20 }}>
        <View style={[styles.textInputContainerStyle]}>
          <Image
            resizeMode="contain"
            source={imagePath.search}
            style={{ marginHorizontal: 9.5 }}
          />
          <TextInput
            style={styles.textinputStyle}
            placeholder={"Search..."}
            placeholderTextColor={COLORS.textColor}
            value={searchTerm}
            // onChangeText={debouncedSearchPatient}
            onChangeText={setSearchTerm}
            autoCapitalize="none"
          />
          {searchTerm.length > 0 && ( // Show CrossIcon only if there's text in the input
            <TouchableOpacity
              onPress={() => {
                setSearchTerm("");
              }}
              style={{
                justifyContent: "center",
                alignItems: "flex-end",
                padding: 9.5,
              }}
            >
              <CrossIcon height={20} width={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          data={patients}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 90 }}
          ListHeaderComponent={
            <View style={{ height: verticalScale(200) }}>
              {
                banners && banners.length > 0 &&
                <Swiper
                  dot=<View style={styles.paginationInActiveStyle} />
                  activeDot={<View style={styles.paginationActiveStyle} />}
                >
                  {
                    banners.map((item) => {
                      return renderBannerItem(item)
                    })
                  }
                </Swiper>
              }
            </View>
          }
          ListFooterComponent={<View style={{ height: verticalScale(40) }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {searchTerm ? (
                // Message for local search when no results match the search query
                <>
                  <Text style={styles.emptyText}>
                    No matching patients found.
                  </Text>
                  <Text style={[styles.emptyText, { fontSize: 12 }]}>
                    Try adjusting your search criteria or adding a new patient if they aren't in the list. You can also search using tags.
                  </Text>
                </>
              ) : (
                // Default message when the list is empty from the API response
                <>
                  {
                    !isLoading &&
                    <>
                      <Text style={styles.emptyText}>
                        You don't have any patients added yet.
                      </Text>
                      <Text style={[styles.emptyText, { fontSize: 12 }]}>
                        Start managing your patients by adding them here. Once
                        added, you’ll be able to track their information and stay
                        updated.
                      </Text>
                      <CustomBtn
                        onPress={() => navigate(ScreenName.ADD_PATIENT)}
                        titleStyle={{ fontSize: 10 }}
                        btnStyle={{
                          width: 150,
                          height: 30,
                          marginTop: verticalScale(10),
                        }}
                        title={"Add New Patient"}
                      />
                    </>
                  }
                </>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary} // Spinner color for iOS
              colors={[COLORS.primary, "#4C9CCF"]} // Spinner colors for Android
              progressBackgroundColor={COLORS.whiteColor} // Background color for Android spinner
            />
          }
        />
      </View>
    </WrapperContainer>
  );
};

export default Home;

const styles = StyleSheet.create({
  swiperContainer: {
    width,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(40),
  },
  paginationInActiveStyle: {
    backgroundColor: COLORS.whiteColor,
    height: 6,
    width: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginHorizontal: 3,
  },
  paginationActiveStyle: {
    marginHorizontal: 3,
    height: 8,
    borderRadius: 4,
    width: 8,
    backgroundColor: COLORS.primary,
  },
  bannerImgStyle: {
    width: width * 0.8,
    alignSelf: "center",
    height: verticalScale(150),
  },
  cardContainer: {
    ...commonStyles.shadowContainer,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "90%",
    padding: 15,
    marginBottom: verticalScale(7.5),
  },
  imgStyle: {
    height: 75,
    width: 75,
    borderRadius: 18,
    marginRight: moderateScale(15),
  },
  imgIcon: {
    height: 30,
    width: 30,
  },
  title: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.textColor,
  },
  subTitle: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.placeHolderTxtColor,
  },
  countWrapper: {
    position: "absolute",
    right: 0,
    bottom: 0,
  },
  countContainer: {
    height: 20,
    width: 20,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    right: 0,
    bottom: 25,
    left: 18,
  },
  countTxt: {
    color: COLORS.textColor,
    fontFamily: FONTS.medium,
    fontSize: 10,
  },
  plusTxt: {
    fontSize: 10, // Smaller font size for '+'
    fontFamily: FONTS.medium,
    position: "absolute", // Absolute positioning
    top: 5, // Move '+' upward
    right: -8, // Adjust horizontal position if needed
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: "35%",
    paddingHorizontal: moderateScale(30),
  },
  emptyText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.placeHolderTxtColor,
    textAlign: "center",
  },
  textInputContainerStyle: {
    borderColor: COLORS.borderColor,
    borderWidth: 1,
    width: "100%",
    borderRadius: 40,
    height: 40.5,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  textinputStyle: {
    textAlignVertical: "top",
    color: COLORS.textColor,
    fontSize: 12,
    flex: 1,
  },
  lableStyle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textColor,
    marginBottom: 10,
    marginLeft: 10,
  },
});
