import {
  Image,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import WrapperContainer from "../components/WrapperContainer";
import { moderateScale, verticalScale } from "../styles/responsiveLayoute";
import commonStyles from "../styles/commonStyles";
import ImageCollege from "../assets/SvgIcons/ImageCollege";
import COLORS from "../styles/colors";
import FONTS from "../styles/fonts";
import DeleteImagePopUp from "../components/DeleteImagePopUp";
import SearchIcon from "../assets/SvgIcons/SearchIcon";
import Border from "../assets/SvgIcons/Border";
import CollagePhotosIcon from "../assets/SvgIcons/CollagePhotosIcon";
import FrontNeck from "../assets/SvgIcons/Neck/FrontNeck";
import { useNavigation, useRoute } from "@react-navigation/native";
import ImageWithLoader from "../components/ImageWithLoader";
import { navigate } from "../navigators/NavigationService";
import ScreenName from "../configs/screenName";
import ViewShot from "react-native-view-shot";
import RNFS from "react-native-fs";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import {
  checkAndRefreshGoogleAccessToken,
  setFilePublic,
  uploadFilesToPhotoMedFolder,
  getImageDetailsById,
  getDropboxFileUrl,
  generateUniqueKey,
} from "../configs/api";
import { useDispatch, useSelector } from "react-redux";
import Loading from "../components/Loading";
import {
  useUpdatePatientMutation,
  useUploadFileToDropboxMutation,
} from "../redux/api/common";
import Gestures from "react-native-easy-gestures";
import { imagePath } from "../configs/imagePath";
import { setPatientImages } from "../redux/slices/patientSlice";
const COLLAGE_LAYOUTS = [
  { id: "1", layout: [[1, 1]] },
  { id: "2", layout: [[1], [1]] },
  { id: "3", layout: [[1, 1, 1]] },
  { id: "4", layout: [[1], [1], [1]] },
  {
    id: "5", // Custom layout
    layout: [
      [1, 2],
      [1, 1],
    ],
    isCustom: true,
  },
  {
    id: "6", // Inverted custom layout
    layout: [
      [2, 1],
      [1, 1],
    ],
    isCustom: true,
  },
];

const CollageAdd = (props) => {
  const route = useRoute();
  const dispatch = useDispatch();
  const collageRef = React.useRef();
  const accessToken = useSelector((state) => state?.auth?.accessToken);
  const patientId = useSelector((state) => state.auth.patientId.patientId);
  const patientName = useSelector((state) => state.auth.patientName.patientName);
  const provider = useSelector((state) => state.auth.cloudType);
  const selectedImage = route?.params?.selectedImage; // Get the selected image object
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState(props?.route?.params?.images || []);
  const [isCapturingImage, setIsCapturingImage] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null); // State to manage the selected image index
  const [isEmpty, setIsEmpty] = useState(false);
  const [uploadFileToDropbox] = useUploadFileToDropboxMutation();
  // console.log('Example images',images); // Example log
  const patientImages = useSelector((state) => state?.patient?.patientImages);
  const [updatePatient] = useUpdatePatientMutation();
  const patientFullId = useSelector(
    (state) => state.patient?.currentActivePatient?._id
  );
  const token = useSelector((state) => state.auth?.user);

  const navigation = useNavigation();

  const [selected, setSelected] = useState(null); // Track selected tool
  const [selectedCollage, setSelectedCollage] = useState(
    images.length < 3 ? "1" : "3"
  ); // Track selected layout
  const [visible, setIsVisible] = useState(false);

  React.useEffect(() => {
    if (selectedImage) {
      setImages((prevList) => [...prevList, selectedImage]);
    }
  }, [selectedImage]);

  useEffect(() => {
    // Call checkIsEmpty whenever selectedCollage or images change
    const updatedIsEmpty = checkIsEmpty(selectedCollage, images);
    setIsEmpty(updatedIsEmpty);
  }, [selectedCollage, images]);

  function checkIsEmpty(collageType, images) {
    if (
      ((collageType === "1" || collageType === "2") && images.length < 2) ||
      (collageType !== "1" && collageType !== "2" && images.length < 3)
    ) {
      return true;
    }
    return false;
  }
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

  const handleSavePress = async () => {
    console.log('selectedImageIndexselectedImageIndex', selectedImageIndex);
    console.log('collageRefcollageRef', collageRef);

    if (selectedImageIndex) {
      setSelectedImageIndex(null);
    }

    try {
      // Set loading and capturing states
      setIsCapturingImage(true);
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Capture the photo using the camera reference
      if (collageRef?.current) {
        let photo = await collageRef?.current?.capture({
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
          console.log('vailidTokenvailidToken', vailidToken);
          const uploadedFileIds = await uploadFilesToPhotoMedFolder(
            fileDetails,
            patientInfo,
            accessToken
          );
          console.log('uploadedFileIdsuploadedFileIds', uploadedFileIds);

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
          let imgss = [...uploadedImages, ...patientImages];
          dispatch(setPatientImages(imgss));
          saveImageCount(imgss?.length || 0);
          navigation.goBack();
          setLoading(false);
        } else if (provider === "dropbox") {
          let uniqueKey = generateUniqueKey();
          let imageName = `${patientName}_${uniqueKey}.jpg`;
          let result = await uploadFileToDropbox({
            file: fileDetails[0],
            userId: patientName + patientId,
            accessToken,
            imageName,
          }).unwrap();

          const publicUrl = await getDropboxFileUrl(
            result.path_display,
            accessToken
          );
          result = { ...result, publicUrl };
          navigation.goBack();
        } else {
          await saveToGallery(photo.path);
        }
      } else {
        alert('Something went wrong Please try again')
      }

      setLoading(false);
      setIsCapturingImage(false);
    } catch (error) {
      console.error("Error during save operation:", error);
      setLoading(false);
      setIsCapturingImage(false);
    }
  };

  async function hasAndroidPermission() {
    const permission =
      Platform.Version >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

    const hasPermission = await PermissionsAndroid.check(permission);
    if (hasPermission) {
      return true;
    }

    const status = await PermissionsAndroid.request(permission);
    return status === "granted";
  }

  const saveToGallery = async (uri) => {
    try {
      // Check for Android permissions before saving the image
      if (Platform.OS === "android" && !(await hasAndroidPermission())) {
        return;
      }

      // Define the destination path for saving the image
      const destPath = `${RNFS.PicturesDirectoryPath
        }/collage_${Date.now()}.jpg`;

      // Copy the captured image to the destination path
      await RNFS.copyFile(uri, destPath);

      // Save the image to the gallery
      await CameraRoll.save(destPath, { type: "photo", album: "DCIM/Camera" });

      // console.log('Collage saved and gallery refreshed:', destPath);
    } catch (error) {
      // console.log('Error saving collage to gallery:', error);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <>
          <TouchableOpacity
            disabled={isEmpty == true ? true : false}
            onPress={handleSavePress}
            style={[
              styles.btnContainer,
              { backgroundColor: isEmpty == true ? "#D3D3D3" : COLORS.primary },
            ]}
          >
            <Text style={styles.txtStyle}>Save</Text>
          </TouchableOpacity>
        </>
      ),
    });
  }, [navigation, isEmpty, selectedCollage]);

  const handleSlotClick = (imageIndex) => {
    navigate(ScreenName.SELECT_PHOTO, {
      imageIndex, // Pass the index to select the correct image slot
    });
  };

  const swapImages = (index1, index2) => {
    const updatedImages = [...images];
    // Swap the images at the given indices
    const temp = updatedImages[index1];
    updatedImages[index1] = updatedImages[index2];
    updatedImages[index2] = temp;
    setImages(updatedImages);
  };

  const renderImageSlot = (imageIndex) => {
    const image = images[imageIndex];
    const isFirst = imageIndex === 0;
    const isLast = imageIndex === images.length - 1;
    const isColumnLayout = selectedCollage === "2" || selectedCollage === "4";
    const hasBorder = selected === "Border";

    const handlePreviousArrowClick = () => {
      if (!isFirst || selectedCollage === "5" || selectedCollage === "6") {
        swapImages(imageIndex, imageIndex - 1);
      }
    };

    const handleNextArrowClick = () => {
      if (!isLast || selectedCollage === "5" || selectedCollage === "6") {
        swapImages(imageIndex, imageIndex + 1);
      }
    };

    return image ? (
      <View
        style={[
          { flex: 1, overflow: "hidden", height: "100%", width: "100%" },
          hasBorder && { borderWidth: 2, borderColor: COLORS.primary },
        ]}
      >
        <Gestures
          draggable={selectedImageIndex !== imageIndex}
          rotatable={selectedImageIndex !== imageIndex}
          scalable={{ min: 1, max: 5 }}
          style={{ height: "100%", width: "100%" }}
        >
          <TouchableOpacity
            delayLongPress={300}
            onLongPress={() => setSelectedImageIndex(imageIndex)}
            onPress={() => {
              if (selectedImageIndex === imageIndex) {
                setSelectedImageIndex(null);
              }
            }}
          >
            <ImageWithLoader
              uri={
                provider === "google" ? image.webContentLink : image.publicUrl
              }
              style={[
                { width: "100%", height: "100%" }, // Default styles
                // Add border if 'Border' is selected
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Gestures>
        {selectedImageIndex === imageIndex && (
          <>
            {/* Special Case: selectedCollage === '6' */}
            {selectedCollage === "6" ? (
              <>
                {/* Special Case: selectedCollage === '6' */}
                {/* Previous Arrow */}
                {!isFirst && (
                  <TouchableOpacity
                    onPress={handlePreviousArrowClick}
                    style={{
                      position: "absolute",
                      top: selectedImageIndex != 2 ? "50%" : "15%",
                      left: selectedImageIndex != 2 ? 40 : 15,
                      zIndex: 10,
                      transform: [{ translateY: 80 }],
                    }}
                  >
                    <Image
                      source={imagePath.backIcon}
                      style={{
                        height: 40,
                        width: 40,
                        transform: [
                          {
                            rotate: selectedImageIndex != 2 ? "-90deg" : "0deg",
                          },
                        ], // Point up
                      }}
                    />
                  </TouchableOpacity>
                )}

                {/* Next Arrow */}
                {!isLast && (
                  <TouchableOpacity
                    onPress={handleNextArrowClick}
                    style={{
                      position: "absolute",
                      bottom: selectedImageIndex != 0 ? 20 : 200,
                      right: selectedImageIndex != 0 ? "30%" : "30%",
                      zIndex: 10,
                      transform: [{ translateX: 20 }],
                    }}
                  >
                    <Image
                      source={imagePath.backIcon}
                      style={{
                        height: 40,
                        width: 40,
                        transform: [
                          {
                            rotate:
                              selectedImageIndex != 0 ? "180deg" : "90deg",
                          },
                        ], // Point down
                      }}
                    />
                  </TouchableOpacity>
                )}
              </>
            ) : selectedCollage === "5" ? (
              <>
                {/* Special Case: selectedCollage === '5' */}
                {/* Up Arrow */}
                {!isFirst && (
                  <TouchableOpacity
                    onPress={handlePreviousArrowClick}
                    style={{
                      position: "absolute",
                      top: selectedImageIndex != 1 ? 10 : 120,
                      right: "50%",
                      zIndex: 10,
                      transform: [{ translateX: -20 }],
                    }}
                  >
                    <Image
                      source={imagePath.backIcon}
                      style={{
                        height: 40,
                        width: 40,
                        transform: [
                          {
                            rotate: selectedImageIndex != 1 ? "90deg" : "0deg",
                          },
                        ], // Point right
                      }}
                    />
                  </TouchableOpacity>
                )}

                {/* Right Arrow */}
                {!isLast && (
                  <TouchableOpacity
                    onPress={handleNextArrowClick}
                    style={{
                      position: "absolute",
                      top: selectedImageIndex != 1 ? "50%" : "85%",
                      right: selectedImageIndex != 1 ? 10 : 50,
                      zIndex: 10,
                      transform: [{ translateY: -20 }],
                    }}
                  >
                    <Image
                      source={imagePath.backIcon}
                      style={{
                        height: 40,
                        width: 40,
                        transform: [
                          {
                            rotate:
                              selectedImageIndex != 1 ? "180deg" : "270deg",
                          },
                        ], // Point left
                      }}
                    />
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                {/* Default Arrows for Other Collages */}
                {/* Previous Arrow */}
                {!isFirst && (
                  <TouchableOpacity
                    onPress={handlePreviousArrowClick}
                    style={{
                      position: "absolute",
                      top: isColumnLayout ? 10 : "50%",
                      left: isColumnLayout ? "50%" : 10,
                      zIndex: 10,
                      transform: [
                        { translateX: isColumnLayout ? -20 : 0 },
                        { translateY: isColumnLayout ? 0 : -20 },
                      ],
                    }}
                  >
                    <Image
                      source={imagePath.backIcon}
                      style={{
                        height: 40,
                        width: 40,
                        transform: [
                          isColumnLayout
                            ? { rotate: "90deg" }
                            : { rotate: "0deg" },
                        ],
                      }}
                    />
                  </TouchableOpacity>
                )}

                {/* Next Arrow */}
                {!isLast && (
                  <TouchableOpacity
                    onPress={handleNextArrowClick}
                    style={{
                      position: "absolute",
                      bottom: isColumnLayout ? 10 : "50%",
                      right: isColumnLayout ? "50%" : 10,
                      zIndex: 10,
                      transform: [
                        { translateX: isColumnLayout ? -20 : 0 },
                        { translateY: isColumnLayout ? 0 : -20 },
                      ],
                    }}
                  >
                    <Image
                      source={imagePath.backIcon}
                      style={{
                        height: 40,
                        width: 40,
                        transform: [
                          { rotate: isColumnLayout ? "270deg" : "180deg" },
                        ],
                      }}
                    />
                  </TouchableOpacity>
                )}
              </>
            )}
          </>
        )}
      </View>
    ) : (
      <TouchableOpacity onPress={() => handleSlotClick(imageIndex)}>
        <CollagePhotosIcon />
      </TouchableOpacity>
    );
  };

  const renderCustomCollage = (id) => {
    const slots = [0, 1, 2, 3];
    return (
      <View style={styles.customCollageContainer}>
        {id === "5" && (
          <>
            <View style={[styles.imageContainer, styles.fullHeight]}>
              {renderImageSlot(slots[0])}
            </View>
            <View style={styles.column}>
              <View style={[styles.imageContainer, styles.halfHeight]}>
                {renderImageSlot(slots[1])}
              </View>
              <View style={[styles.imageContainer, styles.halfHeight]}>
                {renderImageSlot(slots[2])}
              </View>
            </View>
          </>
        )}
        {id === "6" && (
          <>
            <View style={styles.column}>
              <View style={[styles.imageContainer, styles.halfHeight]}>
                {renderImageSlot(slots[1])}
              </View>
              <View style={[styles.imageContainer, styles.halfHeight]}>
                {renderImageSlot(slots[0])}
              </View>
            </View>
            <View style={[styles.imageContainer, styles.fullHeight]}>
              {renderImageSlot(slots[2])}
            </View>
          </>
        )}
      </View>
    );
  };

  const renderSelectedCollage = () => {
    const layout = COLLAGE_LAYOUTS.find((l) => l.id === selectedCollage);
    if (!layout) return null;

    if (layout.isCustom) {
      return renderCustomCollage(layout.id);
    }

    return (
      <>
        {layout.layout.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((colFlex, colIndex) => (
              <View
                key={colIndex}
                style={[styles.imageContainer, { flex: colFlex }]}
              >
                {renderImageSlot(rowIndex * row.length + colIndex)}
              </View>
            ))}
          </View>
        ))}
      </>


    );
  };

  const CollageLayout1 = ({ onPress }) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.layoutContainer1,
          { borderWidth: selectedCollage == "1" ? 2 : 0 },
        ]}
      >
        <FrontNeck height={15} width={11} />
        <View style={styles.verticalDevider} />
        <FrontNeck height={15} width={11} />
      </TouchableOpacity>
    );
  };

  const CollageLayout2 = ({ onPress }) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.layoutContainer1,
          {
            flexDirection: "column",
            paddingHorizontal: 0,
            padding: 2,
            borderWidth: selectedCollage == "2" ? 2 : 0,
          },
        ]}
      >
        <FrontNeck height={15} width={11} />
        <View style={styles.horizontalDevider} />
        <FrontNeck height={15} width={11} />
      </TouchableOpacity>
    );
  };
  const CollageLayout3 = ({ onPress }) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.layoutContainer1,
          { borderWidth: selectedCollage == "3" ? 2 : 0 },
        ]}
      >
        <FrontNeck height={15} width={11} />
        <View style={styles.verticalDevider} />
        <FrontNeck height={15} width={11} />
        <View style={styles.verticalDevider} />
        <FrontNeck height={15} width={11} />
      </TouchableOpacity>
    );
  };
  const CollageLayout4 = ({ onPress }) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.layoutContainer1,
          {
            flexDirection: "column",
            paddingHorizontal: 0,
            borderWidth: selectedCollage == "4" ? 2 : 0,
          },
        ]}
      >
        <FrontNeck height={12} width={8} />
        <View style={styles.horizontalDevider} />
        <FrontNeck height={12} width={8} />
        <View style={styles.horizontalDevider} />
        <FrontNeck height={12} width={8} />
      </TouchableOpacity>
    );
  };

  const CollageLayout5 = ({ onPress }) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.layoutContainer1,
          {
            paddingHorizontal: 0,
            justifyContent: "space-between",
            borderWidth: selectedCollage == "5" ? 2 : 0,
          },
        ]}
      >
        <View style={{ flex: 1, alignItems: "center" }}>
          <FrontNeck height={12} width={8} />
        </View>
        <View style={styles.verticalDevider} />
        <View style={{ width: "100%", alignItems: "center", flex: 1 }}>
          <FrontNeck height={12} width={8} />
          <View style={styles.horizontalDevider} />
          <FrontNeck height={12} width={8} />
        </View>
      </TouchableOpacity>
    );
  };

  const CollageLayout6 = ({ onPress }) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.layoutContainer1,
          {
            paddingHorizontal: 0,
            justifyContent: "space-between",
            borderWidth: selectedCollage == "6" ? 2 : 0,
          },
        ]}
      >
        <View style={{ width: "100%", alignItems: "center", flex: 1 }}>
          <FrontNeck height={12} width={8} />
          <View style={styles.horizontalDevider} />
          <FrontNeck height={12} width={8} />
        </View>
        <View style={styles.verticalDevider} />
        <View style={{ flex: 1, alignItems: "center" }}>
          <FrontNeck height={12} width={8} />
        </View>
      </TouchableOpacity>
    );
  };

  const CommonTool = ({ title, onPress, Icon, isSelected, style }) => (
    <View style={{ justifyContent: "center", alignItems: "center", ...style }}>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.iconContainer,
          isSelected && { backgroundColor: COLORS.primary },
        ]}
      >
        {Icon}
      </TouchableOpacity>
      <Text style={styles.titleTxt}>{title}</Text>
    </View>
  );

  const setSelectedCollageType = (collageType) => {
    setSelectedCollage(collageType);
    // Delete the last image only if collageType is '1' or '2' and images length > 2
    if ((collageType === "1" || collageType === "2") && images.length > 2) {
      const updatedImages = images.slice(0, -1); // Creates a new array without the last element
      setImages(updatedImages);
    }
    checkIsEmpty(collageType, images);
  };

  const handleCollagePress = async (type) => {
    setSelectedCollageType(type);
  };

  return (
    <WrapperContainer>
      <Loading visible={loading} />
      <DeleteImagePopUp
        onPressCancel={() => setIsVisible(false)}
        onPressDelete={() => setIsVisible(false)}
        visible={visible}
      />
      <ViewShot ref={collageRef} style={styles.collageContainer}>

        {renderSelectedCollage()}
      </ViewShot>
      {!isCapturingImage && (
        <>
          <View style={[commonStyles.flexView, styles.toolsContainer]}>
             
            <CommonTool
              style={{ marginHorizontal: moderateScale(15) }}
              onPress={() => setSelected("College")}
              isSelected={selected === "College"}
              title="Layout"
              Icon={
                <ImageCollege
                  tintColor={
                    selected === "College" ? COLORS.whiteColor : "#32327C"
                  }
                />
              }
            />
            <CommonTool
              onPress={() => setSelected("Border")}
              isSelected={selected === "Border"}
              title="Border"
              Icon={
                <Border
                  tintColor={
                    selected === "Border" ? COLORS.whiteColor : "#32327C"
                  }
                />
              }
            />
          </View>
          {selected === "College" && (
            <View
              style={[
                commonStyles.flexView,
                {
                  justifyContent: "space-between",
                  paddingHorizontal: moderateScale(17),
                },
              ]}
            >
              <CollageLayout1 onPress={() => handleCollagePress("1")} />
              <CollageLayout2 onPress={() => handleCollagePress("2")} />
              <CollageLayout3 onPress={() => handleCollagePress("3")} />
              <CollageLayout4 onPress={() => handleCollagePress("4")} />
              <CollageLayout5 onPress={() => handleCollagePress("5")} />
              <CollageLayout6 onPress={() => handleCollagePress("6")} />
            </View>
          )}
        </>
      )}
    </WrapperContainer>
  );
};

export default CollageAdd;

const styles = StyleSheet.create({
  collageContainer: {
    //   flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "70%", // Set a fixed height
  },
  customCollageContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: "70%", // Match the height of collageContainer
  },
  row: {
    flexDirection: "row",
    flex: 1,
  },
  column: {
    flex: 1,
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#dcdcdc",
    flex: 1, // Ensure equal distribution
    margin: 0.5,
  },
  halfHeight: {
    flex: 1, // Use flex for equal distribution
  },
  fullHeight: {
    flex: 1,
    // backgroundColor:'red'
  },
  toolsContainer: {
    padding: moderateScale(20),
    alignSelf: "center",
    paddingTop: verticalScale(40),
  },
  collageSelectionContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: moderateScale(17),
  },
  layoutContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: COLORS.greyBgColor,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: moderateScale(5),
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
  preview: {
    flexDirection: "row",
    justifyContent: "center",
  },
  btnContainer: {
    backgroundColor: COLORS.primary,
    width: moderateScale(80),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 40,
    paddingVertical: 10
  },
  txtStyle: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.whiteColor,
  },
  layoutContainer1: {
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
});
