import { useRoute } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  PanResponder,
  Image,
  Alert,
  Dimensions,
  TouchableOpacity,
  Text,
  FlatList,
} from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { width } from "../styles/responsiveLayoute";
import { checkAndRefreshGoogleAccessToken, createFolderInParentAndCheck, deleteDriveFolder, deleteFileFromDropbox, generateUniqueKey, getAllImagesRecursively, getFolderId, safeCreateFolder, uploadFileToDrive } from "../configs/api";
import { useSelector } from "react-redux";
import ViewShot from "react-native-view-shot";
import Loading from "../components/Loading";
import { goBack, navigate } from "../navigators/NavigationService";
import ScreenName from "../configs/screenName";
import {
  useGetDermoScopyMolesQuery,
  usePostDermoScopyMoleMutation,
  useUpdateDermoScopyMoleMutation,
  useUploadDropBoxImageByFolderForDermoMutation,

} from "../redux/api/common";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import COLORS from "../styles/colors";
const { height: windowHeight } = Dimensions.get("window");
import FastImage from 'react-native-fast-image'
import { getDriveImageMetadata } from "../utils/CommonFunction";
import OptionsModal from "../components/OptionsModal";
import ImageZoomModal from "../components/ImageZoomModal";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MarkableImage() {

  const [box, setBox] = useState({ w: 0, h: 0 });
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 });
  const [circles, setCircles] = useState([]);
  const [imageByCloud, setImageByCloud] = useState(null);
  const [tempCircle, setTempCircle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [patientFullId, setPatientFullId] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [combinedMoles, setCombinedMoles] = useState([]);
  const drawing = useRef(false);
  const drawingScaleRef = useRef(1);
  const cloudType = useSelector((state) => state.auth.cloudType);
  const route = useRoute();
  const { body } = route?.params || {};

  const [postDermoscopyMole] = usePostDermoScopyMoleMutation();
  const [updateDermoscopyMole] = useUpdateDermoScopyMoleMutation();
  const [uploadDropBoxImageByFolder] = useUploadDropBoxImageByFolderForDermoMutation();



  const patientId = useSelector((state) => state.auth.patientId.patientId);
  const patientName = useSelector((state) => state.auth.patientName.patientName);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const token = useSelector((state) => state.auth?.user);
  const [loading, setLoading] = useState(false)
  const [savedMolesId, setsavedMolesId] = useState(null)
  const [tappedIndex, setTapedIndex] = useState(null)

  const viewShotRef = useRef(null);

  const [modalVisible, setModalVisible] = useState(false);

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomImg, setZoomImg] = useState(null);
  const [zoomIndex, setZoomIndex] = useState(0);


  const openZoomView = (items = null, index) => {
    setZoomVisible(false)
    setZoomImg(items)
    setZoomIndex(index);
    setZoomVisible(true)
  }

  useEffect(() => {
    if (cloudType === 'google') getDriveData()
    else getDropBoxData();
  }, []);

  useEffect(() => {
    (async () => {
      let patientFullId = await AsyncStorage.getItem("patientId");
      if (patientFullId) setPatientFullId(patientFullId);
    })();
  }, []);

  const { data, refetch } = useGetDermoScopyMolesQuery(
    { patientId: patientFullId, body, token, cloudType },
    { skip: !patientFullId }
  );

  useEffect(() => {
    if (patientFullId) {
      refetch();
    }
  }, [patientFullId])

  async function getDropBoxData() {
    const folderPath = `/PhotoMed/${patientName + patientId}/Dermoscopy/${body}`;
    const path = folderPath === "" ? "" : folderPath;
    console.log('pathpathpath', path);

    setIsLoading(true)
    try {
      const response = await axios({
        method: "POST",
        url: "https://api.dropboxapi.com/2/files/list_folder",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        data: {
          path,
          recursive: true,
          include_media_info: true,
          include_deleted: false,
          include_has_explicit_shared_members: false,
        },
      });

      const entries = response.data.entries || [];
      const folders = entries.filter((item) => item[".tag"] === "folder");
      const files = entries.filter((item) => item[".tag"] === "file");
      const imageFiles = files.filter((file) =>
        file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );

      const folderMap = {};
      imageFiles.forEach((file) => {
        const folderPath = file.path_display.substring(0, file.path_display.lastIndexOf("/"));
        const folderName = folderPath.split("/").pop() || "Root";
        const folderEntry = folders.find((f) => f.path_display === folderPath);
        const folderId = folderEntry?.id || "root-folder";

        if (!folderMap[folderName]) {
          folderMap[folderName] = {
            folderId,
            folderName,
            folderPath,
            images: [],
          };
        }
        folderMap[folderName].images.push(file);
      });

      const groupedFolders = await Promise.all(
        Object.values(folderMap).map(async (folder) => {
          const imagesWithUrls = await Promise.all(
            folder.images.map(async (file) => {
              try {
                const tempLinkRes = await axios({
                  method: "POST",
                  url: "https://api.dropboxapi.com/2/files/get_temporary_link",
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                  },
                  data: { path: file.path_lower },
                });
                return {
                  name: file.name,
                  path: tempLinkRes.data.link,
                  id: file.id,
                  path_display: file.path_display,
                  client_modified: file.client_modified,
                  size: file.size,
                };
              } catch (error) {
                console.error(`Error fetching link for ${file.name}:`, error.response?.data || error.message);
                return null;
              }
            })
          );
          return {
            folderId: folder.folderId,
            folderName: folder.folderName,
            folderPath: folder.folderPath,
            images: imagesWithUrls.filter(Boolean),
          };
        })
      );

      let imageJson = groupedFolders[0]?.images[0];
      let imageJson1 = groupedFolders.slice(1);
      setCapturedImage(imageJson);
      setImageByCloud(imageJson1);
      console.log('fasdfafasfasfa', JSON.stringify(groupedFolders, null, 2));

      return { data: groupedFolders };
    } catch (error) {
      console.log("Dropbox API Error:", error.response?.data || error.message);
      return { error: { message: error.message } };
    } finally {
      setIsLoading(false)
    }
  }


  async function getDriveData() {
    setLoading(true);
    try {
      await checkAndRefreshGoogleAccessToken(accessToken);
      // Step 1: Locate the "PhotoMed" folder
      const photoMedFolderId = await getFolderId("PhotoMed", accessToken);
      if (!photoMedFolderId) {
        console.error("PhotoMed folder not found");
        setLoading(false);
        return;
      }
      // Step 2: Locate the patient folder inside "PhotoMed"
      const patientFolderId = await getFolderId(
        patientName + patientId,
        accessToken,
        photoMedFolderId
      );
      if (!patientFolderId) {
        console.error("patientFolderId folder not found");
        setLoading(false);
        return;
      }
      // Step 2: Locate the patient folder inside "PhotoMed"
      const dermofolderId = await getFolderId(
        'Dermoscopy',
        accessToken,
        patientFolderId
      );
      if (!dermofolderId) {
        console.error("dermofolderId folder not found");
        setLoading(false);
        return;
      }
      // Step 2: Locate the patient folder inside "PhotoMed"
      const bodyfolderId = await getFolderId(
        body,
        accessToken,
        dermofolderId
      );
      if (!bodyfolderId) {
        console.error("bodyfolderId folder not found");
        setLoading(false);
        return;
      }
      const folderData = await getAllImagesRecursively(accessToken, bodyfolderId)
      if (folderData && folderData.length > 0) {
        console.log('---folderData---', JSON.stringify(folderData, null, 2));
        let rootImage = folderData.filter(item => item.folderName === 'root');
        let molesData = folderData.filter(item => item.folderName !== 'root');
        setCapturedImage(rootImage[0].images[0]);
        setImageByCloud(molesData);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log('--folderData-- errorerror', error);
    }
  }



  useEffect(() => {
    console.log('data.ResponseBody-', JSON.stringify(data, null, 2));
    if (data && data.ResponseBody && data.ResponseBody[0]?.moles?.length > 0 && imageByCloud) {
      setsavedMolesId(data.ResponseBody[0]?._id)
      const combineData = combineMoleAndFolderData(data.ResponseBody[0]?.moles, imageByCloud);
      console.log('combineData', combineData);

      setCombinedMoles(combineData);
      setCircles(combineData);
    }
  }, [data, imageByCloud]);

  function combineMoleAndFolderData(moleData, folderData) {
    const folderMap = {};
    folderData.forEach((folder) => {
      if (folder.folderName !== "Right Back") {
        folderMap[folder.folderName] = {
          folderId: folder.folderId,
          folderName: folder.folderName,
          folderPath: folder.folderPath,
          attachedImages: folder.images || [],
        };
      }
    });

    return moleData.map((mole) => {
      const matchedFolder = folderMap[mole.name];
      if (matchedFolder) {
        return { ...mole, ...matchedFolder };
      } else {
        return { ...mole, attachedImages: [] };
      }
    });
  }

  React.useEffect(() => {
    if (!capturedImage?.path) return;

    let isMounted = true;

    const processImageSize = async () => {
      try {
        let imgWidth = null;
        let imgHeight = null;

        // --- GOOGLE DRIVE CASE (fast metadata) ---
        if (capturedImage?.id && cloudType === "google") {
          const size = await getDriveImageMetadata(capturedImage.id, accessToken);

          if (!size?.imgWidth || !size?.imgHeight) {
            console.warn("Google metadata missing → fallback to Image.getSize");
          } else {
            imgWidth = size.imgWidth;
            imgHeight = size.imgHeight;
          }
        }

        // --- FALLBACK: NORMAL IMAGE PATH ---
        if (!imgWidth || !imgHeight) {
          await new Promise((resolve, reject) => {
            Image.getSize(
              capturedImage.path,
              (w, h) => {
                imgWidth = w;
                imgHeight = h;
                resolve();
              },
              err => {
                console.error("Image.getSize error:", err);
                reject(err);
              }
            );
          });
        }

        if (!isMounted || !imgWidth || !imgHeight) return;

        // --- SCALE LOGIC ---
        const maxWidth = width;
        const maxHeight = windowHeight * 0.65;

        const scaleFactor = Math.min(
          maxWidth / imgWidth,
          maxHeight / imgHeight
        );

        const scaledWidth = imgWidth * scaleFactor;
        const scaledHeight = imgHeight * scaleFactor;

        if (isMounted) {
          setImageSize({ w: scaledWidth, h: scaledHeight });
        }
      } catch (err) {
        console.error("Image processing failed:", err);
      }
    };

    processImageSize();

    return () => {
      isMounted = false;
    };
  }, [capturedImage?.path, capturedImage?.id, cloudType, accessToken]);

  const openCamera = () => {
    navigate(ScreenName.DERMO_SCOPY_CAMERA, {
      body,
      onSave: (capturedImages) => {
        if (capturedImages && capturedImages.length > 0) {
          const newImg = capturedImages[0]; // Take the first image for main image
          if (!newImg.path.startsWith("file://")) {
            newImg.path = `file://${newImg.path}`;
          }
          setCapturedImage(newImg);
          setCircles([]);
        }
      },
    });
  };

  const isMarkingEnabled = !!capturedImage?.path;

  const getDisplayedImageSize = () => {
    if (!box.w || !box.h || !imageSize.w || !imageSize.h) return null;

    const containerAspect = box.w / box.h;
    const imageAspect = imageSize.w / imageSize.h;

    let displayedWidth, displayedHeight, offsetX = 0, offsetY = 0;

    if (imageAspect > containerAspect) {
      displayedWidth = box.w;
      displayedHeight = box.w / imageAspect;
      offsetY = (box.h - displayedHeight) / 2;
    } else {
      displayedHeight = box.h;
      displayedWidth = box.h * imageAspect;
      offsetX = (box.w - displayedWidth) / 2;
    }

    return { displayedWidth, displayedHeight, offsetX, offsetY };
  };

  const isInsideImage = (x, y) => {
    const dims = getDisplayedImageSize();
    if (!dims) return false;
    const { offsetX, offsetY, displayedWidth, displayedHeight } = dims;
    return (
      x >= offsetX &&
      x <= offsetX + displayedWidth &&
      y >= offsetY &&
      y <= offsetY + displayedHeight
    );
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => isMarkingEnabled,
        onMoveShouldSetPanResponder: () => isMarkingEnabled,

        onPanResponderGrant: (evt) => {
          if (!isMarkingEnabled) return;

          const { locationX, locationY } = evt.nativeEvent;

          if (!isInsideImage(locationX, locationY)) return;

          const dims = getDisplayedImageSize();
          if (!dims) return;

          const { displayedWidth, displayedHeight, offsetX, offsetY } = dims;
          const normX = (locationX - offsetX) / displayedWidth;
          const normY = (locationY - offsetY) / displayedHeight;

          const tappedIndex = circles.findIndex((c) => {
            const dx = normX - c.center.x;
            const dy = normY - c.center.y;
            return Math.sqrt(dx * dx + dy * dy) <= c.radius;
          });

          if (tappedIndex !== -1) {
            setTapedIndex(tappedIndex)
            Alert.alert("Mark Actions", "Choose an action for this mark", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Attach Photo",
                onPress: () => btnAttachImages(tappedIndex),
              },
              {
                text: "Delete Mark",
                style: "destructive",
                onPress: () => {
                  deleteImage(tappedIndex)
                },
              },
            ]);
            return;
          }

          const scale = Math.min(displayedWidth, displayedHeight);
          drawingScaleRef.current = scale;

          drawing.current = true;
          const uniqueId = generateUniqueKey(); // Unique ID from the start
          setTempCircle({
            center: { x: normX, y: normY },
            radius: 0.02,
            uniqueId, // Attach uniqueId early
          });
        },

        onPanResponderMove: (evt) => {
          if (!drawing.current || !tempCircle) return;

          const { locationX, locationY } = evt.nativeEvent;
          if (!isInsideImage(locationX, locationY)) return;

          const dims = getDisplayedImageSize();
          if (!dims) return;

          const { displayedWidth, displayedHeight, offsetX, offsetY } = dims;
          const normX = (locationX - offsetX) / displayedWidth;
          const normY = (locationY - offsetY) / displayedHeight;

          const dx = normX - tempCircle.center.x;
          const dy = normY - tempCircle.center.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          setTempCircle({
            ...tempCircle,
            radius: Math.max(distance, 0.005),
          });
        },

        onPanResponderRelease: () => {
          if (drawing.current && tempCircle) {
            const minRadius = 0.005;
            if (tempCircle.radius >= minRadius) {

              setCircles((prev) => [
                ...prev,
                {
                  ...tempCircle,
                  name: `m_${tempCircle.uniqueId}`,
                }
              ]);
            }
          }
          drawing.current = false;
          setTempCircle(null);
          drawingScaleRef.current = 1;
        },
      }),
    [circles, tempCircle, imageSize, box, isMarkingEnabled]
  );

  const btnAttachImages = (tappedIndex) => {
    const existingImages = circles[tappedIndex]?.attachedImages || [];
    navigate(ScreenName.DERMO_SCOPY_CAMERA, {
      body,
      circleName: circles[tappedIndex]?.name,
      images: existingImages.length > 0 ? existingImages : undefined, // Pass existing images for ghost overlay if available
      onSave: (capturedImages) => {
        if (capturedImages && capturedImages.length > 0) {
          // Process all captured images
          const processedImages = capturedImages.map((img) => {
            const processedImg = { ...img };
            if (!processedImg.path.startsWith("file://")) {
              processedImg.path = `file://${processedImg.path}`;
            }
            return processedImg;
          });

          setCircles((prev) =>
            prev.map((circle, idx) =>
              idx === tappedIndex
                ? {
                  ...circle,
                  attachedImages: circle.attachedImages
                    ? [...circle.attachedImages, ...processedImages]
                    : processedImages,
                }
                : circle
            )
          );
        }
        closeModal();
      },
    });
  };

  const onLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ w: width, h: height });
  };

  const validateAllMolesHavePhotos = () => {
    const invalidIndices = circles
      .map((c, i) => (!c.attachedImages || c.attachedImages.length === 0 ? i : -1))
      .filter((i) => i !== -1);

    return {
      isValid: invalidIndices.length === 0,
      invalidIndices,
    };
  };

  const saveImage = async () => {
    try {
      if (!capturedImage?.path) {
        return Alert.alert("No Image", "Please capture an image first");
      }

      if (circles.length === 0) {
        return Alert.alert("No Marks", "Please add at least one mark");
      }

      // const { isValid, invalidIndices } = validateAllMolesHavePhotos();
      // if (!isValid) {
      //   const moleList = invalidIndices.map(i => `M${i + 1}`).join(", ");
      //   return Alert.alert(
      //     "Missing Photos",
      //     `Please attach at least one photo to each mole:\n${moleList}`
      //   );
      // }

      setLoading(true);

      if (cloudType === "google") {
        await addToDrive();
      } else {
        await addToDropBox();
      }

      await addCirclesDimentions(circles);
      Alert.alert(
        "Success",
        "Image with marks saved successfully!",
        [
          {
            text: "OK",
            onPress: () => goBack(),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.log("❌ Error in saveImage:", error);
      Alert.alert("Error", "Something went wrong while saving the image.");
    } finally {
      setLoading(false);
    }
  };


  const addToDropBox = async () => {
    try {
      const basePath = `/PhotoMed/${patientName + patientId}/Dermoscopy/${body}`;
      const rootPath = `${basePath}/${capturedImage.name}`;

      console.log('640---', basePath);
      console.log('641---', rootPath);
      console.log('capturedImage 641---', capturedImage);
      if (!capturedImage?.id) {
        let res = await uploadDropBoxImageByFolder({
          file: capturedImage,
          path: rootPath,
          userId: patientName + patientId,
          accessToken,
        }).unwrap();

        console.log('650---', res);
      }

      for (const circle of circles) {
        if (!circle.attachedImages?.length) continue;

        for (const img of circle.attachedImages) {
          const subPath = `${basePath}/${circle.name}/${img.name}`;
          console.log('subPathsubPathsubPath---', subPath);
          if (!img?.id) {
            try {
              await uploadDropBoxImageByFolder({
                file: img,
                path: subPath,
                userId: patientName + patientId,
                accessToken,
              }).unwrap();
            } catch (err) {
              console.log(`❌ Error uploading ${img.name}:`, err);
            }
          }
        }
      }
    } catch (error) {
      console.log("❌ Dropbox Upload Error:", error);
      throw new Error("Dropbox upload failed");
    }
  };

  const addToDrive = async () => {
    try {
      const baseFolder = `/PhotoMed/${patientName + patientId}/Dermoscopy/${body}`;

      const bodyFolderId = await safeCreateFolder(
        baseFolder,
        accessToken,
        "root"
      );

      const rootImg = {
        uri: capturedImage?.path,
        name: capturedImage?.name || `dermo_${body}.jpg`,
        type: capturedImage?.mime || "image/jpeg",
      };

      // Upload main image only if not already uploaded
      if (!capturedImage?.id) {
        await uploadFileToDrive(rootImg, bodyFolderId, accessToken);
      }

      // Upload moles
      for (const circle of circles) {
        if (!circle.attachedImages?.length) continue;

        const subFolderId = await createFolderInParentAndCheck(
          circle.name,
          bodyFolderId,
          accessToken
        );

        for (const img of circle.attachedImages) {
          const driveImg = {
            uri: img?.path,
            name: img?.name,
            type: img?.mime || "image/jpeg",
          };

          if (!img?.id) {
            try {
              await uploadFileToDrive(driveImg, subFolderId, accessToken);
            } catch (err) {
              console.log(`❌ Error uploading ${img.name}:`, err);
            }
          }
        }
      }
    } catch (error) {
      console.log("❌ Drive Upload Error:", error);
      throw new Error("Google Drive upload failed");
    }
  };

  async function deleteImage(tappedIndex) {
    const selData = circles[tappedIndex];

    if (!selData) {
      console.log("⚠ Invalid index", tappedIndex);
      return;
    }

    setLoading(true);

    try {
      // GOOGLE DRIVE DELETE
      if (cloudType === "google") {
        if (!selData.folderId) {
          const updatedCircles = circles.filter((_, idx) => idx !== tappedIndex);
          setCircles(updatedCircles);
          return
        }


        await deleteDriveFolder(selData.folderId, accessToken);
      }


      else {
        if (!selData.folderPath) {
          const updatedCircles = circles.filter((_, idx) => idx !== tappedIndex);
          setCircles(updatedCircles);
          return
        }

        await deleteFileFromDropbox(selData.folderPath, accessToken);
      }


      const updatedCircles = circles.filter((_, idx) => idx !== tappedIndex);
      setCircles(updatedCircles);


      await addCirclesDimentions(updatedCircles);

    } catch (error) {
      console.log("❌ deleteImage Error:", error);
      Alert.alert("Error", "Failed to delete image. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function addCirclesDimentions(updatedList) {
    let idpatientId = await AsyncStorage.getItem("patientId");
    const dadada = updatedList.map((item) => ({
      name: item.name,
      center: item.center,
      radius: item.radius,
    }));

    let payload = {
      body,
      patientId: idpatientId,
      cloudType,
      moles: dadada,
    };

    try {
      if (savedMolesId) {
        await updateDermoscopyMole({
          token,
          data: payload,
          id: savedMolesId,
        }).unwrap();
      } else {
        await postDermoscopyMole({
          token,
          data: payload,
        }).unwrap();
      }
    } catch (error) {
      console.log("Save error:", error);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={isLoading || loading} />
      <OptionsModal
        visible={modalVisible}
        onClose={closeModal}
        isCompareActive={circles[tappedIndex]?.attachedImages?.length > 0 ? true : false}
        onAddImage={() => { btnAttachImages(tappedIndex) }}
        onDelete={() => { deleteImage(tappedIndex); closeModal(); }}
        onCompare={() => {
          closeModal();
          // navigate(ScreenName.DERMO_SCOPY_COMPARE, { images: circles[tappedIndex].attachedImages });
          navigate('DermoscopyCollage', { images: circles[tappedIndex].attachedImages });
        }}
      />
      <ImageZoomModal
        visible={zoomVisible}
        onClose={() => setZoomVisible(false)}
        imageUriJson={zoomImg}
        imageIndex={zoomIndex}
      />

      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => goBack()} style={{ marginLeft: 10 }}>
          <Image style={styles.backIcon} source={require("../assets/images/icons/backIcon.png")} />
        </TouchableOpacity>
        <Text style={styles.title}>Mark Moles on {body}</Text>

        <TouchableOpacity onPress={saveImage} style={{ marginRight: 10, backgroundColor: COLORS.primary, width: 90, justifyContent: 'center', alignItems: 'center', padding: 5, borderRadius: 5 }}>
          <Text style={{ color: '#fff' }}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.fixedBox, { width, height: windowHeight * 0.55 }]}>
        <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }} style={{ width: "100%", height: "100%" }}>
          <View
            style={styles.imageContainer}
            onLayout={onLayout}
            {...(isMarkingEnabled ? panResponder.panHandlers : {})}
          >
            {!capturedImage?.path ? (
              <TouchableOpacity style={styles.noImageContainer} onPress={openCamera}>
                <Text style={styles.noImageText}>Tap to Capture Body Image</Text>
              </TouchableOpacity>
            ) : (
              <>
                <FastImage
                  source={{ uri: capturedImage.path }}
                  style={styles.backgroundImage}
                  resizeMode="contain"
                />

                <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                  {circles.map((c, i) => {
                    const dims = getDisplayedImageSize();
                    if (!dims) return null;

                    const { displayedWidth, displayedHeight, offsetX, offsetY } = dims;
                    const scale = Math.min(displayedWidth, displayedHeight);

                    const cx = offsetX + c.center.x * displayedWidth;
                    const cy = offsetY + c.center.y * displayedHeight;
                    const r = c.radius * displayedWidth;

                    return (
                      <React.Fragment key={i}>
                        <Circle
                          cx={cx}
                          cy={cy}
                          r={r}
                          stroke="#2DD4BF"
                          strokeWidth={4}
                          fill="rgba(45, 212, 191, 0.15)"
                        />
                        <SvgText
                          x={cx}
                          y={cy - r - 10}
                          fontSize={16}
                          fill="#2DD4BF"
                          textAnchor="middle"
                          fontWeight="normal"
                          strokeWidth={3}
                          paintOrder="stroke fill"
                        >
                          {c?.name}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}

                  {tempCircle && (() => {
                    const dims = getDisplayedImageSize();
                    if (!dims) return null;
                    const { displayedWidth, displayedHeight, offsetX, offsetY } = dims;
                    const scale = Math.min(displayedWidth, displayedHeight);
                    const cx = offsetX + tempCircle.center.x * displayedWidth;
                    const cy = offsetY + tempCircle.center.y * displayedHeight;
                    const r = tempCircle.radius * scale;

                    return (
                      <>
                        <Circle
                          cx={cx}
                          cy={cy}
                          r={r}
                          stroke="red"
                          strokeWidth={5}
                          fill="rgba(255, 0, 0, 0.1)"
                          strokeDasharray="8,6"
                        />
                        <SvgText
                          x={cx}
                          y={cy - 12}
                          fontSize={18}
                          fill="red"
                          textAnchor="middle"
                          fontWeight="200"
                          stroke="#ffffff"
                          strokeWidth={4}
                          paintOrder="stroke fill"
                        >
                          Drawing...
                        </SvgText>
                      </>
                    );
                  })()}
                </Svg>
              </>
            )}
          </View>
        </ViewShot>
      </View>

      {circles.length > 0 && (
        <FlatList
          data={circles}
          keyExtractor={(_, i) => "mark_" + i}
          contentContainerStyle={{ padding: 15 }}
          renderItem={({ item, index }) => (
            <View style={styles.containerCircleItem}>
              <View style={styles.circleItem}>
                <Text style={styles.circleText}>
                  Mole: {item?.name}
                </Text>
                {item.attachedImages && (
                  <View style={{ marginTop: 6, flexDirection: "row", flexWrap: "wrap" }}>
                    {item.attachedImages.map((img, idx) => (
                      <TouchableOpacity key={"mark_" + index + '_' + idx} onPress={() => { openZoomView(img, idx) }}>
                        <FastImage
                          key={idx}
                          source={{ uri: img.path }}
                          style={{ height: 45, width: 45, marginRight: 4, marginBottom: 4, borderRadius: 3 }}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {data?.ResponseBody && <TouchableOpacity
                onPress={() => {
                  setTapedIndex(index)
                  openModal()
                }}
                style={{ justifyContent: 'center', alignItems: 'center', padding: 5, borderRadius: 5 }}>
                <Image source={require('../assets/images/threedot.png')} style={{ height: 25, width: 10 }} />
              </TouchableOpacity>}
            </View>
          )}
        />
      )}

      {capturedImage?.path && circles.length === 0 && (
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={{ color: "#666", fontSize: 14, textAlign: "center" }}>
            Tap and drag on the image to draw a circle around a mole
          </Text>
        </View>
      )}
    </SafeAreaView>
  );

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  fixedBox: {
    alignSelf: "center",
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 12,
    marginTop: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  noImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
  },
  noImageText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#222",
  },
  backIcon: { height: 28, width: 28 },
  circleItem: {

  },
  containerCircleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    marginVertical: 6,
    marginHorizontal: 15,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    elevation: 1,
  },
  circleText: {
    color: "#333",
    fontSize: 15,
    fontWeight: "600",
  },
});