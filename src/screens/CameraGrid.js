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
import Grid33 from "../assets/SvgIcons/Grid33";
import Grid44 from "../assets/SvgIcons/Grid44";
import GridBorder from "../assets/SvgIcons/GridBorder";
import FrontFace from "../assets/SvgIcons/Face/FrontFace";
import LeftFace from "../assets/SvgIcons/Face/LeftFace";
import FrontNeck from "../assets/SvgIcons/Neck/FrontNeck";
import LeftNeck from "../assets/SvgIcons/Neck/LeftNeck";
import CustToast from "../components/CustToast";
import BackTrio from "../assets/SvgIcons/Trichology/BackTrio";
import { navigate } from "../navigators/NavigationService";
import ScreenName from "../configs/screenName";
import Loading from "../components/Loading";
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import Slider from "@react-native-community/slider";
import GhostIcon from "../assets/SvgIcons/GhostIcon";
import CrossIcon from "../assets/SvgIcons/CrossIcon";
import LeftBody from "../assets/SvgIcons/body/LeftBody";
import ColordBody from "../assets/SvgIcons/body/ColordBody";
import RightBody from "../assets/SvgIcons/body/RightBody";
import BackBody from "../assets/SvgIcons/body/BackBody";
import SlightLeftBody from "../assets/SvgIcons/body/SlightLeftBody";
import SlightRightBody from "../assets/SvgIcons/body/SlightRightBody";
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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Image as ImageResizer } from "react-native-compressor";
import SelectedGridOverlay from "../components/SelectedGridOverlay";
import imagePaths from "../assets/images";
import { setCurrentPatient, setPatientImages } from "../redux/slices/patientSlice";
import FastImage from "react-native-fast-image";
import Orientation from "react-native-orientation-locker";
const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;



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

  const changeAspectRatio = (ratio) => {
    setActiveAspectRatio((prev) => (prev === ratio ? "4:3" : ratio)); // Toggle between current and default
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value, // Control opacity based on slider value
    };
  });

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

  const activePatient = useSelector((state) => state.patient?.currentActivePatient);

  const updatePatientImage = async (imgData) => {
    let id = activePatient?._id;
    const formData = new FormData();
    let imgUri = await ImageResizer.compress(imgData.uri, {
      compressionMethod: "auto",
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.1,
    });
    formData.append('profile', {
      uri: imgUri,
      name: imgData.name || "profile.jpg",
      type: imgData.type || "image/jpeg",
    });

    fetch(`${configUrl.BASE_URL}updatepatient/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    })
      .then(response => response.json())
      .then(json => {
        if (json?.ResponseBody?.profileImage) dispatch(setCurrentPatient(json?.ResponseBody));
      })
      .catch(error => {
        console.error('upload error--------', error);
      });
  };


  const capturePhoto = async () => {
    if (loacalImageArr.length >= 5) return false
    if (cameraRef.current !== null) {
      let photo = await cameraRef.current.takePhoto({
        quality: 0.5,
        skipMetadata: true,
      });
      setImageSource(photo.path);

      let fileJson = {};

      if (!photo.path.startsWith('file://')) {
        photo.path = `file://${photo.path}`;
      }
      provider === "google" ? fileJson.webContentLink = photo.path : fileJson.publicUrl = photo.path
      let uniqueKey = generateUniqueKey();
      let imageName = `${patientName}_${uniqueKey}.jpg`;
      fileJson.path = photo.path;
      fileJson.uri = photo.path;
      fileJson.type = "image/jpeg";
      fileJson.name = imageName;
      console.log('loacalImageArr 207', fileJson);
      setLocalImageArr((prevImages) => [fileJson, ...prevImages]);

      if (ghostImage) {
        setIsVisible(true);
      }
    }
  };

  useEffect(() => {
    if (capturedImages.length > 0 && capturedImages.length == loacalImageArr.length) {
      navigate(ScreenName.IMAGE_VIEWER, {
        preData: capturedImages,
        ScreenName: "camera",
      });
      setLocalImageArr([])
      setCapturedImages([]);
      setImageSource('')
    }
  }, [capturedImages]);



  const _chooseFile = async () => {
    console.log('activePatient', activePatient);

    if (loacalImageArr?.length <= 0) {
      Alert.alert("Validation Error", "Please capture at least one image first.");
      return;
    }
    try {
      setLoading(true)
      console.log('loacalImageArr length', loacalImageArr.length)

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
        await updatePatientImage(loacalImageArr[0])
      }
      setLoading(false)

    } catch (error) {
      setLoading(false)
      Alert.alert('Something went wrong,Please try again later')
      console.log('verrorerror', error);
    }
  }

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
    { id: 6, name: "Ghost Photo", data: [] },
  ];

  const device = useCameraDevice(isFrontCamera ? "front" : "back");
  let { width } = useWindowDimensions();

  const aspectRatios = {
    "16:9": 16 / 9,
    "4:3": 4 / 3,
    "1:1": 1 / 1,
  };

  const height = width * aspectRatios[aspectRatio];

  const format = useCameraFormat(device, [
    { photoAspectRatio: aspectRatios[aspectRatio] },
    { photoResolution: Math.max(width, height) },
  ]);

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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={[styles.txtStyle, { fontSize: 16 }]}>Loading...</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
      console.log(updatedImages, lastCapturedImage, ghostImage, 'asdasdas');

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
      setImageSource('');
    }
    setLocalImageArr(arr);
    setDeletePopup(false)
    setSelectedImgIndex(-1)
  }



  return (
    <WrapperContainer wrapperStyle={{ flex: 1 }}>
      <Loading visible={loading} />

      <DeleteImagePopUp
        title={`Delete photo`}
        onPressCancel={() => setDeletePopup(false)}
        onPressDelete={() => { onLocalImageRemove() }}
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
      {device && (
        <View style={{ flex: 1 }}>
          <View
            style={[
              { width, height, alignItems: "center", overflow: "hidden" },
            ]}
          >
            <Camera
              ref={cameraRef}
              style={[
                { width, height, alignItems: "center", overflow: "hidden" },
              ]}
              device={device}
              isActive={true}
              format={format}
              photo={true}
              zoom={zoomLevel}
              preset="photo"
              ratio
            />

            {selectedGridItem &&
              selectedCategory != 6 &&
              selectedGridItem?.message && (
                <CustToast height={height} message={selectedGridItem.message} />
              )}

            <SelectedGridOverlay
              selectedGridItem={selectedGridItem}
              selectedCategory={selectedCategory}
              height={height}
              width={width}
            />
          </View>

          {/* Overlay Image */}
          {ghostImage && (
            <Animated.View style={[styles.overlayImage, { width, height }, animatedStyle]}>
              <FastImage
                source={{
                  uri: provider == "google"
                    ? ghostImage?.webContentLink
                    : ghostImage?.publicUrl,
                }}
                style={[styles.overlayImage, { width, height }, animatedStyle]}
              />
            </Animated.View>
          )}
        </View>
      )}
      {/* Footer View */}
      <View style={{ marginBottom: 10 }}>

        {
          loacalImageArr.length > 0 && <View style={{ flexDirection: "row", justifyContent: 'center' }}>
            {
              loacalImageArr.map((item, index) => {
                return <TouchableOpacity onLongPress={() => { setDeletePopup(true); setSelectedImgIndex(index) }} style={{
                  height: 30,
                  width: 30,
                  borderRadius: 5,
                  marginHorizontal: 6,
                  overflow: 'hidden'
                }}>
                  <Image
                    style={{
                      height: '100%',
                      width: '100%',
                    }}
                    source={{
                      uri: item.path,
                    }}
                  />
                </TouchableOpacity>
              })

            }
          </View>
        }
        {activeAspectRatio && (
          <View style={[styles.controls]}>
            <TouchableOpacity
              onPress={() => setAspectRatio("1:1")}
              style={styles.button}
            >
              <Text style={styles.buttonText}>1:1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAspectRatio("4:3")}
              style={styles.button}
            >
              <Text style={styles.buttonText}>4:3</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAspectRatio("16:9")}
              style={styles.button}
            >
              <Text style={styles.buttonText}>16:9</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Camera Controls */}
        <View
          style={[
            commonStyles.flexView,
            { alignSelf: "center", marginTop: verticalScale(10) },
          ]}
        >
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <TouchableOpacity
              onPress={toggleZoom}
              style={[
                styles.actionBtn,
                {
                  marginRight: moderateScale(10),
                  backgroundColor: activeZoom ? COLORS.primary : COLORS.white,
                },
              ]}
            >
              <SearchIcon
                tintColor={activeZoom ? COLORS.whiteColor : COLORS.primary}
                height={19.13}
                width={19.13}
              />
            </TouchableOpacity>
            <Text style={styles.txtStyle}>2x</Text>
          </View>
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <TouchableOpacity
              disabled={
                selectedCategory == 1 || selectedCategory == 6 ? false : true
              }
              onPress={() => changeAspectRatio("1:1")}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: activeAspectRatio
                    ? COLORS.primary
                    : COLORS.white,
                },
              ]}
            >
              <ScaleIcon
                tintColor={
                  activeAspectRatio ? COLORS.whiteColor : COLORS.primary
                }
                height={19.13}
                width={19.13}
              />
            </TouchableOpacity>
            <Text style={styles.txtStyle}>{aspectRatio}</Text>
          </View>
        </View>

        {/* Camera Capture Buttons */}
        <View
          style={[
            commonStyles.flexView,
            { justifyContent: "space-between", padding: moderateScale(10) },
          ]}
        >
          <TouchableOpacity
            disabled={loacalImageArr?.length < 1 ? true : false}
            onPress={() => {
              _chooseFile()
            }}
            style={[styles.actionBtn, { height: 42, width: 42 }]}
          >
            <Image
              style={{
                height: 42, width: 42, borderRadius: 10, zIndex: 10
              }}
              source={{
                uri: `file://'${imageSource}`,
              }}
            />
            <Image
              style={{
                height: 22, width: 22, borderRadius: 8, position: 'absolute', zIndex: 999
              }}
              source={require(`../assets/images/upload_arrow.png`)}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => capturePhoto()}
            style={styles.captureContainer}
          >
            <View style={styles.capture}></View>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleCamera} style={styles.camBtn}>
            <Image
              style={{ height: 21, width: 21, tintColor: COLORS.whiteColor }}
              source={require("../assets/images/icons/switch.png")}
            />
          </TouchableOpacity>
        </View>

        {/* Render Grid Items */}
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
                key={item.id + "ImgData"}
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
              <View style={{ height: verticalScale(90), alignItems: "center" }}>
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
                        <ImageWithLoader
                          uri={
                            provider === "google"
                              ? item.webContentLink
                              : item.publicUrl
                          }
                          style={[
                            styles.ghostImg,
                            selectedGhostImage === item && {
                              borderColor: COLORS.primary,
                              borderWidth: 2,
                            },
                          ]}
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
              key={item.id + "CategorySelection"}
              onPress={() => {
                setSelectedCategory(item.id);
                setSelectedGridItem(item.data[0]);

                if (item.id != 6) {
                  setPercentage(50);
                  setGhostImage(null);
                  setSelectedGhostImage(null);
                }

                if (selectedCategory != 1 || selectedCategory != 6) {
                  setActiveAspectRatio(false);
                  setAspectRatio("1:1");
                }
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
    </WrapperContainer>
  );
};

export default CameraGrid;

const styles = StyleSheet.create({
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
    position: "absolute", // Make the image overlay the camera
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
    marginHorizontal: 5,
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
