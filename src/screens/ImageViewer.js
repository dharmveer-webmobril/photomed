import {
  Alert,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Share,
  useWindowDimensions,
} from "react-native";
import React, { useRef, useState } from "react";
import { moderateScale, verticalScale } from "../styles/responsiveLayoute";
import commonStyles from "../styles/commonStyles";
import DetailsIcon from "../assets/SvgIcons/DetailsIcon";
import ImageCollege from "../assets/SvgIcons/ImageCollege";
import COLORS from "../styles/colors";
import FONTS from "../styles/fonts";
import FilterIcon from "../assets/SvgIcons/FilterIcon";
import ReframeIcon from "../assets/SvgIcons/ReframeIcon";
import ShareIcon from "../assets/SvgIcons/ShareIcon";
import DeleteIcon from "../assets/SvgIcons/DeleteIcon";
import { goBack, navigate } from "../navigators/NavigationService";
import ScreenName from "../configs/screenName";
import DeleteImagePopUp from "../components/DeleteImagePopUp";
import GhostIcon from "../assets/SvgIcons/GhostIcon";
import { useDeleteFileFromDropboxMutation, useDeleteImageMutation } from "../redux/api/common";
import Toast from "react-native-simple-toast";
import { useDispatch, useSelector } from "react-redux";
import Loading from "../components/Loading";
import FaceDetection from "@react-native-ml-kit/face-detection";
import RNFS from "react-native-fs";
import { Image as ImageResizer } from "react-native-compressor";
import { setPatientImages } from "../redux/slices/patientSlice";
import { SwiperFlatList } from 'react-native-swiper-flatlist';
import ImageZoom from 'react-native-image-pan-zoom';
import FastImage from "react-native-fast-image";
import ImageWithLoader from "../components/ImageWithLoader";
const { width, height } = Dimensions.get('window');

const CommonComp = ({
  title,
  onPress = () => { },
  Icon,
  isSelected,
  isDisabled = false,
}) => {
  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[
          styles.iconContainer,
          isSelected && { backgroundColor: COLORS.primary },
        ]}
      >
        {Icon && Icon}
      </TouchableOpacity>
      <Text style={styles.titleTxt}>{title}</Text>
    </View>
  );
};
const ZoomSwiper = (props) => {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const patientImages = useSelector((state) => state?.patient?.patientImages);
  const provider = useSelector((state) => state.auth.cloudType);
  const isConnected = useSelector((state) => state.network.isConnected);

  const [deleteFile, { isLoading: loaded, isError, isSuccess }] = useDeleteFileFromDropboxMutation();
  const [deleteImage, { isLoading }] = useDeleteImageMutation();
  const screen = props.route.params.ScreenName;
  const preData = props.route.params.preData;
  const swiperRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [visible, setIsVisible] = useState(false);

  const handleNext = () => {
    if (currentIndex < preData.length - 1) {
      swiperRef?.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      swiperRef?.current?.scrollToIndex({ index: currentIndex - 1 });
      setCurrentIndex(currentIndex - 1);
    }
  };



  const errorAlert = () => {
    Alert.alert(
      "No Face Detected",
      "Cannot zoom to a face part as no face was detected."
    );
  };

  const downloadImage = async (imageUrl) => {
    try {
      let new_date = new Date();
      const filePath = `${RNFS.DocumentDirectoryPath
        }/image${new_date.getTime()}.jpg`; // Save to app-specific directory
      const downloadResult = await RNFS.downloadFile({
        fromUrl: imageUrl,
        toFile: filePath,
      }).promise;
      console.log("Download completed:", downloadResult);
      return filePath.replace("file://", "");
    } catch (error) {
      setLoading(false);
      errorAlert();
      console.error("Error downloading image:", error);
      return null;
    }
  };

  const preprocessAndCompressImage = async (uri) => {
    if (Platform.OS === "ios") {
      try {
        let compressedImageUri = await ImageResizer.compress(uri, {
          compressionMethod: "auto",
          maxWidth: 1080,
          quality: 0.7,
        });
        return compressedImageUri;
      } catch (error) {
        console.error("Error during compression:", error);
        return null;
      }
    } else {
      return uri;
    }
  };

  const btnFilterPress = async () => {
    const imageUri =
      provider == "google"
        ? preData[currentIndex].webContentLink
        : preData[currentIndex].publicUrl;
    setLoading(true);
    let localFilePath = await downloadImage(imageUri);
    if (!localFilePath) {
      setLoading(false);
      errorAlert();
      return;
    }

    let imageData = {};
    const compressedImage = await preprocessAndCompressImage(
      `file://${localFilePath}`
    );
    if (!compressedImage) {
      setLoading(false);
      errorAlert();
      return;
    }
    localFilePath = `file://${localFilePath}`;
    console.log("localFilePath", localFilePath);
    Image.getSize(
      compressedImage,
      (width, height) => {
        imageData.height = height;
        imageData.width = width;
        imageData.path = localFilePath;
        console.log("sucess getting image size:", width, height);
      },
      (error) => {
        setLoading(false);
        errorAlert();
        console.log("Error getting image size:", error);
      }
    );

    FaceDetection.detect(compressedImage, {
      landmarkMode: "all",
      contourMode: "all",
    })
      .then(async (result) => {
        console.log("facesssss success 118", result);
        setLoading(false);
        if (result.length <= 0) {
          errorAlert();
          return false;
        }
        navigate("ImageZoomML", { imageData: imageData, faces: result });
      })
      .catch((error) => {
        setLoading(false);
        console.log("facesssss error 472", error);
        errorAlert();
      });
  };

  const btnCollagePress = () => {
    setSelected("Collage");
    const item = preData[currentIndex];
    const imageDetails =
      provider === "google"
        ? {
          id: item.id,
          mimeType: item.mimeType,
          name: item.name,
          webContentLink: item.webContentLink,
          // other relevant fields
        }
        : {
          id: item.id, // Assuming item has a 'path_display' field in the other provider
          mimeType: item.mimeType,
          name: item.name,
          publicUrl: item.publicUrl,
          // other relevant fields for the second provider
        };

    navigate(ScreenName.COLLAGE_ADD, {
      selectedImage: imageDetails,
      preData: preData,
    });
  };

  const onReframePress = () => {
    setSelected("Reframe");
    const item = preData[currentIndex];
    const imageDetails =
      provider === "google"
        ? {
          id: item.id,
          mimeType: item.mimeType,
          name: item.name,
          webContentLink: item.webContentLink,
          // other relevant fields
        }
        : {
          id: item.id, // Assuming item has a 'path_display' field in the other provider
          mimeType: item.mimeType,
          name: item.name,
          publicUrl: item.publicUrl,
          path_display: item?.path_display,
          // other relevant fields for the second provider
        };
    navigate(ScreenName.FRAMING, { selectedImage: imageDetails });
  };

  const onShare = async () => {
    const imageUrl =
      provider == "google"
        ? preData[currentIndex].webContentLink
        : preData[currentIndex]?.publicUrl;
    try {
      const result = await Share.share({
        message: `Check out this amazing image! 📸 Here’s the link: ${imageUrl}`,
      });

      if (result.action === Share.sharedAction) {
        // Alert.alert('Shared Successfully', 'The link has been shared!');
      } else if (result.action === Share.dismissedAction) {
        // Handle dismissed action if necessary
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDelete = async () => {
    const imageToDelete = preData[currentIndex];
    if (!isConnected) {
      Toast.show("No internet connection. Please try again.");
      return;
    }
    try {
      setIsVisible(false);
      const imageToDelete = preData[currentIndex];
      if (provider == "google") {
        await deleteImage({ fileId: imageToDelete.id, accessToken }).unwrap();
        let pImg = [...patientImages];
        let filteredData = pImg.filter((val) => val.id != imageToDelete.id);
        dispatch(setPatientImages(filteredData));
      } else {
        setLoading(true);
        const response = await deleteFile({
          filePath: imageToDelete.path_display,
          accessToken,
        });
        await Promise.all(response);
        setLoading(false);
      }
      Toast.show("Image deleted successfully");
      screen == "gallery" ? goBack() : navigate(ScreenName.HOME);
    } catch (error) {
      setLoading(false);
      Toast.show("Something went wrong");
      console.error("Failed to delete image:", error);
    }
  };
  const { width, height } = useWindowDimensions();
  return (
    <View>
      <DeleteImagePopUp
        title={"Delete 1 selected photo"}
        onPressCancel={() => setIsVisible(false)}
        onPressDelete={handleDelete}
        visible={visible}
      />
      <Loading visible={isLoading || loading} />
      <SwiperFlatList showPagination={false} ref={swiperRef}
        scrollEnabled={false} >
        {preData.map((item, index) => {
          const imageUri = provider == "google" ? item.webContentLink : item.publicUrl
          return (
            <View key={index} style={{ width, height: height * 0.8, justifyContent: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", position: "absolute", width: "100%", zIndex: 999999, paddingHorizontal: 10 }}>
                <TouchableOpacity
                  onPress={handlePrev}
                  disabled={currentIndex === 0}
                  style={[
                    styles.button,
                    currentIndex === 0 && styles.buttonDisabled,
                  ]}
                >
                  <Text style={styles.buttonText}>◀</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleNext}
                  disabled={currentIndex === preData.length - 1}
                  style={[
                    styles.button,
                    currentIndex === preData.length - 1 && styles.buttonDisabled,
                  ]}
                >
                  <Text style={styles.buttonText}>▶</Text>
                </TouchableOpacity>
              </View>

              <ImageZoom
                cropWidth={width}
                cropHeight={height * 0.8}
                imageWidth={width}
                imageHeight={height * 0.7}
                enableSwipeDown={false}
              >
                <ImageWithLoader
                  uri={imageUri}
                  resizeMode={FastImage.resizeMode.contain}
                  style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                />
              </ImageZoom>
            </View>)
        })}
      </SwiperFlatList>
      <View>
        <View
          style={[
            commonStyles.flexView,
            { justifyContent: "space-between", padding: moderateScale(20) },
          ]}
        >
          <CommonComp
            onPress={() => {
              setSelected("Details");
              navigate(ScreenName.IMAGE_DETAILS, {
                images: screen === 'gallery' ? [preData[currentIndex]] : preData,
              });
            }}
            isSelected={selected === "Details"}
            title={"Details"}
            Icon={
              <DetailsIcon
                tintColor={selected == "Details" && COLORS.whiteColor}
              />
            }
          />
          <CommonComp
            onPress={() => btnCollagePress()}
            isSelected={selected === "Collage"}
            title={"Collage"}
            Icon={
              <ImageCollege
                tintColor={selected == "Collage" ? COLORS.whiteColor : "#32327C"}
              />
            }
          />
          <CommonComp
            onPress={() => btnFilterPress()}
            isSelected={selected === "Filter"}
            title={"Filter"}
            Icon={
              <FilterIcon tintColor={selected == "Filter" && COLORS.whiteColor} />
            }
          />
          <CommonComp
            onPress={onReframePress}
            isSelected={selected === "Reframe"}
            title={"Reframe"}
            Icon={
              <ReframeIcon
                tintColor={selected == "Reframe" && COLORS.whiteColor}
              />
            }
          />
          <CommonComp
            onPress={() => {
              onShare()
            }}
            isSelected={selected === "Share"}
            title={"Share"}
            Icon={
              <ShareIcon tintColor={selected == "Share" && COLORS.whiteColor} />
            }
          />
          <CommonComp
            onPress={() => {
              setIsVisible(true)
            }}
            isSelected={selected === "Delete"}
            title={"Delete"}
            Icon={
              <DeleteIcon tintColor={selected == "Delete" && COLORS.whiteColor} />
            }
          />
          <CommonComp
            onPress={() => {
              let img = [preData[currentIndex]];
              navigate(ScreenName.CAMERA_GRID, {
                preScreen: "Image_View",
                selectedImgItem: img[0],
                imageData: provider == "google" ? patientImages : imageUrls,
                provider,
              });
            }}
            isSelected={selected === "Ghost"}
            title={"Ghost"}
            Icon={
              <GhostIcon height={25} width={25} tintColor={selected == "Delete" && COLORS.whiteColor} />
            }
          />
        </View>
      </View>
    </View>
  );
};

export default ZoomSwiper;


const styles = StyleSheet.create({
  imgStyle: {
    marginVertical: verticalScale(20),

  },
  iconContainer: {
    height: 42,
    width: 42,
    borderRadius: 10,
    borderColor: COLORS.primary,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(5),
  },
  titleTxt: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    color: COLORS.primary,
  },
  layoutContainer: {
    width: 42,
    height: 42,
    borderColor: "#4F4793",
    borderRadius: 10,
    backgroundColor: COLORS.greyBgColor,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    paddingHorizontal: 3,
    marginHorizontal: moderateScale(5),
  },
  verticalDevider: {
    width: 0.8,
    height: "100%",
    backgroundColor: COLORS.blackColor,
  },
  horizontalDevider: {
    width: "100%",
    height: 1,
    backgroundColor: COLORS.blackColor,
  },
  highlightBox: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "red",
    backgroundColor: "rgba(255, 0, 0, 0.3)",
    borderRadius: 10,
  },

  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#4F4793',
    padding: 10,
    borderRadius: 10,
  },
  buttonDisabled: {
    backgroundColor: '#aaa',
  },
  buttonText: {
    fontSize: 22,
    color: '#fff',
  },
});
