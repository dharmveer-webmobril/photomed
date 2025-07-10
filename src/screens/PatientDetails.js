import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import WrapperContainer from "../components/WrapperContainer";
import commonStyles from "../styles/commonStyles";
import { height, moderateScale, verticalScale } from "../styles/responsiveLayoute";
import { imagePath } from "../configs/imagePath";
import CustomBtn from "../components/CustomBtn";
import PatientImageList from "../components/PatientImageList";
import FONTS from "../styles/fonts";
import COLORS from "../styles/colors";
import CollegeIcon from "../assets/SvgIcons/College";
import importIcon from "../assets/SvgIcons/Import";
import Tick from "../assets/SvgIcons/Tick";
import AddCamera from "../assets/SvgIcons/AddCamera";
import ImageCropPicker from "react-native-image-crop-picker";
import { goBack, navigate } from "../navigators/NavigationService";
import ScreenName from "../configs/screenName";
import {
  useDeleteFileFromDropboxMutation,
  useDeleteImageMutation,
  useGetAllImageUrlsQuery,
  useGetPatientDetailsQuery,
  useUpdatePatientMutation,
  useUploadFileToDropboxMutation,
} from "../redux/api/common";
import { useDispatch, useSelector } from "react-redux";
import Loading from "../components/Loading";
import {
  configUrl,
  getFolderId,
  uploadFilesToPhotoMedFolder,
  listFolderImages,
  setFilePublic,
  ensureValidAccessToken,
  checkAndRefreshGoogleAccessToken,
  getImageDetailsById,
  generateUniqueKey,
} from "../configs/api";
import DeleteImagePopUp from "../components/DeleteImagePopUp";
import ImageWithLoader from "../components/ImageWithLoader";
import Toast from "react-native-simple-toast";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logout, savePatientInfo } from "../redux/slices/authSlice";
import { storeData } from "../configs/helperFunction";
import { setPatientImages } from "../redux/slices/patientSlice";
const { width } = Dimensions.get("window");
import uuid from "react-native-uuid";
import { Colors } from "react-native/Libraries/NewAppScreen";

const PatientDetails = (props) => {
  const dispatch = useDispatch();
  const [selectedImages, setSelectedImages] = useState([]);
  const [images, setImages] = useState([]);
  const preData = props?.route?.params?.item;


  const fullId = preData._id;
  const trimmedId = fullId.slice(0, 5);
  const token = useSelector((state) => state.auth?.user);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const provider = useSelector((state) => state?.auth?.cloudType);
  const patientId = useSelector((state) => state?.auth?.patientId?.patientId);
  const patientImages = useSelector((state) => state?.patient?.patientImages);

  const patientName = useSelector(
    (state) => state?.auth?.patientName?.patientName
  );
  const {
    data: patientDetails,
    isLoading,
    isError: err,
  } = useGetPatientDetailsQuery({ token, id: preData._id });
  if (err?.data?.isDeleted || error?.data?.status === 2) {
    dispatch(logout());
  }

  const patient = patientDetails?.ResponseBody;
  const [collageImages, setCollageImage] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSelectionMode, setSelectionMode] = useState(false);
  const [visible, setIsVisible] = useState(false);
  const [updatePatient] = useUpdatePatientMutation();

  const [deleteImage, { isLoading: deleteImageLoading }] =
    useDeleteImageMutation();

  const {
    data: imageUrls = [],
    error,
    isLoading: load,
    refetch,
  } = useGetAllImageUrlsQuery({
    userId: `${preData.full_name}${trimmedId}` || "", // Default to empty string if undefined
    accessToken: accessToken || "",
  });

  const [uploadFileToDropbox] = useUploadFileToDropboxMutation();
  const [deleteFile, { isLoading: loaded }] = useDeleteFileFromDropboxMutation();

  const toggleImageSelection = (items, type = "default") => {
    const isGoogle = provider === "google";
    const getImagePath = (item) => (isGoogle ? item.id : item.path_display);

    let newSelectedImages = [...selectedImages];
    let newCollageImages = [...collageImages];

    const shouldRemove = type === "removeall";

    items.forEach((item) => {
      const imagePath = getImagePath(item);
      const isSelected = newSelectedImages.includes(imagePath);

      if (type === "default") {
        if (isSelected) {
          newSelectedImages = newSelectedImages.filter((img) => img !== imagePath);
          newCollageImages = newCollageImages.filter(
            (img) => getImagePath(img) !== imagePath
          );
        } else {
          newSelectedImages.push(imagePath);
          newCollageImages.push(item);
        }
      } else {
        if (shouldRemove) {
          newSelectedImages = newSelectedImages.filter((img) => img !== imagePath);
          newCollageImages = newCollageImages.filter((img) => getImagePath(img) !== imagePath);
        } else {
          if (!isSelected) {
            newSelectedImages.push(imagePath);
            newCollageImages.push(item);
          }
        }
      }
    });

    setSelectedImages(newSelectedImages);
    setCollageImage(newCollageImages);
    setSelectionMode(newSelectedImages.length > 0);
  };

  const saveCount = async (count) => {
    const id = preData._id;
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
      console.log("image count response", response);
    } catch (error) {
      console.error("Failed to add patient:", error);
    }
  };

  const selectAllImages = () => {
    const selectedImage = provider === "google" ? patientImages : imageUrls;

    if (selectedImages.length === selectedImage.length) {
      // Deselect all
      setSelectedImages([]);
      setCollageImage([]);
      setSelectionMode(false);
    } else {
      // Select all
      const allPaths = selectedImage.map((item) =>
        provider === "google" ? item.id : item.path_display
      );
      const allItems = selectedImage.map((item) => item);

      setSelectedImages(allPaths);
      setCollageImage(allItems);
      setSelectionMode(true);
    }
  };

  const fetchGoogleDriveImages = async () => {
    try {
      let vailidToken = await checkAndRefreshGoogleAccessToken(accessToken);

      // Step 1: Locate the "PhotoMed" folder
      const photoMedFolderId = await getFolderId("PhotoMed", accessToken);
      // console.log('abscd folder', photoMedFolderId);

      if (!photoMedFolderId) {
        console.error("PhotoMed folder not found");
        return;
      }

      console.log('photoMedFolderId', photoMedFolderId);

      // Step 2: Locate the patient folder inside "PhotoMed"
      const patientFolderId = await getFolderId(
        preData.full_name + trimmedId,
        accessToken,
        photoMedFolderId
      );

      console.log('adsda----', preData.full_name + trimmedId, photoMedFolderId, accessToken, patientFolderId);

      if (!patientFolderId) {
        console.error("Patient folder not found");
        saveCount(publicImages?.length ? publicImages?.length : null);
        return;
      }

      // Step 3: Locate the "All Images" folder inside the patient folder
      const allImagesFolderId = await getFolderId(
        "All Images",
        accessToken,
        patientFolderId
      );
      if (!allImagesFolderId) {
        console.error("All Images folder not found");
        return;
      }
      await storeData("patientFolderId", allImagesFolderId);
      // Step 4: Fetch images from the "All Images" folder
      const uploadedImages = await listFolderImages(
        allImagesFolderId,
        accessToken
      );

      const publicImages = await Promise.all(
        uploadedImages.map(async (image) => {
          const publicUrl = await setFilePublic(image.id, accessToken);
          return { ...image, publicUrl };
        })
      );

      publicImages?.length &&
        publicImages?.length &&
        dispatch(setPatientImages(publicImages));
      saveCount(publicImages?.length ? publicImages?.length : null);
    } catch (error) {
      setLoading(false);
      console.error("Error fetching Google Drive images:", error);
    }
  };

  const loadImages = async () => {
    setLoading(true);
    try {
      if (provider === "google") {
        await fetchGoogleDriveImages();
      } else {
        await ensureValidAccessToken(accessToken);
        saveCount(imageUrls?.length);
      }
    } catch (error) {
      // Handle error (e.g., alert user)
    } finally {
      setLoading(false);
    }
  };

  const setPatientId = async () => {
    const patientInfo = {
      patientId: trimmedId,
      fullId: preData._id,
      patientName: preData.full_name,
    };

    dispatch(savePatientInfo(patientInfo));
    await AsyncStorage.setItem("patientId", preData._id);
    await AsyncStorage.setItem("patientName", preData.full_name);
  };

  useEffect(() => {
    // setPatientId();
    loadImages();
  }, [accessToken, provider]);

  useFocusEffect(
    useCallback(() => {
      setPatientId();
      setSelectedImages([]);
      setCollageImage([]);
    }, [accessToken, provider])
  );

  const _chooseFile = async () => {
    try {
      // Step 1: Select and map files
      const fileDetails = await ImageCropPicker.openPicker({
        multiple: true,
        mediaType: "photo",
        cropping: true,
      });

      const mappedFileDetails = fileDetails.map((file) => ({
        uri: file.path,
        type: file.mime,
        name: file.filename || `${patientName}${Date.now()}.jpg`,
      }));

      // console.log('Mapped File Details:', mappedFileDetails);
      setLoading(true);

      // Step 2: Determine upload provider and process accordingly
      if (provider === "google") {
        // await ensureValidToken();
        await checkAndRefreshGoogleAccessToken(accessToken);
        await handleGoogleDriveUpload(mappedFileDetails);
      } else {
        await ensureValidAccessToken(accessToken);
        await handleDropboxUpload(mappedFileDetails);
      }
    } catch (error) {
      console.error("Error during file selection or upload:", error);
      // Optionally, handle user cancellation or display a message
      Toast.show(error.message || "User has cancelled the flow");
    } finally {
      setLoading(false); // Ensure loading is stopped regardless of success or error
    }
  };

  // Separate function for Google Drive uploads
  const handleGoogleDriveUpload = async (files) => {
    const patientInfo = {
      patientId,
      patientName,
    };
    try {
      // Ensure the file upload with folder structure creation
      const uploadedFileIds = await uploadFilesToPhotoMedFolder(
        files,
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

      let imgss = [...uploadedImages, ...patientImages];
      dispatch(setPatientImages(imgss));
      setLoading(false);
      saveCount(imgss?.length ? imgss?.length : 0);
    } catch (error) {
      console.error("Error in Google Drive upload:", error);
      throw error;
    }
  };

  // Separate function for Dropbox uploads

  const handleDropboxUpload = async (files) => {
    try {
      const uploadPromises = files.map(async (file, index) => {
        let uniqueKey = generateUniqueKey();
        let imageName = `${patientName}_${uniqueKey}.jpg`;
        const result = await uploadFileToDropbox({
          file,
          userId: preData.full_name + trimmedId,
          accessToken,
          imageName,
        }).unwrap(); // Ensures the promise resolves properly
        return result;
      });

      const uploadedResults = await Promise.all(uploadPromises);
      console.log("Uploaded files to Dropbox:", uploadedResults);
      const { data: refreshedImageUrls } = await refetch();
      console.log("refreshedImageUrlsrefreshedImageUrls", refreshedImageUrls);

      saveCount(refreshedImageUrls?.length || 0);
    } catch (error) {
      // console.error('Error in Dropbox upload:', error);
      throw error;
    }
  };

  const handleDeleteDropBox = async () => { 
    try {
      // Create delete promises for all selected images
      const deletePromises = selectedImages.map(async (filePath) => {
        const response = await deleteFile({
          filePath,
          accessToken,
        });
        // console.log('File deleted successfully:', response);
      });
      await Promise.all(deletePromises);
      const { data: refreshedImageUrls } = await refetch();

      saveCount(refreshedImageUrls == [] ? 0 : refreshedImageUrls?.length);
      setSelectedImages([]);
      setIsVisible(false);
      setCollageImage([]);
      // setSelectionMode(newSelectedImages.length > 0);
      // console.log('All files deleted successfully');
    } catch (error) {
      // console.error('Error deleting files:', error);
    }
  };

  const deleteGoogleDriveImages = async () => {
    let pImages = [...patientImages];
    try {
      setIsVisible(false);
      const deletePromises = selectedImages.map((id) =>
        deleteImage({ fileId: id, accessToken }).unwrap()
      );
      await Promise.all(deletePromises);
      let filteredData = pImages.filter(
        (val) => !selectedImages.includes(val.id)
      );
      dispatch(setPatientImages(filteredData));
      setSelectedImages([]);
      setCollageImage([]);
      saveCount(filteredData?.length ? filteredData?.length : 0);
      Toast.show("images deleted successfully");
    } catch (error) {
      console.error("Error deleting images:", error);
    }
  };

  const activePatient = useSelector((state) => state.patient?.currentActivePatient);
  const getProfileImage = () => {
    if (patient?.profileImage) {
      return configUrl.imageUrl + activePatient?.profileImage; // Existing profile image
    }
    return configUrl.defaultUser; // Default image
  };

  const navigateCameraGrid = () => {
    navigate(ScreenName.CAMERA_GRID, {
      preData: preData,
      imageData: provider == "google" ? patientImages : imageUrls,
      provider,
    });
  };

  const handleImagePress = (item, index, allData) => {
    if (isSelectionMode) {
      toggleImageSelection(item);
    } else {
      let arr = [...allData];
      if (index > -1 && index < arr.length) {
        const spliceData = arr.splice(index, 1)[0]; // Remove item
        arr.unshift(spliceData); // Add at the beginning
      }
      navigate(ScreenName.IMAGE_VIEWER, {
        preData: arr,
        accessToken,
        ScreenName: "gallery",
        imageData: provider == "google" ? patientImages : imageUrls,
      });
    }
  };

  const CommonComp = ({ IconComponent, title, onPress, commonContainer = null, titleStyle = null }) => {
    return (
      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <TouchableOpacity onPress={onPress} style={[styles.commonContainer, commonContainer]}>
          {IconComponent && <IconComponent />}
        </TouchableOpacity>
        <Text style={[styles.title, { fontSize: 10, color: COLORS.primary }, titleStyle]}>
          {title}
        </Text>
      </View>
    );
  };

  return (
    <WrapperContainer wrapperStyle={[{ padding: 15 }]}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => goBack()} style={{ marginLeft: 10 }}>
          <Image
            style={styles.backIcon}
            source={require('../assets/images/icons/backIcon.png')}
          />
        </TouchableOpacity>
        <Text style={{ fontSize: 15, color: '#424242',marginLeft:-30 }}>Patient Details</Text>
        <View/> 
      </View>
      <DeleteImagePopUp
        title={`Delete ${selectedImages.length} selected photo`}
        onPressCancel={() => setIsVisible(false)}
        onPressDelete={
          provider == "google" ? deleteGoogleDriveImages : handleDeleteDropBox
        }
        visible={visible}
      />
      <Loading visible={isLoading || loading || deleteImageLoading || loaded} />
      <View style={[commonStyles.shadowContainer, styles.cardContainer]}>
        <View style={[commonStyles.flexView, { justifyContent: "space-between", width: "100%" }]}>
          <View style={commonStyles.flexView}>
            <ImageWithLoader
              uri={getProfileImage()}
              style={styles.imgStyle} // You can pass a custom style if needed
            />
            <View style={{ flex: 1, paddingRight: 20 }}>
              <Text style={styles.title}>{patient?.full_name}</Text>
              <Text style={styles.info}>{patient?.dob}</Text>
              {patient?.mobile && (
                <Text style={styles.info}>{patient?.mobile}</Text>
              )}
              {patient?.email && (
                <Text style={styles.info}>{patient?.email}</Text>
              )}
            </View>
          </View>

        </View>
        <CustomBtn
          onPress={() =>
            navigate(ScreenName.EDIT_PATIENT, {
              patient,
              imageCount:
                provider == "google" ? images.length : imageUrls.length,
            })
          }
          titleStyle={{ fontSize: 10 }}
          btnStyle={{ width: 150, height: 30, marginTop: verticalScale(10) }}
          title={"Edit Patient Information"}
        />
      </View>
      <View style={styles.subContainer}>
        <View style={commonStyles.flexView}>
          <Image source={imagePath.gallery} style={styles.galStyle} />
          <Text style={styles.title}>All Photos</Text>
        </View>
        <Text style={styles.title}>
          {selectedImages?.length}/
          {provider == "google" ? patientImages?.length : imageUrls?.length}
        </Text>
      </View>
      {patientImages?.length >= 1 || imageUrls?.length >= 1 ? (
        <TouchableOpacity
          onPress={selectAllImages}
          style={[
            commonStyles.flexView,
            {
              alignItems: "center",
              justifyContent: "flex-end",
              paddingBottom: 5,
            },
          ]}
        >
          <View style={styles.check}>
            {selectedImages?.length ===
              (provider === "google"
                ? patientImages?.length
                : imageUrls?.length) && <Tick height={10} width={10} />}
          </View>
          <Text style={styles.title}>Select All</Text>
        </TouchableOpacity>
      ) : null}
      {patientImages?.length >= 1 || imageUrls?.length >= 1 ? (
        <View
          style={{
            alignItems: images?.length >= 3 ? "center" : null,
            justifyContent: "center",
            flex: 1,
          }}
        >
          <PatientImageList
            data={provider == "google" ? patientImages : imageUrls}
            selectedImages={selectedImages}
            selectAllImages={() => selectAllImages()}
            handleImagePress={(item, index, allData) => {
              handleImagePress(item, index, allData);
            }}
            toggleImageSelection={(item, type = 'default') => {
              toggleImageSelection(item, type);
            }}
          />
          <View style={styles.bottomBottonsWrapper}>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              <CustomBtn
                titleStyle={{ fontSize: 10 }}
                btnStyle={styles.bottomButtonsContainer}
                title={"Add Image"}
                onPress={_chooseFile}
              />
              <CustomBtn
                onPress={() => navigateCameraGrid()}
                titleStyle={{ fontSize: 10 }}
                btnStyle={styles.bottomButtonsContainer}
                title={"Camera"}
              />
              {selectedImages?.length >= 1 && (
                <CustomBtn
                  onPress={() => setIsVisible(true)}
                  titleStyle={{ fontSize: 10 }}
                  btnStyle={styles.bottomButtonsContainer}
                  title={"Delete"}
                />
              )}
              {selectedImages?.length > 0 && selectedImages?.length <= 3 && (
                <CustomBtn
                  onPress={() =>
                    navigate(ScreenName.COLLAGE_ADD, {
                      images: collageImages,
                      preData: preData,
                    })
                  }
                  titleStyle={{ fontSize: 10 }}
                  btnStyle={styles.bottomButtonsContainer}
                  title={"Add Collage"}
                />
              )}
              {selectedImages?.length > 1 && selectedImages?.length <= 5 && (
                <>
                  <CustomBtn
                    onPress={() => {
                      navigate(ScreenName.IMAGE_DETAILS, {
                        images: collageImages,
                      });
                    }}
                    titleStyle={{ fontSize: 10 }}
                    btnStyle={styles.bottomButtonsContainer}
                    title={"Add Tag"}
                  />
                  <View style={styles.bottomButtonsContainer} />
                </>
              )}
            </View>
          </View>
        </View>
      ) : (
        <View style={{ alignItems: "center" }}>
          <Text style={styles.info}>Upload your new photo</Text>
          <Text style={styles.info}>Number of upload images: 0</Text>
          <Text style={[styles.info, styles.subTitle]}>
            Click the below buttons to add patient photos
          </Text>
          <View
            style={[
              commonStyles.flexView,
              { justifyContent: "space-around", width: "80%", marginTop: 20 },
            ]}
          >
            <CommonComp
              onPress={() =>
                navigate(ScreenName.COLLAGE_ADD, { preData: preData })
              }
              title={"Collage"}
              IconComponent={CollegeIcon}
            />
            <CommonComp
              onPress={() => navigateCameraGrid()}
              title={"Camera"}
              commonContainer={{ height: 90, width: 90 }}
              titleStyle={{ fontSize: 14 }}
              IconComponent={AddCamera}
            />
            <CommonComp
              onPress={_chooseFile}
              title={"Import"}
              IconComponent={importIcon}
            />

          </View>
        </View>
      )}
    </WrapperContainer>
  );
};

export default PatientDetails;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",marginBottom:20
  },
  backIcon: {  height: 40, width: 40 },
  cardContainer: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(15),
    width: "100%",
  },
  imgStyle: {
    height: 75,
    width: 75,
    borderRadius: 75,
    marginRight: 10,
  },
  title: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textColor,
  },
  Filtertag: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.whiteColor,
  },
  info: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.textColor,
  },
  galStyle: {
    height: 25,
    width: 25,
    marginRight: moderateScale(10),
  },
  subContainer: {
    ...commonStyles.flexView,
    ...commonStyles.shadowContainer,
    width: "100%",
    justifyContent: "space-between",
    padding: moderateScale(10),
    marginVertical: verticalScale(15),
  },
  subTitle: {
    color: COLORS.placeHolderTxtColor,
    marginTop: verticalScale(60),
    marginBottom: 10,
    fontSize: 12,
  },
  commonContainer: {
    backgroundColor: COLORS.primary,
    height: 40,
    width: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(5),
  },
  check: {
    height: 18,
    width: 18,
    borderRadius: 5,
    borderColor: COLORS.primary,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(10),
    backgroundColor: "white",
  },
  bottomButtonsContainer: {
    width: "auto",
    height: 30,
    width: width * 0.25,
    marginHorizontal: width * 0.01,
    marginTop: 9,
  },
  bottomBottonsWrapper: {
    alignItems: "center",
    alignSelf: "center",
    position: "absolute",
    bottom: 0,
    width: "100%",
    alignSelf: "center",
  },
  filterButton: {
    paddingHorizontal: 10, paddingVertical: 5, backgroundColor: COLORS.primary, borderRadius: 10
  }
});
