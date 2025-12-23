import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  FlatList,
  Alert,
  useWindowDimensions,
  Platform,
} from "react-native";
import React, { useRef, useState, useEffect, useCallback } from "react";
import WrapperContainer from "../components/WrapperContainer";
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
} from "react-native-vision-camera";
import commonStyles from "../styles/commonStyles";
import COLORS from "../styles/colors";
import SearchIcon from "../assets/SvgIcons/SearchIcon";
import FONTS from "../styles/fonts";
import { moderateScale, verticalScale } from "../styles/responsiveLayoute";
import ScaleIcon from "../assets/SvgIcons/ScaleIcon";
import CustToast from "../components/CustToast";
import { goBack, navigate } from "../navigators/NavigationService";
import ScreenName from "../configs/screenName";
import Loading from "../components/Loading";
import CustomBtn from "../components/CustomBtn";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import Slider from "@react-native-community/slider";
import GhostIcon from "../assets/SvgIcons/GhostIcon";
import CrossIcon from "../assets/SvgIcons/CrossIcon";
import {
  checkAndRefreshGoogleAccessToken,
  getDropboxFileUrl,
  setFilePublic,
  getImageDetailsById,
  generateUniqueKey,
  uploadCaptureFilesToPhotoMedFolder,
  configUrl,
} from "../configs/api";
import { useDispatch, useSelector } from "react-redux";
import {
  useUpdatePatientMutation,
  useUploadSingleFileToDropboxMutation,
} from "../redux/api/common";
import ImageWithLoader from "../components/ImageWithLoader";
import DeleteImagePopUp from "../components/DeleteImagePopUp";
import { useFocusEffect } from "@react-navigation/native";
import { Image as CompressImage } from "react-native-compressor";
import SelectedGridOverlay from "../components/SelectedGridOverlay";
import {
  setCurrentPatient,
  setPatientImages,
} from "../redux/slices/patientSlice";
const windowWidth = Dimensions.get("window").width;
import { combinedData, askForDermoScopy } from "../utils";
import FastImage from "react-native-fast-image";
/* -------------------- Aspect Ratios (FULL removed as requested) -------------------- */
const ASPECT_RATIOS = {
  '16:9': '16:9',
  '4:3': '4:3',
  '1:1': '1:1',
};

const RATIO_ORDER = [
  ASPECT_RATIOS['16:9'],
  ASPECT_RATIOS['4:3'],
  ASPECT_RATIOS['1:1'],
];

const RATIO_VALUES = {
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '1:1': 1,
};

const CameraGrid = (props) => {
  const dispatch = useDispatch();
  const cameraRef = useRef(null);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [zoomLevel, setZoomLevel] = useState(1);
  const provider = useSelector((state) => state.auth.cloudType);
  const [activeZoom, setActiveZoom] = useState(false);
  const [activeAspectRatio, setActiveAspectRatio] = useState("");
  const [visible, setIsVisible] = useState(false);
  const [loacalImageArr, setLocalImageArr] = useState([]);
  const patientId = useSelector((state) => state.auth.patientId.patientId);
  const patientFullId = useSelector(
    (state) => state.patient?.currentActivePatient?._id
  );
  const patientName = useSelector(
    (state) => state.auth.patientName.patientName
  );
  const token = useSelector((state) => state.auth?.user);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const opacity = useSharedValue(0.5);
  const [percentage, setPercentage] = useState(50);

  const toggleZoom = () => {
    setActiveZoom((prev) => !prev);
    setZoomLevel((prev) => (prev === 1 ? 2 : 1)); // Example zoom toggle logic
  };

  const [cameraPermission, setCameraPermission] = useState(null);
  const [deletedPopup, setDeletePopup] = useState(false);
  const [selectedImgIndex, setSelectedImgIndex] = useState(-1);

  const [selectedCategory, setSelectedCategory] = useState(1); // Set default to 1 for Grid category
  const [selectedGridItem, setSelectedGridItem] = useState(null); // Track the selected grid item
  const [imageSource, setImageSource] = useState("");
  const [capturedImages, setCapturedImages] = useState([]); // Array to store captured images
  const [images, setImages] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false); // Track if the front camera is active

  const [uploadFileToDropbox] = useUploadSingleFileToDropboxMutation();
  const [updatePatient] = useUpdatePatientMutation();

  const [ghostImage, setGhostImage] = useState(null);
  const [selectedGhostImage, setSelectedGhostImage] = useState(null);


  const device = useCameraDevice(isFrontCamera ? "front" : "back");
  const changeAspectRatio = (ratio) => {
    setActiveAspectRatio((prev) => (prev === ratio ? "4:3" : ratio)); // Toggle between current and default
  };
  // new====================
  const { width: screenWidth } = useWindowDimensions();
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS['1:1']);
  const targetRatio = RATIO_VALUES[selectedRatio];

  const format = useCameraFormat(device, [
    // Highest possible video resolution first
    { videoResolution: 'max' },
    // Then enforce the desired aspect ratio for preview (video) and photo
    { videoAspectRatio: targetRatio },
    { photoAspectRatio: targetRatio },
    // Highest FPS as bonus
    { fps: 'max' },
  ]);

  useEffect(() => {
    if (format) {
      console.log(`Ratio: ${selectedRatio} → Format:`, {
        video: `${format.videoWidth}x${format.videoHeight}`,
        photo: `${format.photoWidth}x${format.photoHeight}`,
      });
    } else {
      console.log('No suitable format found for', selectedRatio);
    }
  }, [format, selectedRatio]);
  let height = screenWidth * targetRatio;

  // end new====================

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  useEffect(() => {
    if (props.route.params?.preScreen == "Image_View") {
      setGhostImage(props.route.params?.selectedImgItem);
      setSelectedGhostImage(props.route.params?.selectedImgItem);
      setSelectedCategory(6);
    } else {
      setGhostImage(null);
      setSelectedGhostImage(null);
      setSelectedCategory(1);
    }

    if (props.route.params?.imageData?.length > 0) {
      let providerType = props.route.params?.provider;
      providerType == "google"
        ? setImages(props.route.params?.imageData)
        : setImageUrls(props.route.params?.imageData);
    }
  }, [props.route.params]);

  useFocusEffect(
    useCallback(() => {
      setPercentage(50);
      setSelectedGridItem(combinedData[0].data[0]);
    }, [])
  );

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

  const activePatient = useSelector(
    (state) => state.patient?.currentActivePatient
  );

  const capturePhoto = async () => {
    if (loacalImageArr.length >= 5) return false;
    if (cameraRef.current !== null) {
      let photo = await cameraRef.current.takePhoto({
        quality: 0.5,
        skipMetadata: true,
      });

      let fileJson = {};

      if (!photo.path.startsWith("file://")) {
        photo.path = `file://${photo.path}`;
      }

      provider === "google"
        ? (fileJson.webContentLink = photo.path)
        : (fileJson.publicUrl = photo.path);
      let uniqueKey = generateUniqueKey();
      let imageName = `${patientName}_${uniqueKey}.jpg`;
      fileJson.path = photo.path;
      fileJson.uri = photo.path;
      fileJson.type = "image/jpeg";
      fileJson.name = imageName;
      console.log("loacalImageArr 207", fileJson);

      if (selectedCategory == 7) {
        askForDermoScopy(
          () => makrCircleFun(fileJson),
          () => campareFun(fileJson)
        );
        return;
      }
      setImageSource(photo.path);
      setLocalImageArr((prevImages) => [fileJson, ...prevImages]);

      if (ghostImage) {
        setIsVisible(true);
      }
    }
  };

  const makrCircleFun = (image) => {
    let imgs = provider === "google" ? images : imageUrls;
    navigate("MarkableImage", { image, images: imgs }); // 👈 send captured image
  };

  const campareFun = (image) => {
    setImageSource(image.path);
    let imgs = provider === "google" ? images : imageUrls;
    console.log("imgsimgs", imgs);

    // setLocalImageArr((prevImages) => [image, ...prevImages]);
    navigate("CollageDermoscopy", { image, images: imgs }); // 👈 send captured image
  };

  const updatePatientImage = async (imgData) => {
    let id = activePatient?._id;
    const formData = new FormData();
    let imgUri = await CompressImage.compress(imgData.uri, {
      compressionMethod: "auto",
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.1,
    });
    formData.append("profile", {
      uri: imgUri,
      name: imgData.name || "profile.jpg",
      type: imgData.type || "image/jpeg",
    });

    fetch(`${configUrl.BASE_URL}updatepatient/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    })
      .then((response) => response.json())
      .then((json) => {
        if (json?.ResponseBody?.profileImage)
          dispatch(setCurrentPatient(json?.ResponseBody));
      })
      .catch((error) => {
        console.error("upload error--------", error);
      });
  };

  useEffect(() => {
    if (
      capturedImages.length > 0 &&
      capturedImages.length == loacalImageArr.length
    ) {
      navigate(ScreenName.IMAGE_VIEWER, {
        preData: capturedImages,
        ScreenName: "camera",
      });
      setLocalImageArr([]);
      setCapturedImages([]);
      setImageSource("");
    }
  }, [capturedImages]);

  const subscription = useSelector((state) => state.auth?.subscription);
  const needSubscription = !subscription?.hasSubscription || !subscription?.isActive || subscription?.isExpired;

  const _chooseFile = async () => {
    // if (needSubscription) {
    //   showSubscriptionAlert(navigate);
    //   return;
    // }
    if (loacalImageArr?.length <= 0) {
      Alert.alert(
        "Validation Error",
        "Please capture at least one image first."
      );
      return;
    }
    try {
      setLoading(true);
      console.log("loacalImageArr length", loacalImageArr.length);

      if (provider == "google") {
        await checkAndRefreshGoogleAccessToken(accessToken);
        const patientInfo = {
          patientId,
          patientName,
        };
        const uploadedFileIds = await uploadCaptureFilesToPhotoMedFolder(
          loacalImageArr,
          patientInfo,
          accessToken
        );
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
        let imgss = [...images, ...uploadedImages];
        setImages((prevImages) => [...prevImages, ...uploadedImages]);
        setCapturedImages((prevImages) => [...prevImages, ...uploadedImages]);
        dispatch(setPatientImages(imgss));
        saveImageCount(imgss?.length || 0);
      } else {
        // Dropbox upload======================
        for (let file of loacalImageArr) {
          let result = await uploadFileToDropbox({
            file,
            userId: patientName + patientId,
            accessToken,
          }).unwrap();
          // Ensures the promise resolves properly
          let publicUrl = await getDropboxFileUrl(
            result.path_display,
            accessToken
          );
          result = { ...result, publicUrl };
          setImageUrls((prevImages) => [...prevImages, result]);
          setCapturedImages((prev) => [result, ...prev]);
          let imgss = [result, ...imageUrls];
          saveImageCount(imgss.length || 0);
        }
      }
      if (!activePatient?.profileImage) {
        await updatePatientImage(loacalImageArr[0]);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert("Something went wrong,Please try again later");
      console.log("verrorerror", error);
    }
  };

  const toggleCamera = () => {
    setIsFrontCamera((prevState) => !prevState); // Toggle between front and back camera
  };

  // Request camera permission when the component mounts
  useEffect(() => {
    (async () => {
      const permission = await Camera.requestCameraPermission();
      setCameraPermission(permission);
    })();
  }, []);

  if (cameraPermission === null) {
    return (
      <View style={styles.centeredFull}>
        <Text style={[styles.txtStyle, styles.loadingText]}>Loading...</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centeredFull}>
        <Text style={styles.txtStyle}>No Camera Available</Text>
      </View>
    );
  }

  // Function to get data based on selected category
  const getCategoryData = () => {
    const category = combinedData.find((item) => item.id === selectedCategory);
    return category ? category.data : [];
  };

  const onPressCollage = async () => {
    setIsVisible(false);
    if (ghostImage) {
      // Get the last image from the capturedImages array
      const lastCapturedImage = loacalImageArr[loacalImageArr.length - 1];

      // Create an array with the last captured image and the ghost image
      const updatedImages = [lastCapturedImage, ghostImage];
      console.log(updatedImages, lastCapturedImage, ghostImage, "asdasdas");

      // Update the state
      // setCapturedImages([...capturedImages, ghostImage]);
      setGhostImage(null); // Reset ghostImage
      navigate(ScreenName.COLLAGE_ADD, { images: updatedImages });
    }
  };

  const onLocalImageRemove = () => {
    let imgArr = [...loacalImageArr];
    let arr = imgArr.filter((_, index) => index != selectedImgIndex);
    if (arr.length > 0) {
      setImageSource(arr[arr.length - 1].path);
    } else {
      setImageSource("");
    }
    setLocalImageArr(arr);
    setDeletePopup(false);
    setSelectedImgIndex(-1);
  };

  return (
    <WrapperContainer wrapperStyle={styles.wrapper}>
      <Loading visible={loading} />
      <TouchableOpacity onPress={() => goBack()} style={styles.backIconcontainer}>
        <Image
          style={styles.backIcon}
          source={require("../assets/images/icons/backIcon.png")}
        />
      </TouchableOpacity>
      {/* camera view================ */}
      {device && (
        <View style={styles.flex1}>

          <View style={styles.cameraWrapper}>
            <Camera
              style={StyleSheet.absoluteFill }
              ref={cameraRef}
              device={device}
              format={format}
              isActive={true}
              photo={true}
              resizeMode="contain"
            />
            {selectedGridItem &&
              selectedCategory !== 6 &&
              selectedGridItem?.message && (
                <CustToast height={height} message={selectedGridItem.message} />
              )}
            <SelectedGridOverlay
              selectedGridItem={selectedGridItem}
              selectedCategory={selectedCategory}
              height={height}
              width={windowWidth}
            />
            {ghostImage && (
              <Animated.View
                style={[styles.overlayImage, { windowWidth, height }, animatedStyle]}
              >
                <FastImage
                  source={{
                    uri:
                      provider === "google"
                        ? ghostImage?.webContentLink
                        : ghostImage?.publicUrl,
                  }}
                  style={[styles.overlayImage, { windowWidth, height }]}
                />
              </Animated.View>
            )}
          </View>

        </View>
      )}
{/* buttons----------------------- */}
      <View style={styles.footerAbsolute}>

        {
          activeAspectRatio &&
          <View style={[styles.controls]}>
            {RATIO_ORDER.map((ratio) => (
              <TouchableOpacity
                key={ratio}
                onPress={() => setSelectedRatio(ratio)}
                style={styles.button}
              >
                <Text style={styles.ratioTextWhite}>{ratio}</Text>
              </TouchableOpacity>
            ))}
          </View>
        }
        {/* Camera Controls */}
        <View style={[commonStyles.flexView, styles.controlsWrapper]}>
          <View style={styles.controlCenter}>
            <TouchableOpacity
              onPress={toggleZoom}
              style={[styles.actionBtn, activeZoom ? styles.actionBtnActive : styles.actionBtnInactive]}
            >
              <SearchIcon
                tintColor={activeZoom ? COLORS.whiteColor : COLORS.primary}
                height={19.13}
                width={19.13}
              />
            </TouchableOpacity>
            <Text style={styles.txtStyle}>2x</Text>
          </View>
          {
            !Platform.isPad && <View style={styles.controlCenter}>
              <TouchableOpacity
                disabled={
                  selectedCategory === 1 || selectedCategory === 6 ? false : true
                }
                onPress={() => changeAspectRatio("1:1")}
                style={[styles.actionBtn, activeAspectRatio ? styles.actionBtnActive : styles.actionBtnInactive]}
              >
                <ScaleIcon
                  tintColor={
                    activeAspectRatio ? COLORS.whiteColor : COLORS.primary
                  }
                  height={19.13}
                  width={19.13}
                />
              </TouchableOpacity>
              <Text style={styles.txtStyle}>{selectedRatio}</Text>
            </View>
          }
        </View>

        {/* Camera Capture Buttons */}
        <View style={styles.captureControls}>
          <TouchableOpacity
            disabled={loacalImageArr?.length < 1 ? true : false}
            onPress={() => {
              _chooseFile();
            }}
            style={[styles.actionBtn, styles.uploadBtn, { marginTop: verticalScale(40) }]}
          >
            <Image style={styles.uploadImage} source={{ uri: `file://'${imageSource}` }} />
            <Image style={styles.uploadArrow} source={require(`../assets/images/upload_arrow.png`)} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => capturePhoto()}
            style={styles.captureContainer}
          >
            <View style={styles.capture} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleCamera} style={styles.camBtn}>
            <Image style={styles.switchIcon} source={require("../assets/images/icons/switch.png")} />
          </TouchableOpacity>
        </View>


        {selectedCategory !== 6 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[commonStyles.flexView, styles.gridScrollContent]}
          >
            {getCategoryData().map((item) => (
              <TouchableOpacity
                key={item.id + "ImgData"}
                style={[styles.iconContainer, selectedGridItem?.id === item.id && styles.iconSelected]}
                onPress={() => setSelectedGridItem(item)} // Set the selected grid item
              >
                <item.icon />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.centerGhostWrapper}>
            {selectedCategory === 6 && (
              <View style={styles.ghostContainer}>
                <FlatList
                  horizontal
                  data={(provider === "google"
                    ? [...(images || [])]
                    : [...(imageUrls || [])]
                  )?.reverse()}
                  keyExtractor={(item, index) =>
                    index.toString() + "ghost_image"
                  } // Add a keyExtractor
                  renderItem={({ item }) => {
                    if (!item) return null; // Ensure no undefined items
                    return (
                      <TouchableOpacity
                        onPress={() => {
                          setGhostImage(item);
                          setSelectedGhostImage(item);
                        }}

                      >
                        <View style={selectedGhostImage === item ? styles.ghostItemSelected : styles.ghostItem}>
                          <ImageWithLoader
                            uri={
                              provider === "google"
                                ? item.webContentLink
                                : item.publicUrl
                            }
                            style={[
                              styles.ghostImg,

                            ]}
                          />
                        </View>

                      </TouchableOpacity>
                    );
                  }}
                />

                {images?.length || imageUrls?.length > 0 ? (
                  <View style={[commonStyles.flexView, styles.ghostControls]}>
                    {ghostImage && (
                      <>
                        <View>
                          <GhostIcon height={25} width={25} />
                          <Text style={styles.percentageText}>{percentage}%</Text>
                        </View>
                        <Slider
                          style={styles.slider}
                          minimumValue={0}
                          maximumValue={1}
                          step={0.01}
                          value={opacity.value}
                          onValueChange={(value) => {
                            opacity.value = value;
                            setPercentage(Math.round(value * 100));
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
                        titleStyle={styles.customBtnTitle}
                        btnStyle={styles.customBtn}
                        title={"Select Ghost Photo"}
                      />
                    )}
                  </View>
                ) : (
                  <Text style={[styles.txtStyle, styles.noPhotoText]}>No Photo Available.</Text>
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
              key={item.id + "CategorySelection"}
              onPress={() => {
                setSelectedCategory(item.id);
                setSelectedGridItem(item.data[0]);

                if (item.id !== 6) {
                  setPercentage(50);
                  setGhostImage(null);
                  setSelectedGhostImage(null);
                }

                if (selectedCategory !== 1 || selectedCategory !== 6) {
                  setActiveAspectRatio(false);
                  setAspectRatio("1:1");
                  setSelectedRatio(ASPECT_RATIOS['1:1'])
                }
              }}
              style={[styles.category, item.id === selectedCategory && styles.categoryActive]}
            >
              <Text style={[styles.txtStyle, styles.categoryText]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <DeleteImagePopUp
        title={`Delete photo`}
        onPressCancel={() => setDeletePopup(false)}
        onPressDelete={() => {
          onLocalImageRemove();
        }}
        visible={deletedPopup}
      />

      <DeleteImagePopUp
        title={`Create a collage of the photo with the ghost photo?`}
        subtitle=""
        onPressCancel={() => setIsVisible(false)}
        cancel="No"
        deleteTxt="Yes"
        onPressDelete={onPressCollage}
        visible={visible}
      />
    </WrapperContainer>
  );
};

export default CameraGrid;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  backIcon: { height: 40, width: 40 },
  cameraWrapper: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: '#fff'
  },
  camera: {
    flex: 1,
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
    marginTop: verticalScale(40)
  },
  capture: {
    height: 46,
    width: 46,
    borderRadius: 46,
    borderColor: COLORS.whiteColor,
    borderWidth: 5,
  },
  aestheticsContainer: {
    ...commonStyles.flexView,
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    marginTop: verticalScale(10),
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
    // alignItems: 'center', // Center content
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
    width: windowWidth,
    // position: "absolute", // Make the image overlay the camera
    // top: 0,
    // left: 0,
    // right: 0,
    // bottom: 0,
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
  /* added styles for moved inline styles */
  wrapper: {
    flex: 1,
  },
  centeredFull: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  flex1: { flex: 1 },
  footerAbsolute: {
    marginBottom: 10,
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    left: 0,
    right: 0,
  },
  ratioTextWhite: { color: '#fff' },
  controlsWrapper: {
    alignSelf: "center",
    marginTop: verticalScale(10),
    width: Platform.isPad ? "12%" : "20%",
    justifyContent: Platform.isPad ? "center" : "space-between",
  },
  controlCenter: {
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnActive: {
    backgroundColor: COLORS.primary,
    zIndex: 9,
  },
  actionBtnInactive: {
    backgroundColor: COLORS.white,
    zIndex: 9,
  },
  captureControls: {
    justifyContent: "space-between",
    padding: moderateScale(10),
    alignItems: 'center',
    flexDirection: 'row',
    width: "100%",
  },
  uploadBtn: { height: 42, width: 42 },
  uploadImage: { height: 42, width: 42, borderRadius: 10, zIndex: 10 },
  uploadArrow: { height: 22, width: 22, borderRadius: 8, position: 'absolute', zIndex: 999, tintColor: '#fff' },
  switchIcon: { height: 21, width: 21, tintColor: COLORS.whiteColor },
  gridScrollContent: { alignSelf: "center", marginLeft: 10, width: "100%", justifyContent: "center" },
  centerGhostWrapper: { justifyContent: "center", alignItems: "center" },
  ghostContainer: { height: verticalScale(90), alignItems: "center" },
  ghostItem: { marginHorizontal: 5, borderRadius: 5, overflow: "hidden" },
  ghostItemSelected: { marginHorizontal: 5, borderRadius: 5, overflow: "hidden", borderColor: COLORS.primary, borderWidth: 2 },
  ghostControls: { marginTop: 10, alignSelf: "center" },
  percentageText: { color: COLORS.textColor, fontSize: 12, fontFamily: FONTS.medium },
  customBtnTitle: { fontSize: 10 },
  customBtn: { height: 30, width: "30%", marginBottom: verticalScale(8) },
  noPhotoText: { marginBottom: 20, color: COLORS.textColor, fontFamily: FONTS.bold, fontSize: 14 },
  iconSelected: { borderWidth: 1, borderColor: COLORS.primary },
  categoryActive: { borderBottomWidth: 2.4 },
  categoryText: { fontSize: 12 },

  backIconcontainer: { padding: 10, position: "absolute", left: 10, zIndex: 999, borderRadius: 100 },
});
