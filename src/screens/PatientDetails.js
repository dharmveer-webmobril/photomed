import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WrapperContainer from "../components/WrapperContainer";
import commonStyles from "../styles/commonStyles";
import {
  moderateScale,
  verticalScale,
} from "../styles/responsiveLayoute";
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
import axios from "axios";
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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logout, savePatientInfo } from "../redux/slices/authSlice";
import { storeData } from "../configs/helperFunction";
import { setPatientImages } from "../redux/slices/patientSlice";
const { width } = Dimensions.get("window");
import uuid from "react-native-uuid";
import { showSubscriptionAlert } from "../configs/common/showSubscriptionAlert";
import { useGoogleDriveImages } from "../configs/hooks/getDriveImages";

// Styles need to be defined before CommonComp so it can access them
const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backIcon: { height: 40, width: 40 },
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  editInfoButton: {
    width: moderateScale(120),
    height: 30,
    marginTop: verticalScale(10),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commonCompWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  commonCompTitle: {
    fontSize: 10,
    color: COLORS.primary,
  },
  wrapperPadding: {
    padding: 15,
  },
  backButtonMargin: {
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 15,
    color: "#424242",
    marginLeft: -30,
  },
  cardHeaderRow: {
    justifyContent: "space-between",
    width: "100%",
  },
  patientInfoContainer: {
    flex: 1,
    paddingRight: 20,
  },
  titleStyleSmall: {
    fontSize: 10,
  },
  selectAllButton: {
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 5,
  },
  imageListWrapper: {
    justifyContent: "center",
    flex: 1,
  },
  imageListWrapperCentered: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  bottomButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  emptyStateContainer: {
    alignItems: "center",
  },
  emptyStateButtonsContainer: {
    justifyContent: "space-around",
    width: "80%",
    marginTop: 20,
  },
  cameraButtonTitle: {
    fontSize: 14,
  },
  dermoscopySection: {
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
    // paddingHorizontal: moderateScale(20),
  },
  bodyPartTitle: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textColor,
    marginBottom: verticalScale(6),
    textTransform: "capitalize",
  },
  dermoscopyImagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    // gap: moderateScale(10),
  },
  dermoscopyImagesContainer12: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(10),
  },
  dermoscopyImageWrapper: {
    width: (width - moderateScale(80)) / 3,
    height: (width - moderateScale(80)) / 3,
    marginBottom: moderateScale(8),
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: COLORS.placeHolderTxtColor + "20",
  },
  dermoscopyImage: {
    width: "100%",
    height: "100%",
  },
});

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
  const [patientProfileImages, setPatientProfileImages] = useState("");

  const [deleteImage, { isLoading: deleteImageLoading }] =
    useDeleteImageMutation();

  const {
    data: imageUrls = [],
    error,
    isLoading: load,
    refetch,
  } = useGetAllImageUrlsQuery({
    userId: `${preData.full_name}${trimmedId}` || "",
    accessToken: accessToken || "",
  });

  const [uploadFileToDropbox] = useUploadFileToDropboxMutation();
  const [deleteFile, { isLoading: loaded }] =
    useDeleteFileFromDropboxMutation();

  const [dermoscopyImagesList, setDermoscopyImagesList] = useState([]);
  const [isLoadingDermoscopy, setIsLoadingDermoscopy] = useState(false);
  const prevCombinedRef = useRef(null);
  const navigation = useNavigation();

  // Refs so focus callback always has latest values when returning from MarkableImage
  const preDataIdRef = useRef(preData?._id);
  const tokenRef = useRef(token);
  const providerRef = useRef(provider);
  useEffect(() => {
    preDataIdRef.current = preData?._id;
    tokenRef.current = token;
    providerRef.current = provider;
  }, [preData?._id, token, provider]);

  // Process API response into dermoscopy images list (used by axios fetch)
  const processDermoscopyResponse = useCallback((responseData, cloudProvider) => {
    if (!responseData?.ResponseBody || !Array.isArray(responseData.ResponseBody)) {
      return [];
    }
    const dermoscopyImages = [];
    responseData.ResponseBody.forEach((record) => {
      if (record.imageUrl) {
        let fullImageUrl = record.imageUrl;
        if (!fullImageUrl.startsWith("http")) {
          const baseUrl = configUrl.imageUrl.endsWith("/")
            ? configUrl.imageUrl.slice(0, -1)
            : configUrl.imageUrl;
          const imagePath = fullImageUrl.startsWith("/")
            ? fullImageUrl
            : `/${fullImageUrl}`;
          fullImageUrl = `${baseUrl}${imagePath}`;
        }
        const imageData = cloudProvider === "google"
          ? {
              id: record._id,
              name: record.dermoscopyImage || `dermoscopy_${record._id}.jpg`,
              mimeType: "image/jpeg",
              webContentLink: fullImageUrl,
              publicUrl: fullImageUrl,
              imageUrl: fullImageUrl,
              isDermoscopy: true,
              dermoscopyRecord: record,
              createdAt: record.createdAt,
              createdTime: record.createdAt,
            }
          : {
              id: record._id,
              name: record.dermoscopyImage || `dermoscopy_${record._id}.jpg`,
              path_display: fullImageUrl,
              publicUrl: fullImageUrl,
              imageUrl: fullImageUrl,
              isDermoscopy: true,
              dermoscopyRecord: record,
              server_modified: record.updatedAt || record.createdAt,
              updatedAt: record.updatedAt,
            };
        dermoscopyImages.push(imageData);
      }
    });
    return dermoscopyImages;
  }, []);

  // Fetch dermoscopy via axios (used on focus so list updates after adding circles in MarkableImage)
  const fetchDermoscopyData = useCallback(async () => {
    const patientId = preDataIdRef.current;
    const authToken = tokenRef.current;
    const cloudProvider = providerRef.current;
    if (!patientId || !authToken) return;
    const baseUrl = (configUrl.BASE_URL || "").replace(/\/?$/, "") + "/";
    const url = `${baseUrl}dermoscopy?patientId=${patientId}&cloudType=${cloudProvider}`;
    console.log("url url url url", url);
    console.log("url url url url", authToken);
    setIsLoadingDermoscopy(true);
    try {
      const { data } = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });
      // console.log("data data data data", JSON.stringify(data, null, 2));
      const list = processDermoscopyResponse(data, cloudProvider);
      setDermoscopyImagesList(list);
      prevCombinedRef.current = null; // force combined list to recompute
    } catch (err) {
      console.error("Error fetching dermoscopy:", err);
      setDermoscopyImagesList([]);
    } finally {
      setIsLoadingDermoscopy(false);
    }
  }, [processDermoscopyResponse]);

  // Combine regular images with dermoscopy images using useMemo with stable dependencies
  const regularImagesHash = useMemo(() => {
    const regularImages = provider === "google" ? (patientImages || []) : (imageUrls || []);
    // Create a hash from image IDs to detect changes
    return regularImages.map(img => provider === "google" ? img.id : img.path_display).join(',');
  }, [patientImages, imageUrls, provider]);

  const dermoscopyImagesHash = useMemo(() => {
    return dermoscopyImagesList.map(img => img.id).join(',');
  }, [dermoscopyImagesList]);

  const allImagesWithDermoscopy = useMemo(() => {
    const regularImages = provider === "google" ? (patientImages || []) : (imageUrls || []);
    const combined = [...dermoscopyImagesList, ...regularImages];
    
    // Check if the combined array is the same as previous using hash
    const currentHash = `${dermoscopyImagesHash}-${regularImagesHash}`;
    const prevHash = prevCombinedRef.current?.hash;
    
    if (prevHash === currentHash && prevCombinedRef.current?.combined) {
      // Array hasn't changed, return previous
      return prevCombinedRef.current.combined;
    }
    
    console.log("All Images Combined:", {
      dermoscopyCount: dermoscopyImagesList.length,
      regularCount: regularImages.length,
      totalCount: combined.length,
    });
    
    prevCombinedRef.current = { combined, hash: currentHash };
    return combined;
  }, [dermoscopyImagesList, dermoscopyImagesHash, regularImagesHash, patientImages, imageUrls, provider]);

  const toggleImageSelection = (items, type = "default") => {
    // Don't allow selection of dermoscopy images
    const filteredItems = Array.isArray(items) 
      ? items.filter(item => !item.isDermoscopy)
      : (!items.isDermoscopy ? [items] : []);

    if (filteredItems.length === 0) return;

    const isGoogle = provider === "google";
    const getImagePath = (item) => (isGoogle ? item.id : item.path_display);

    let newSelectedImages = [...selectedImages];
    let newCollageImages = [...collageImages];

    const shouldRemove = type === "removeall";

    filteredItems.forEach((item) => {
      const imagePath = getImagePath(item);
      const isSelected = newSelectedImages.includes(imagePath);

      if (type === "default") {
        if (isSelected) {
          newSelectedImages = newSelectedImages.filter(
            (img) => img !== imagePath
          );
          newCollageImages = newCollageImages.filter(
            (img) => getImagePath(img) !== imagePath
          );
        } else {
          newSelectedImages.push(imagePath);
          newCollageImages.push(item);
        }
      } else {
        if (shouldRemove) {
          newSelectedImages = newSelectedImages.filter(
            (img) => img !== imagePath
          );
          newCollageImages = newCollageImages.filter(
            (img) => getImagePath(img) !== imagePath
          );
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
    } catch (error) {
      console.error("Failed to add patient:", error);
    }
  };

  const selectAllImages = () => {
    // Only select regular images, exclude dermoscopy images
    const regularImages = allImagesWithDermoscopy.filter(img => !img.isDermoscopy);
    const selectedImage = provider === "google" 
      ? regularImages.filter(img => patientImages.some(pi => pi.id === img.id))
      : regularImages.filter(img => imageUrls.some(iu => iu.path_display === img.path_display));

    if (selectedImages.length === selectedImage.length) {
      // Deselect all
      setSelectedImages([]);
      setCollageImage([]);
      setSelectionMode(false);
    } else {
      // Select all regular images only
      const allPaths = selectedImage.map((item) =>
        provider === "google" ? item.id : item.path_display
      );
      const allItems = selectedImage.map((item) => item);

      setSelectedImages(allPaths);
      setCollageImage(allItems);
      setSelectionMode(true);
    }
  };
  const {
    fetchGoogleDriveImages: fetchGoogleDriveImages1,
    loading: dajhbdjha,
  } = useGoogleDriveImages();
  // useEffect(() => {
  //   fetchGoogleDriveImages1(accessToken, patientName, trimmedId, (count) => {
  //   });
  // }, [accessToken]);


  const fetchGoogleDriveImages = async () => {
    try {
      let vailidToken = await checkAndRefreshGoogleAccessToken(accessToken);

      // Step 1: Locate the "PhotoMed" folder
      const photoMedFolderId = await getFolderId("PhotoMed", accessToken);

      if (!photoMedFolderId) {
        console.error("PhotoMed folder not found");
        return;
      }
      // Step 2: Locate the patient folder inside "PhotoMed"
      const patientFolderId = await getFolderId(
        preData.full_name + trimmedId,
        accessToken,
        photoMedFolderId
      );



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
      // console.log('publicImagespublicImages', JSON.stringify(publicImages, null, 2));

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
    loadImages();
  }, [accessToken, provider]);

  useFocusEffect(
    useCallback(() => {
      setPatientId();
      setSelectedImages([]);
      setCollageImage([]);
    }, [accessToken, provider])
  );

  // Refetch dermoscopy when screen gains focus (e.g. returning from MarkableImage after adding circles)
  useEffect(() => {
    const onFocus = () => {
      if (preDataIdRef.current && tokenRef.current) {
        fetchDermoscopyData();
      }
    };
    onFocus(); // fetch on mount when screen is focused
    const unsubscribe = navigation.addListener("focus", onFocus);
    return unsubscribe;
  }, [navigation, fetchDermoscopyData]);

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

      await Promise.all(uploadPromises);
      const { data: refreshedImageUrls } = await refetch();

      saveCount(refreshedImageUrls?.length || 0);
    } catch (error) {
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
      });
      await Promise.all(deletePromises);
      const { data: refreshedImageUrls } = await refetch();

      saveCount(refreshedImageUrls == [] ? 0 : refreshedImageUrls?.length);
      setSelectedImages([]);
      setIsVisible(false);
      setCollageImage([]);
      // setSelectionMode(newSelectedImages.length > 0);
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

  const activePatient = useSelector(
    (state) => state.patient?.currentActivePatient
  );

  useEffect(() => {
    setPatientProfileImages();
    if (activePatient?.profileImage) {
      setPatientProfileImages({
        uri: configUrl.imageUrl + activePatient?.profileImage,
      }); // Existing profile image
    } else {
      setPatientProfileImages(imagePath.no_user_img);
    }
  }, [activePatient]);

  const navigateCameraGrid = () => {
    navigate(ScreenName.CAMERA_GRID, {
      preData: preData,
      imageData: provider == "google" ? patientImages : imageUrls,
      provider,
    });
  };

  const handleImagePress = (item, index, allData) => {
    // If it's a dermoscopy image, navigate directly to MarkableImage
    if (item[0]?.isDermoscopy && item[0]?.dermoscopyRecord) {
      const record = item[0]?.dermoscopyRecord;
      // console.log("Navigating to MarkableImage with dermoscopy record:", record?.path);
      let pathsssss = record?.path?.split('/');
      // console.log('pathsssss------', pathsssss);
      console.log("Image URL:", item[0]?.publicUrl || item[0]?.webContentLink || item[0]?.path_display || item[0]?.imageUrl);
      navigate("MarkableImage", {
        body: pathsssss[pathsssss.length - 1],
        view: pathsssss[pathsssss.length - 2],
      });
      // console.log('record------', pathsssss[pathsssss.length - 1], pathsssss[pathsssss.length - 2]);
      return;
    }

    // Regular image handling
    if (isSelectionMode) {
      toggleImageSelection(item);
    } else {
      // Filter out dermoscopy images for regular image viewer
      const regularImages = allData.filter(img => !img.isDermoscopy);
      const regularIndex = regularImages.findIndex(img => {
        const isGoogle = provider === "google";
        const currentPath = isGoogle ? item.id : item.path_display;
        const comparePath = isGoogle ? img.id : img.path_display;
        return currentPath === comparePath;
      });

      let arr = [...regularImages];
      if (regularIndex > -1 && regularIndex < arr.length) {
        const spliceData = arr.splice(regularIndex, 1)[0];
        arr.unshift(spliceData);
      }
      navigate(ScreenName.IMAGE_VIEWER, {
        preData: arr,
        accessToken,
        ScreenName: "gallery",
        imageData: provider == "google" ? patientImages : imageUrls,
      });
    }
  };

  const subscription = useSelector((state) => state.auth?.subscription);
  const needSubscription = !subscription?.isActive || subscription?.isExpired  // || !subscription?.isActive;
  // console.log('needSubscription------', subscription);


  const _chooseFile = async () => {
    if (needSubscription) {
      showSubscriptionAlert(navigate);
      return;
    }
    // navigate('MarkableImage')
    try {
      // Step 1: Select and map files
      const fileDetails = await ImageCropPicker.openPicker({
        multiple: true,
        mediaType: "photo",
        cropping: true,
      })

      const mappedFileDetails = fileDetails.map((file) => ({
        uri: file.path,
        type: file.mime,
        name: file.filename || `${patientName}${Date.now()}.jpg`,
      }));

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

      if (error?.message?.includes('User did not grant library permission.')) {
        Toast.show("To select a photo, please allow photo access for PhotoMed Pro in your device settings.");
        return;
      }

      console.error("Error during file selection or upload:", error);
      // Optionally, handle user cancellation or display a message
      Toast.show(error.message || "User has cancelled the flow");
    } finally {
      setLoading(false); // Ensure loading is stopped regardless of success or error
    }
  };

  const btnCollage = (type) => {
    if (needSubscription) {
      showSubscriptionAlert(navigate);
      return;
    }
    type === "withSelectedImage"
      ? navigate(ScreenName.COLLAGE_ADD, {
        images: collageImages,
        preData: preData,
      })
      : navigate(ScreenName.COLLAGE_ADD, { preData: preData });
  };
  const btnAddTag = () => {
    if (needSubscription) {
      showSubscriptionAlert(navigate);
      return;
    }
    navigate(ScreenName.IMAGE_DETAILS, {
      images: collageImages,
    });
  };

  btnDermoscopy = () => {
    if (needSubscription) {
      showSubscriptionAlert(navigate);
      return;
    }
    navigate(ScreenName.DERMO_SCOPY);
  };

  return (
    <WrapperContainer wrapperStyle={styles.wrapperPadding}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => goBack()} style={styles.backButtonMargin}>
            <Image
              style={styles.backIcon}
              source={require("../assets/images/icons/backIcon.png")}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Patient Details
          </Text>
          <View />
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
          <View
            style={[
              commonStyles.flexView,
              styles.cardHeaderRow,
            ]}
          >
            <View style={commonStyles.flexView}>
              <Image
                source={patientProfileImages}
                style={styles.imgStyle}
              />
              <View style={styles.patientInfoContainer}>
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
          <View style={styles.buttonRow}>
            <CustomBtn
              onPress={() =>
                navigate(ScreenName.EDIT_PATIENT, {
                  patient,
                  imageCount:
                    provider === "google" ? images.length : imageUrls.length,
                })
              }
              titleStyle={styles.titleStyleSmall}
              btnStyle={styles.editInfoButton}
              title={"Edit Information"}
            />
            <CustomBtn
              onPress={() => {
                btnDermoscopy();
                // navigate('BodyPartSelector')
              }}
              titleStyle={styles.titleStyleSmall}
              btnStyle={styles.editInfoButton}
              title={"Dermoscopy"}
            />
          </View>
        </View>
        <View style={styles.subContainer}>
          <View style={commonStyles.flexView}>
            <Image source={imagePath.gallery} style={styles.galStyle} />
            <Text style={styles.title}>All Photos</Text>
          </View>
        <Text style={styles.title}>
          {selectedImages?.length}/
          {allImagesWithDermoscopy.filter(img => !img.isDermoscopy).length}
        </Text>
      </View>
      {allImagesWithDermoscopy.length >= 1 ? (
        <TouchableOpacity
          onPress={selectAllImages}
          style={[
            commonStyles.flexView,
            styles.selectAllButton,
          ]}
        >
          <View style={styles.check}>
            {selectedImages?.length ===
              allImagesWithDermoscopy.filter(img => !img.isDermoscopy).length && 
              <Tick height={10} width={10} />}
          </View>
          <Text style={styles.title}>Select All</Text>
        </TouchableOpacity>
      ) : null}
      {allImagesWithDermoscopy.length >= 1 ? (
        <View
          style={images?.length >= 3 ? styles.imageListWrapperCentered : styles.imageListWrapper}
        >
          <PatientImageList
            data={allImagesWithDermoscopy}
            selectedImages={selectedImages}
            selectAllImages={() => selectAllImages()}
            handleImagePress={(item, index, allData) => {
              handleImagePress(item, index, allData);
            }}
            toggleImageSelection={(item, type = "default") => {
              toggleImageSelection(item, type);
            }}
          />
            <View style={styles.bottomBottonsWrapper}>
              <View style={styles.bottomButtonsRow}>
                <CustomBtn
                  titleStyle={styles.titleStyleSmall}
                  btnStyle={styles.bottomButtonsContainer}
                  title={"Add Image"}
                  onPress={_chooseFile}
                />
                <CustomBtn
                  onPress={() => navigateCameraGrid()}
                  titleStyle={styles.titleStyleSmall}
                  btnStyle={styles.bottomButtonsContainer}
                  title={"Camera"}
                />
                {selectedImages?.length >= 1 && (
                  <CustomBtn
                    onPress={() => setIsVisible(true)}
                    titleStyle={styles.titleStyleSmall}
                    btnStyle={styles.bottomButtonsContainer}
                    title={"Delete"}
                  />
                )}
                {selectedImages?.length > 0 && selectedImages?.length <= 3 && (
                  <CustomBtn
                    onPress={() => btnCollage("withSelectedImage")}
                    titleStyle={styles.titleStyleSmall}
                    btnStyle={styles.bottomButtonsContainer}
                    title={"Add Collage"}
                  />
                )}
                {selectedImages?.length > 1 && selectedImages?.length <= 5 && (
                  <>
                    <CustomBtn
                      onPress={() => {
                        btnAddTag();
                      }}
                      titleStyle={styles.titleStyleSmall}
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
          <View style={styles.emptyStateContainer}>
            <Text style={styles.info}>Upload your new photo</Text>
            <Text style={styles.info}>Number of upload images: 0</Text>
            {/* <Text style={[styles.info, styles.subTitle]}>
              Click the below buttons to add patient photos
            </Text> */}
            <View
              style={[
                commonStyles.flexView,
                styles.emptyStateButtonsContainer,
              ]}
            >
              <CommonComp
                onPress={() => btnCollage("")}
                title={"Collage"}
                IconComponent={CollegeIcon}
              />
              <CommonComp
                onPress={() => navigateCameraGrid()}
                title={"Camera"}
                commonContainer={{ height: 90, width: 90 }}
                titleStyle={styles.cameraButtonTitle}
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
      </ScrollView>
    </WrapperContainer>
  );
};

const CommonComp = ({
  IconComponent,
  title,
  onPress,
  commonContainer = null,
  titleStyle = null,
}) => {
  return (
    <View style={styles.commonCompWrapper}>
      <TouchableOpacity
        onPress={onPress}
        style={[styles.commonContainer, commonContainer]}
      >
        {IconComponent && <IconComponent />}
      </TouchableOpacity>
      <Text
        style={[
          styles.title,
          styles.commonCompTitle,
          titleStyle,
        ]}
      >
        {title}
      </Text>
    </View>
  );
};

export default PatientDetails;
