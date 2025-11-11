import { useRoute } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  PanResponder,
  Image,
  Alert,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  Text,
  FlatList,
} from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import CustomBtn from "../components/CustomBtn";
import { width } from "../styles/responsiveLayoute";
import { generateUniqueKey } from "../configs/api";
import { useSelector } from "react-redux";
import ViewShot from "react-native-view-shot";
import Loading from "../components/Loading";
import { goBack, navigate } from "../navigators/NavigationService";
import ImageCropPicker from "react-native-image-crop-picker";
import {
  useGetDermoScopyMolesQuery,
  usePostDermoScopyMoleMutation,
  useUploadDropBoxImageByFolderMutation,
} from "../redux/api/common";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import COLORS from "../styles/colors";

const { height: windowHeight } = Dimensions.get("window");

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
  const drawingScaleRef = useRef(1); // <-- NEW: cache scale during drag
  const cloudType = useSelector((state) => state.auth.cloudType);
  const route = useRoute();
  const { body } = route?.params || {};
  const patientId = useSelector((state) => state.auth.patientId.patientId);
  const patientName = useSelector((state) => state.auth.patientName.patientName);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const token = useSelector((state) => state.auth?.user);

  const viewShotRef = useRef(null);

  // ... [getImageFromData, useEffects, combineMoleAndFolderData, openCamera] unchanged ...

  useEffect(() => {
    getDropBoxData();
  }, []);

  async function getDropBoxData() {
    const folderPath = `/PhotoMed/${patientName + patientId}/Dermoscopy/${body}`;
    const path = folderPath === "" ? "" : folderPath;

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
      return { data: groupedFolders };
    } catch (error) {
      console.log("Dropbox API Error:", error.response?.data || error.message);
      return { error: { message: error.message } };
    }
  }
  // const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';

  // const getAllImagesRecursively = async (accessToken, folderId) => {
  //   const allFiles = [];

  //   async function fetchFolder(folderId) {
  //     const query = `'${folderId}' in parents and trashed=false`;
  //     const res = await axios.get(DRIVE_API, {
  //       headers: { Authorization: `Bearer ${accessToken}` },
  //       params: {
  //         q: query,
  //         fields: 'files(id, name, mimeType, parents)',
  //       },
  //     });

  //     for (const file of res.data.files) {
  //       if (file.mimeType === 'application/vnd.google-apps.folder') {
  //         // Recursive call for subfolders
  //         await fetchFolder(file.id);
  //       } else if (file.mimeType.startsWith('image/')) {
  //         // Only images (jpeg, png, etc.)
  //         allFiles.push(file);
  //       }
  //     }
  //   }

  //   await fetchFolder(folderId);
  //   return allFiles;
  // };

  // async function getDriveData() {
  //   // const folderPath = `/PhotoMed/${patientName + patientId}/Dermoscopy/${body}`;
  //   try {
  //     let vailidToken = await checkAndRefreshGoogleAccessToken(accessToken);
  //     // Step 1: Locate the "PhotoMed" folder
  //     const photoMedFolderId = await getFolderId("PhotoMed", accessToken);
  //     if (!photoMedFolderId) {
  //       console.error("PhotoMed folder not found");
  //       return;
  //     }
  //     // Step 2: Locate the patient folder inside "PhotoMed"
  //     const patientFolderId = await getFolderId(
  //       preData.full_name + trimmedId,
  //       accessToken,
  //       photoMedFolderId
  //     );
  //     // Step 2: Locate the patient folder inside "PhotoMed"
  //     const dermofolderId = await getFolderId(
  //       'Dermoscopy',
  //       accessToken,
  //       patientFolderId
  //     );

  //     // Step 2: Locate the patient folder inside "PhotoMed"
  //     const bodyfolderId = await getFolderId(
  //       body,
  //       accessToken,
  //       dermofolderId
  //     );

  //     const folderData = getAllImagesRecursively(accessToken, bodyfolderId)


  //   } catch {

  //   }
  // }

  useEffect(() => {
    (async () => {
      let patientFullId = await AsyncStorage.getItem("patientId");
      if (patientFullId) setPatientFullId(patientFullId);
    })();
  }, []);

  const { data } = useGetDermoScopyMolesQuery(
    { patientId: patientFullId, body, token, cloudType },
    { skip: !patientFullId } // 👈 this line prevents running until patientFullId exists
  );
  useEffect(() => {
    if (data && data.ResponseBody && data.ResponseBody[0]?.moles?.length > 0 && imageByCloud) {
      const combineData = combineMoleAndFolderData(data.ResponseBody[0]?.moles, imageByCloud);
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
    if (capturedImage?.path) {
      Image.getSize(
        capturedImage.path,
        (imgWidth, imgHeight) => {
          const maxWidth = width;
          const maxHeight = windowHeight * 0.65;
          const scaleFactor = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
          const scaledWidth = imgWidth * scaleFactor;
          const scaledHeight = imgHeight * scaleFactor;
          setImageSize({ w: scaledWidth, h: scaledHeight });
        },
        (error) => console.error("Error getting image size:", error)
      );
    }
  }, [capturedImage?.path]);

  const openCamera = () => {
    ImageCropPicker.openCamera({
      cropping: false,
      mediaType: "photo",
      width: 1000,
      height: 1000,
      compressImageQuality: 0.8,
    })
      .then((img) => {
        const newImg = { ...img };
        const uniqueKey = generateUniqueKey();
        newImg.name = `dermo_${body}_${uniqueKey}.jpg`;
        if (!newImg.path.startsWith("file://")) {
          newImg.path = `file://${newImg.path}`;
        }
        setCapturedImage(newImg);
        setCircles([]);
      })
      .catch((e) => console.log("Camera cancelled or error:", e));
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
            Alert.alert("Mark Actions", "Choose an action for this mark", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Attach Photo",
                onPress: () => btnAttachImages(tappedIndex),
              },
              {
                text: "Delete Mark",
                style: "destructive",
                onPress: () =>
                  setCircles((prev) => prev.filter((_, idx) => idx !== tappedIndex)),
              },
            ]);
            return;
          }

          // CACHE SCALE FOR DRAG
          const scale = Math.min(displayedWidth, displayedHeight);
          drawingScaleRef.current = scale;

          drawing.current = true;
          setTempCircle({
            center: { x: normX, y: normY },
            radius: 0.02, // small dot
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
              setCircles((prev) => [...prev, { ...tempCircle }]);
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
    ImageCropPicker.openCamera({
      cropping: false,
      mediaType: "photo",
      width: 800,
      height: 800,
    })
      .then((img) => {
        const newImg = { ...img };
        const uniqueKey = generateUniqueKey();
        newImg.name = `m${tappedIndex + 1}_${body}_${uniqueKey}.jpg`;
        if (!newImg.path.startsWith("file://")) {
          newImg.path = `file://${newImg.path}`;
        }
        setCircles((prev) =>
          prev.map((circle, idx) =>
            idx === tappedIndex
              ? {
                ...circle,
                attachedImages: circle.attachedImages
                  ? [...circle.attachedImages, newImg]
                  : [newImg],
              }
              : circle
          )
        );
      })
      .catch((e) => console.log("Attach photo cancelled:", e));
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
    // await addToDrive();
    // return
    if (!capturedImage?.path) {
      Alert.alert("No Image", "Please capture an image first");
      return;
    }
    if (circles.length === 0) {
      Alert.alert("No Marks", "Please add at least one mark");
      return;
    }

    const { isValid, invalidIndices } = validateAllMolesHavePhotos();
    if (!isValid) {
      const moleList = invalidIndices.map((i) => `M${i + 1}`).join(", ");
      Alert.alert(
        "Missing Photos",
        `Please attach at least one photo to each mole:\n${moleList}`,
        [{ text: "OK" }],
        { cancelable: true }
      );
      return;
    }

    await addToDropBox();
    await addCirclesDimentions();
    Alert.alert("Success", "Image with marks saved successfully!", [{ text: "OK" }]);
  };

  const [postDermoscopyMole] = usePostDermoScopyMoleMutation();
  const [uploadDropBoxImageByFolder] = useUploadDropBoxImageByFolderMutation();

  async function addToDropBox() {
    const path = `/PhotoMed/${patientName + patientId}/Dermoscopy/${body}/${capturedImage.name}`;

    try {
      await uploadDropBoxImageByFolder({
        file: capturedImage,
        path,
        userId: patientName + patientId,
        accessToken,
      }).unwrap();

      for (let index = 0; index < circles.length; index++) {
        const element = circles[index];
        if (element.attachedImages && element.attachedImages.length > 0) {
          for (let j = 0; j < element.attachedImages.length; j++) {
            const valuse = element.attachedImages[j];
            const subfolderpath = `/PhotoMed/${patientName + patientId}/Dermoscopy/${body}/m${index + 1}/${valuse.name}`;
            await uploadDropBoxImageByFolder({
              file: valuse,
              path: subfolderpath,
              userId: patientName + patientId,
              accessToken,
            }).unwrap();
          }
        }
      }
    } catch (error) {
      console.log("Upload error:", error);
    }
  }

  async function addToDrive() {
    const path = `/PhotoMed/${patientName + patientId}/Dermoscopy/${body}/${capturedImage.name}`;
    try {

      let bodyFolderId = await safeCreateFolder(
        `/PhotoMed/${patientName + patientId}/Dermoscopy/${body}`,
        accessToken,
        "root"
      );
      console.log('shsjhsfjhs', bodyFolderId);


    } catch (error) {

    }
  }

  async function addCirclesDimentions() {
    let idpatientId = await AsyncStorage.getItem("patientId");
    let dadada = circles.map((item, index) => {
      const { attachedImages, ...cleanItem } = item;
      return { ...cleanItem, name: `m${index + 1}` };
    });

    let payload = {
      body: body,
      patientId: idpatientId,
      cloudType,
      moles: dadada,
    };

    try {
      await postDermoscopyMole({
        token,
        data: payload,
      }).unwrap();
    } catch (error) {
      console.log("Save error:", error);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={isLoading} />

      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => goBack()} style={{ marginLeft: 10 }}>
          <Image style={styles.backIcon} source={require("../assets/images/icons/backIcon.png")} />
        </TouchableOpacity>
        <Text style={styles.title}>Mark Moles on Body</Text>

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
                <Image
                  source={{ uri: capturedImage.path }}
                  style={styles.backgroundImage}
                  resizeMode="contain"
                />

                <Svg style={StyleSheet.absoluteFill}>
                  {circles.map((c, i) => {
                    const dims = getDisplayedImageSize();
                    if (!dims) return null;

                    const { displayedWidth, displayedHeight, offsetX, offsetY } = dims;
                    const scale = Math.min(displayedWidth, displayedHeight);

                    const cx = offsetX + c.center.x * displayedWidth;
                    const cy = offsetY + c.center.y * displayedHeight;
                    const r = c.radius * scale;

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
                          y={cy - 10}
                          fontSize={16}
                          fill="#2DD4BF"
                          textAnchor="middle"
                          fontWeight="bold"
                          stroke="#ffffff"
                          strokeWidth={3}
                          paintOrder="stroke fill"
                        >
                          {`M${i + 1}`}
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
                <Text style={styles.circleText}>Mole: M{index + 1}</Text>

                <TouchableOpacity onPress={() => { navigate('CollageDermoscopy', { images: item.attachedImages }) }} style={{ backgroundColor: COLORS.primary, width: 90, justifyContent: 'center', alignItems: 'center', padding: 5, borderRadius: 5 }}>
                  <Text style={{ color: '#fff' }}>Compare</Text>
                </TouchableOpacity>
              </View>
              {item.attachedImages && (
                <View style={{ marginTop: 6, flexDirection: "row", flexWrap: "wrap" }}>
                  {item.attachedImages.map((img, idx) => (
                    <Image
                      key={idx}
                      source={{ uri: img.path }}
                      style={{ height: 30, width: 30, marginRight: 4, marginBottom: 4, borderRadius: 3 }}
                    />
                  ))}
                </View>
              )}
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
    flexDirection: "row",
    justifyContent: "space-between",
  },
  containerCircleItem: {
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