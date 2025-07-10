import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  moderateScale,
  verticalScale,
  width,
} from "../styles/responsiveLayoute";
import COLORS from "../styles/colors";
import FONTS from "../styles/fonts";
import FastImage from "react-native-fast-image";
import { useDispatch, useSelector } from "react-redux";
import LeftBody from "../assets/SvgIcons/body/LeftBody";
import Grid33 from "../assets/SvgIcons/Grid33";
import Grid44 from "../assets/SvgIcons/Grid44";
import GridBorder from "../assets/SvgIcons/GridBorder";
import FrontFace from "../assets/SvgIcons/Face/FrontFace";
import LeftFace from "../assets/SvgIcons/Face/LeftFace";
import FrontNeck from "../assets/SvgIcons/Neck/FrontNeck";
import LeftNeck from "../assets/SvgIcons/Neck/LeftNeck";
import BackTrio from "../assets/SvgIcons/Trichology/BackTrio";
import SlightLeft from "../assets/SvgIcons/Face/SlightLeft";
import SlightRight from "../assets/SvgIcons/Face/SlightRight";
import RightFace from "../assets/SvgIcons/Face/RightFace";
import Lip from "../assets/SvgIcons/Face/Lip";
import LeftNeckDown from "../assets/SvgIcons/Neck/LeftNeckDown";
import RightNeck from "../assets/SvgIcons/Neck/RightNeck";
import RightNeckDown from "../assets/SvgIcons/Neck/RightNeckDown";
import FrontTrio from "../assets/SvgIcons/Trichology/FrontTrio";
import SlightLeftTrio from "../assets/SvgIcons/Trichology/SlightLeftTrio";
import LeftTrio from "../assets/SvgIcons/Trichology/LeftTrio";
import SlightRightTrio from "../assets/SvgIcons/Trichology/SlightRightTrio";
import RightTrio from "../assets/SvgIcons/Trichology/RightTrio";
import CustomBtn from "../components/CustomBtn";
import Slider from "@react-native-community/slider";
import GhostIcon from "../assets/SvgIcons/GhostIcon";
import CrossIcon from "../assets/SvgIcons/CrossIcon";
import ColordBody from "../assets/SvgIcons/body/ColordBody";
import RightBody from "../assets/SvgIcons/body/RightBody";
import BackBody from "../assets/SvgIcons/body/BackBody";
import SlightLeftBody from "../assets/SvgIcons/body/SlightLeftBody";
import SlightRightBody from "../assets/SvgIcons/body/SlightRightBody";
import commonStyles from "../styles/commonStyles";
import {
  checkAndRefreshGoogleAccessToken,
  setFilePublic,
  getImageDetailsById,
  generateUniqueKey,
} from "../configs/api";
import {
  useGetAllImageUrlsQuery,
  usePostImageCategoryMutation,
  useUpdatePatientMutation,
  useUploadFileToDropboxMutation,
} from "../redux/api/common";
import Loading from "../components/Loading";
import Toast from "react-native-simple-toast";
import imagePaths from "../assets/images";
import ImageWithLoader from "../components/ImageWithLoader";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import CustToast from "../components/CustToast";
import SelectedGridOverlay from "../components/SelectedGridOverlay";
import Gestures from "react-native-easy-gestures";
import ViewShot from "react-native-view-shot";
import { uploadFilesToPhotoMedFolder } from "../configs/api";
import ScreenName from "../configs/screenName";
import { setPatientImages } from "../redux/slices/patientSlice";
const Framing = (props) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [postImage, {}] = usePostImageCategoryMutation();
  const token = useSelector((state) => state.auth?.user);
  const provider = useSelector((state) => state.auth.cloudType);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const patientId = useSelector((state) => state?.auth?.patientId?.patientId);
  const patientName = useSelector(
    (state) => state?.auth?.patientName?.patientName
  );
  const patientFullId = useSelector(
    (state) => state.patient?.currentActivePatient?._id
  );
  const {
    data: imageUrls = [],
    error,
    isLoading: load,
    refetch,
  } = useGetAllImageUrlsQuery({
    userId: `${patientName}${patientId}` || "", // Default to empty string if undefined
    accessToken: accessToken || "",
  });

  const [selectedCategory, setSelectedCategory] = useState(1); // Set default to 1 for Grid category
  const [selectedGridItem, setSelectedGridItem] = useState(null); // Track the selected grid item
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ghostImage, setGhostImage] = useState(null);
  const [percentage, setPercentage] = useState(50);
  const opacity = useSharedValue(0.5);
  const { selectedImage } = props?.route?.params;
  const [uploadFileToDropbox] = useUploadFileToDropboxMutation();
  const [updatePatient] = useUpdatePatientMutation();
  const patientImages = useSelector((state) => state?.patient?.patientImages);
  const handlePostImageCategory = async (id) => {
    const imageData = {
      imageId: id,
      category: "",
      notes: "",
      imageType: "PhotoMed Reframe",
    };
    try {
      const res = await postImage({ token, imageData });
    } catch (error) {
      Toast.show("Failed to update image details");
    }
  };

  const gridData = [
    { id: 1, icon: Grid33, message: "Grid 3x3" },
    { id: 2, icon: Grid44, message: "Grid 4x4" },
    { id: 3, icon: GridBorder, message: "No Grid" },
  ];
  const bodyData = [
    {
      id: 1,
      icon: ColordBody,
      image: imagePaths.body_front,
      message: "Frontal body",
      align: "center",
    },
    {
      id: 2,
      icon: LeftBody,
      image: imagePaths.body_left,
      message: "Left body",
      align: "center",
    },
    {
      id: 3,
      icon: SlightLeftBody,
      image: imagePaths.body_slight_left,
      message: "Partially left body",
      align: "center",
    },
    {
      id: 4,
      icon: SlightRightBody,
      image: imagePaths.body_slight_right,
      message: "Partially right body",
      align: "center",
    },
    {
      id: 5,
      icon: RightBody,
      image: imagePaths.body_right,
      message: "Right body",
      align: "center",
    },
    {
      id: 6,
      icon: BackBody,
      image: imagePaths.body_back,
      message: "Back body",
      align: "center",
    },
  ];
  const trichologyData = [
    {
      id: 1,
      icon: FrontTrio,
      image: imagePaths.scalp_top,
      message: "Parietal scalp",
      align: "center",
    },
    {
      id: 2,
      icon: BackTrio,
      image: imagePaths.scalp_top1,
      message: "Occipital scalp",
      align: "center",
    },
    {
      id: 3,
      icon: LeftTrio,
      image: imagePaths.scalp_left,
      message: "Left temporal scalp",
      align: "flex-start",
    },
    {
      id: 4,
      icon: SlightLeftTrio,
      image: imagePaths.scalp_slight_left,
      message: "Left 45 deg scalp",
      align: "flex-start",
    },
    {
      id: 5,
      icon: SlightRightTrio,
      image: imagePaths.scalp_right,
      message: "Right 45 deg scalp",
      align: "flex-end",
    },
    {
      id: 6,
      icon: RightTrio,
      image: imagePaths.scalp_slight_right,
      message: "Left temporal scalp",
      align: "flex-start",
    },
  ];

  const neckData = [
    {
      id: 1,
      icon: FrontNeck,
      image: imagePaths.neck_front,
      message: "Frontal neck",
      align: "center",
    },
    {
      id: 2,
      icon: LeftNeck,
      image: imagePaths.neck_left,
      message: "Left neck",
      align: "flex-start",
    },
    {
      id: 4,
      icon: LeftNeckDown,
      image: imagePaths.neck_down_left,
      message: "Left neck down",
      align: "flex-start",
    },
    {
      id: 5,
      icon: RightNeck,
      image: imagePaths.neck_right,
      message: "Right neck",
      align: "flex-end",
    },
    {
      id: 6,
      icon: RightNeckDown,
      image: imagePaths.neck_down_right,
      message: "Right neck down",
      align: "flex-end",
    },
  ];

  const faceData = [
    {
      id: 1,
      icon: FrontFace,
      image: imagePaths.face_front,
      message: "Frontal face",
      align: "center",
    },
    {
      id: 2,
      icon: LeftFace,
      image: imagePaths.face_left,
      message: "Left face",
      align: "flex-start",
    },
    {
      id: 3,
      icon: SlightLeft,
      image: imagePaths.face_slight_left,
      message: "Left face 45 deg",
      align: "flex-start",
    },
    {
      id: 4,
      icon: SlightRight,
      image: imagePaths.face_slight_right,
      message: "Right face 45 deg",
      align: "flex-end",
    },
    {
      id: 5,
      icon: RightFace,
      image: imagePaths.face_right,
      message: "Right face",
      align: "flex-end",
    },
    {
      id: 6,
      icon: Lip,
      image: imagePaths.face_lips,
      message: "Lips",
      align: "center",
    },
  ];

  // Combine categories and their respective data into a single array
  const combinedData = [
    { id: 1, name: "Grid", data: gridData },
    { id: 2, name: "Face", data: faceData },
    { id: 3, name: "Neck", data: neckData },
    { id: 4, name: "Trichology", data: trichologyData },
    { id: 5, name: "Body", data: bodyData },
    // { id: 6, name: 'Ghost Photo', data: [] },
  ];
  const saveImageCount = async (count) => {
    const id = patientFullId;
    const patientData = {
      imageCount: count ? count : 0,
    };

    try {
      const response = await updatePatient({
        token,
        id,
        patientData,
        updateType: "count",
      }).unwrap();
      // console.log("image count response", response);
    } catch (error) {
      console.error("Failed to add patient:", error);
    }
  };
  useEffect(() => {
    if (selectedCategory != 6) {
      setPercentage(50);
      setGhostImage(null);
    }
    if (selectedCategory == 1) setSelectedGridItem(combinedData[0].data[0]);
  }, [selectedCategory]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSavePress1}
          style={styles.btnContainer}
        >
          <Text
            style={{
              fontFamily: FONTS.medium,
              fontSize: 12,
              color: COLORS.whiteColor,
            }}
          >
            Save
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value, // Control opacity based on slider value
    };
  });

  const getCategoryData = () => {
    const category = combinedData.find((item) => item.id === selectedCategory);
    return category ? category.data : [];
  };

  const collageRef = React.useRef();

  const handleSavePress1 = async () => {
    setLoading(true);
    try {
      if (collageRef?.current) {
        const photo = await collageRef?.current?.capture({
          format: "jpg",
          quality: 0.8,
        });
        
        const fileDetails = [
          {
            uri: photo,
            type: "image/jpeg",
            name: `${patientName}${Date.now()}.jpg`,
          },
        ];

        if (provider === "google") {
          let vailidToken = await checkAndRefreshGoogleAccessToken(accessToken);
          const patientInfo = {
            patientId,
            patientName,
          };
          const uploadedFileIds = await uploadFilesToPhotoMedFolder(
            fileDetails,
            patientInfo,
            accessToken
          );
          console.log("uploadedFileIdsuploadedFileIds", uploadedFileIds);

          const uploadedImages = await Promise.all(
            uploadedFileIds.map(async (fileId) => {
              const image = await getImageDetailsById(fileId, accessToken);
              const publicUrl = await setFilePublic(fileId, accessToken);
              return {
                ...image,
                publicUrl,
              };
            })
          );
          let imgss = [...patientImages, ...uploadedImages];
          dispatch(setPatientImages(imgss));
          saveImageCount(imgss?.length || 0);
        } else if (provider === "dropbox") {
          const uploadedResults = await Promise.all(
            fileDetails.map(async (file) => {
              let uniqueKey = generateUniqueKey();
              let imageName = `${patientName}_${uniqueKey}.jpg`;
              const result = await uploadFileToDropbox({
                file,
                userId: patientName + patientId,
                accessToken,
                imageName,
              }).unwrap();
              return result;
            })
          );
        }
      }

      setLoading(false);
      navigation.navigate(ScreenName.HOME);

      // setIsCapturingImage(false);
    } catch (error) {
      console.error("Error during save operation:", error);
      setLoading(false);
      // setIsCapturingImage(false);
    }
  };
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.whiteColor }}>
      <Loading visible={loading} />
      <View style={[styles.imgStyle, { overflow: "hidden" }]}>
        <ViewShot ref={collageRef}>
          <Gestures
            draggable={true}
            rotatable={true}
            scalable={{ min: 1, max: 5 }}
            style={{ height: "100%", width: "100%" }}
          >
            {/* <ResumableZoom style={styles.imgStyle} extendGestures={true} maxScale={10}> */}
            {/* <View style={{ height: 400, width: width,backgroundColor:"#000" }}> */}
            <FastImage
              style={styles.imgStyle}
              source={{
                uri:
                  provider === "google"
                    ? selectedImage?.webContentLink
                    : selectedImage?.publicUrl,
              }}
            />
            {/* </View> */}
            {/* </ResumableZoom> */}
          </Gestures>
        </ViewShot>
        {selectedGridItem &&
          selectedCategory != 6 &&
          selectedGridItem?.message && (
            <CustToast
              height={verticalScale(375)}
              message={selectedGridItem.message}
            />
          )}
        <SelectedGridOverlay
          selectedGridItem={selectedGridItem}
          selectedCategory={selectedCategory}
          height={verticalScale(375)}
          width={width}
        />

        {ghostImage && (
          <Animated.Image
            source={{ uri: ghostImage }}
            style={[styles.overlayImage, animatedStyle]}
          />
        )}
      </View>

      <View>
        {selectedCategory != 6 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              commonStyles.flexView,
              {
                alignSelf: "center",
                marginLeft: 10,
                width: "100%",
                justifyContent: "center",
              },
            ]}
          >
            {getCategoryData().map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.iconContainer,
                  selectedGridItem?.id === item.id && {
                    borderWidth: 1,
                    borderColor: COLORS.primary, // Apply border when item is selected
                  },
                ]}
                onPress={() => setSelectedGridItem(item)} // Set the selected grid item
              >
                <item.icon />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            {selectedCategory == 6 && (
              <View
                style={{ height: verticalScale(110), alignItems: "center" }}
              >
                <FlatList
                  horizontal
                  data={provider == "google" ? images : imageUrls}
                  renderItem={({ item }) => {
                    return (
                      <TouchableOpacity
                        onPress={() =>
                          provider == "google"
                            ? setGhostImage(item.webContentLink)
                            : setGhostImage(item.publicUrl)
                        }
                      >
                        <ImageWithLoader
                          uri={
                            provider == "google"
                              ? item.webContentLink
                              : item.publicUrl
                          }
                          style={styles.ghostImg}
                        />
                      </TouchableOpacity>
                    );
                  }}
                />
                {images?.length || imageUrls?.length > 0 ? (
                  <View
                    style={[
                      commonStyles.flexView,
                      { marginTop: 10, alignSelf: "center" },
                    ]}
                  >
                    {ghostImage && (
                      <>
                        <View>
                          <GhostIcon height={25} width={25} />
                          <Text
                            style={{
                              color: COLORS.textColor,
                              fontSize: 12,
                              fontFamily: FONTS.medium,
                            }}
                          >
                            {percentage}%
                          </Text>
                        </View>
                        <Slider
                          style={styles.slider}
                          minimumValue={0} // Fully ghost (transparent)
                          maximumValue={1} // Fully visible
                          step={0.01} // Increments of 1%
                          value={opacity.value} // Initial value
                          onValueChange={(value) => {
                            opacity.value = value; // Adjust the opacity as the slider moves
                            setPercentage(Math.round(value * 100)); // Convert to percentage
                          }}
                          minimumTrackTintColor={COLORS.primary}
                          maximumTrackTintColor="#000000"
                        />
                        <CrossIcon onPress={() => setGhostImage(null)} />
                      </>
                    )}
                    {!ghostImage && (
                      <CustomBtn
                        // onPress={() => chooseImage()}
                        titleStyle={{ fontSize: 10 }}
                        btnStyle={{
                          height: 30,
                          width: "30%",
                          marginBottom: verticalScale(8),
                        }}
                        title={"Select Ghost Photo"}
                      />
                    )}
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.txtStyle,
                      {
                        marginBottom: 20,
                        color: COLORS.textColor,
                        fontFamily: FONTS.bold,
                        fontSize: 14,
                      },
                    ]}
                  >
                    No Photo Available.
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Category Selection */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.aestheticsContainer}
        >
          {combinedData.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => {
                setSelectedCategory(item.id); // Set the selected category
                // setSelectedGridItem(null);     // Reset selected grid item when category changes
                setSelectedGridItem(item.data[0]);
              }}
              style={[
                styles.category,
                { borderBottomWidth: item.id === selectedCategory ? 2.4 : 0 },
              ]}
            >
              <Text style={[styles.txtStyle, { fontSize: 12 }]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default Framing;

const styles = StyleSheet.create({
  btnContainer: {
    backgroundColor: COLORS.primary,
    height: moderateScale(30),
    width: moderateScale(80),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 40,
  },
  imgStyle: {
    marginBottom: verticalScale(20),
    height: verticalScale(375),
    width: width,
    marginRight: moderateScale(5),
  },
  captureContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: 65,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  actionBtn: {
    height: 31.5,
    width: 31.5,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderColor: COLORS.borderColor,
    borderWidth: 1,
  },
  txtStyle: {
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    fontSize: 10,
  },
  swithContainer: {
    borderRadius: 10,
    borderColor: COLORS.primary,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: moderateScale(10),
  },
  camBtn: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    marginBottom: moderateScale(5),
  },
  capture: {
    height: 46,
    width: 46,
    borderRadius: 46,
    borderColor: COLORS.whiteColor,
    borderWidth: 5,
  },
  aestheticsContainer: {
    // ...commonStyles.flexView,
    // justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    marginTop: verticalScale(10),
    // width:'100%'
  },
  category: {
    borderBottomColor: COLORS.primary,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor:'red',
    marginHorizontal: moderateScale(20),
  },
  iconContainer: {
    backgroundColor: "#D6D8D7",
    borderRadius: 10,
    marginRight: moderateScale(10),
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center", // Center the content if needed
    alignItems: "center", // Center content
  },
  count: {
    position: "absolute",
    backgroundColor: COLORS.primary,
    height: 10,
    width: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    top: 2,
    right: 2,
    zIndex: 1,
  },
  overlayImage: {
    height: "100%",
    width: width,
    position: "absolute", // Make the image overlay the camera
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    resizeMode: "cover",
  },
  slider: {
    width: 200,
    height: 40,
    // marginTop: 30,
  },
  ghostImg: {
    height: 60,
    width: 60,
    margin: 5,
    borderRadius: 5,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  button: {
    marginHorizontal: 10,
    // padding: 10,
    backgroundColor: COLORS.white,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 16,
    color: COLORS.blackColor,
  },
});
