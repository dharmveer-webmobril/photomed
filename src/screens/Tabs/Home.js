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
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import WrapperContainer from "../../components/WrapperContainer";
import commonStyles from "../../styles/commonStyles";
import { imagePath } from "../../configs/imagePath";
import useTokenManagement from "../../configs/useTokenManagement";
import {
  configUrl,
  getMySubscriptionDetails,

  validateSubscription,
} from "../../configs/api";
import COLORS from "../../styles/colors";
import {
  moderateScale,
  verticalScale,
} from "../../styles/responsiveLayoute";
import FONTS from "../../styles/fonts";
import { navigate } from "../../navigators/NavigationService";
import ScreenName from "../../configs/screenName";
import {
  useGetBannersQuery,
  useSearchPatientMutation,
} from "../../redux/api/common";
import { useDispatch, useSelector } from "react-redux";
import Loading from "../../components/Loading";
import CustomBtn from "../../components/CustomBtn";
import Toast from "react-native-simple-toast";
import CrossIcon from "../../assets/SvgIcons/CrossIcon";
import ImageWithLoader from "../../components/ImageWithLoader";
import { logout, updateSubscription } from "../../redux/slices/authSlice";
import { removeData } from "../../configs/helperFunction";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useFocusEffect } from "@react-navigation/native";
import {
  setCurrentPatient,
  setPatientImages,
  setUserSubscription,
} from "../../redux/slices/patientSlice";
const { width } = Dimensions.get("window");
import Swiper from "react-native-swiper";
import ImageCropPicker from "react-native-image-crop-picker";

const formatUrl = (url) => {
  let formattedUrl = url.replace(/\\/g, "/");
  return encodeURI(formattedUrl);
};


const Home = () => {
  const dispatch = useDispatch();
  const provider = useSelector((state) => state.auth.cloudType);

  GoogleSignin.configure({
    webClientId: configUrl.GOOGLE_CLIENT_ID,
    offlineAccess: false,
    scopes: ["email", "profile", "https://www.googleapis.com/auth/drive.file"],
  });

  const { width, height } = useWindowDimensions();

  const token = useSelector((state) => state.auth?.user);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const [refreshing, setRefreshing] = useState(false);
  const [patients, setPatients] = useState(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchData, setSearchData] = useState();
  const [searchPatient, { data: patientsData, isLoading: isPatientSearching }] = useSearchPatientMutation()
  const { data: banner, isLoading: loading, refetch: refetchBanner, } = useGetBannersQuery();
  const banners = banner?.ResponseBody;


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
            navigate("SubscriptionManage", { token: token });
          },
        },
      ],
      { cancelable: false }
    );
  };

  async function getSubs() {
    try {
      if (token) {
        setIsSubscriptionLoading(true);
        let res = await validateSubscription(token);
        if (res?.succeeded) {
          let subRes = res?.ResponseBody;
          if (subRes?.isExpired === "yes") {
            showSubscriptionAlert();
          }
          dispatch(setUserSubscription(subRes));
        } else {
          showSubscriptionAlert();
        }
        setIsSubscriptionLoading(false);
      }
    } catch (error) {
      showSubscriptionAlert();
      setIsSubscriptionLoading(false);
    }
  }

  const userId = useSelector((state) => state.auth.userId);
  async function getMySubscription() {
    try {
      if (token && userId) {
        let res = await getMySubscriptionDetails(token, userId);
        console.log("getMySubscriptionDetails res", res);

        dispatch(updateSubscription(res));
      }
    } catch (error) {
      console.log("getMySubscriptionDetails error", error);
    }
  }

  useFocusEffect(
    useCallback(() => {
      getMySubscription();
      // Platform.OS == 'ios' && getSubs()
    }, [token])
  );

  useTokenManagement(provider, accessToken);

  useFocusEffect(
    useCallback(() => {
      setSearchTerm("");
      setSearchData({ searchText: '', imageFile: null });
      dispatch(setPatientImages([]));
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      handleSearchPatient();
    }, [searchData])
  );


  useEffect(() => {
    setPatients(patientsData?.ResponseBody?.patientData || []);
  }, [patientsData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchBanner();
    await clearInput();
    handleSearchPatient()
    setRefreshing(false);
  }, []);

  const handleSearchPatient = async () => {

    try {
      const formData = new FormData();
      if (searchData?.searchText) {
        formData.append("search", searchData?.searchText);
      }

      if (searchData?.imageFile) {
        formData.append("face", {
          uri: searchData?.imageFile.path,
          name: searchData?.imageFile.fileName || "face.jpg",
          type: searchData?.imageFile.type || "image/jpeg",
        });
      }

      console.log('formDataformData', formData);
      let res = await searchPatient({ token, formData }).unwrap();
    } catch (error) {
      console.log('handleSearchPatient errorerror', error);
      let errorMessage = error?.data?.ResponseBody?.error || "Data not found..";
      Toast.show(errorMessage, Toast.LONG);
    } finally {
      setIsLoading(false)
    }

  };


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
        <View
          style={{
            borderRadius: 10,
            borderColor: COLORS.blackColor,
            borderWidth: 1,
            marginHorizontal: 30,
            paddingHorizontal: 8,
          }}
        >
          <ImageWithLoader
            uri={formattedUrl}
            resizeMode={"contain"}
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
          uri={
            item?.profileImage
              ? configUrl?.imageUrl + item?.profileImage
              : imagePath.no_user_img
          }
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

  const openCamera = () => {
    ImageCropPicker.openCamera({
      cropping: true,
      mediaType: "photo",
      width: 200,
      height: 200,
      compressImageQuality: 0.4
    }).then((img) => {
      mangeSearchImg(img)
    }).catch((er) => {
      console.log('errrorororo', er);
      if (er?.message?.includes('User did not grant camera permission.')) {
        Toast.show("To take a photo, please allow camera access for PhotoMed Pro in your device settings.");
        return;
      }
    })
  }

  const chooseImage = () => {
    ImageCropPicker.openPicker({
      cropping: true,
      mediaType: "photo",
      width: 200,
      height: 200,
      compressImageQuality: 0.4
    }).then(async (img) => {
      mangeSearchImg(img)
    }).catch((er) => {
      console.log('errrorororo', er);
      if (er?.message?.includes('User did not grant library permission.')) {
        Toast.show("To select a photo, please allow photo access for PhotoMed Pro in your device settings.");
        return;
      }
    });
  }

  const mangeSearchImg = (img) => {
    let imgFile = {
      path: img.path || img.uri,
      name: img.fileName || "face.jpg",
      type: img.type || "image/jpeg",
    }
    if (!imgFile.path.startsWith("file://")) {
      imgFile.path = `file://${imgFile.path}`;
    }

    setSearchTerm('')
    setSearchData(({ searchText: '', imageFile: imgFile }));
  }

  const clearFaceImage = () => {
    setSearchData({ imageFile: null });
  };

  const [timeoutToClear, setTimeoutToClear] = useState();

  useEffect(() => {
    return () => {
      clearTimeout(timeoutToClear);
    };
  }, []);

  const debounce = (callback, alwaysCall, ms) => {
    return (...args) => {
      alwaysCall(...args);
      clearTimeout(timeoutToClear);
      setTimeoutToClear(
        setTimeout(() => {
          callback(...args);
        }, ms)
      );
    };
  };

  const setSearchTextAlways = (txt) => {
    setSearchTerm(txt);
  };

  const searchRestra = async (txt) => {
    setSearchData(prev => ({ searchText: txt, imageFile: null }));
  };

  const debouncedSearch = debounce(
    searchRestra,
    setSearchTextAlways,
    800
  );

  const clearInput = async () => {
    setSearchTerm("");
    setSearchData(prev => ({ searchText: '', imageFile: null }));
  }
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  return (
    <WrapperContainer wrapperStyle={[commonStyles.innerContainer, { paddingHorizontal: 0 }]}>
      <Loading visible={isSubscriptionLoading} />
      <View style={styles.searchWrapper}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Image
            source={imagePath.search}
            resizeMode="contain"
            style={styles.searchIcon}
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search patient..."
            placeholderTextColor={COLORS.placeHolderTxtColor}
            value={searchTerm}
            onChangeText={debouncedSearch}
            autoCapitalize="none"
            returnKeyType="search"
          />

          {searchTerm?.length > 0 && (
            <TouchableOpacity
              onPress={clearInput}
              style={styles.iconBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CrossIcon height={20} width={20} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() =>
              Alert.alert("Search by face", "Choose option", [
                { text: "Camera", onPress: openCamera },
                { text: "Gallery", onPress: chooseImage },
                { text: "Cancel", style: "cancel" },
              ])
            }
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image
              source={require("../../assets/images/icons/cam.png")}
              style={styles.cameraIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Face Preview */}
        {searchData?.imageFile && (
          <View style={styles.facePreviewWrapper}>
            <Image
              source={{ uri: searchData.imageFile.path }}
              style={styles.faceImage}
            />
            <TouchableOpacity
              onPress={clearFaceImage}
              style={styles.faceRemoveBtn}
            >
              <Image
                source={require("../../assets/images/icons/close.png")}
                style={{ height: 10, width: 10 }}
              />
            </TouchableOpacity>
          </View>
        )}
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
              {banners && banners.length > 0 && (
                <Swiper
                  dot=<View style={styles.paginationInActiveStyle} />
                  activeDot={<View style={styles.paginationActiveStyle} />}
                >
                  {banners.map((item) => {
                    return renderBannerItem(item);
                  })}
                </Swiper>
              )}
            </View>
          }
          ListFooterComponent={<View style={{ height: verticalScale(40) }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {isPatientSearching ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
              ) : (searchTerm || searchData?.imageFile) ? (
                <>
                  <Text style={styles.emptyTitle}>No patients found</Text>
                  <Text style={styles.emptySubtitle}>
                    Try different keywords or search by face again.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.emptyTitle}>No patients yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Start adding patients to manage their records efficiently.
                  </Text>
                  <CustomBtn
                    title="Add New Patient"
                    onPress={() => navigate(ScreenName.ADD_PATIENT)}
                    btnStyle={styles.addBtn}
                    titleStyle={styles.addBtnText}
                  />
                </>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary, "#4C9CCF"]}
              progressBackgroundColor={COLORS.whiteColor}
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
    fontSize: 10,
    fontFamily: FONTS.medium,
    position: "absolute",
    top: 5,
    right: -8,
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
    borderRadius: 40,

    height: 50,
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
  facePreviewContainer: {
    position: "relative",
    marginRight: 8,
  },
  faceThumbnail: {
    width: 45,
    height: 45,
    borderRadius: 45 / 2,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  removeFaceBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: COLORS.primary,
    borderRadius: 12.5,
    width: 25,
    height: 25,
    justifyContent: "center",
    alignItems: "center",
  },


  // search backgroundImage
  searchWrapper: {
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    width: "90%",
    alignSelf: 'center'
  },

  searchContainer: {
    flex: 1,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    backgroundColor: COLORS.whiteColor,
    paddingHorizontal: 14,
  },

  searchIcon: {
    height: 18,
    width: 18,
    tintColor: COLORS.placeHolderTxtColor,
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    paddingVertical: 0,
  },

  iconBtn: {
    height: 36,
    width: 36,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },

  cameraIcon: {
    height: 22,
    width: 22,
    tintColor: COLORS.primary,
  },

  facePreviewWrapper: {
    marginLeft: 10,
    position: "relative",
  },

  faceImage: {
    height: 44,
    width: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  faceRemoveBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },

});
