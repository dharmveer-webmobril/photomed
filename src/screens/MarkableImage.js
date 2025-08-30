import { useRoute } from "@react-navigation/native";
import React, { useMemo, useRef, useState } from "react";
import { View, StyleSheet, PanResponder, Image, Alert, Dimensions, SafeAreaView } from "react-native";
import Svg, { Circle } from "react-native-svg";
import CustomBtn from "../components/CustomBtn";
import { scale, width } from "../styles/responsiveLayoute";
import { checkAndRefreshGoogleAccessToken, getDropboxFileUrl, getImageDetailsById, setFilePublic, uploadCaptureFilesToPhotoMedFolder } from "../configs/api";
import { setPatientImages } from "../redux/slices/patientSlice";
import { useSelector, useDispatch } from "react-redux";
import ViewShot from "react-native-view-shot";
import { useUploadSingleFileToDropboxMutation } from "../redux/api/common";
import Loading from "../components/Loading";

const { height: windowHeight } = Dimensions.get("window");

export default function MarkableImage() {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 }); // Track actual image size
  const [circles, setCircles] = useState([]); // Store all circles
  const [tempCircle, setTempCircle] = useState(null); // Currently drawing
  const [isLoading, setIsLoading] = useState(null); // Currently drawing
  const drawing = useRef(false);
  const route = useRoute();
  const image = route?.params?.image;
  const images = route?.params?.images;
  const provider = useSelector((state) => state.auth.cloudType);
  const patientId = useSelector((state) => state.auth.patientId.patientId);
  const patientName = useSelector((state) => state.auth.patientName.patientName);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const dispatch = useDispatch();
  const viewShotRef = useRef(null); // Reference for view capture
  const [uploadFileToDropbox] = useUploadSingleFileToDropboxMutation();
  console.log("image in markable", image);
  console.log("image in markable", image?.path);

  // Get image dimensions
  React.useEffect(() => {
    if (image?.path) {
      Image.getSize(
        image.path,
        (imgWidth, imgHeight) => {
          // Calculate scaled dimensions to fit within drawingArea
          const maxWidth = width;
          const maxHeight = windowHeight * 0.8;
          const scaleFactor = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
          const scaledWidth = imgWidth * scaleFactor;
          const scaledHeight = imgHeight * scaleFactor;
          setImageSize({ w: scaledWidth, h: scaledHeight });
          console.log("Image dimensions:", { w: scaledWidth, h: scaledHeight });
        },
        (error) => {
          console.error("Error getting image size:", error);
        }
      );
    }
  }, [image?.path]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => {
          console.log("onStartShouldSetPanResponder triggered");
          return true;
        },
        onMoveShouldSetPanResponder: () => {
          console.log("onMoveShouldSetPanResponder triggered");
          return true;
        },
        onPanResponderGrant: (evt) => {
          console.log("onPanResponderGrant triggered", evt.nativeEvent);
          const { locationX, locationY } = evt.nativeEvent;

          // Check if tapping inside an existing circle
          const tappedIndex = circles.findIndex((c) => {
            const dx = locationX - c.center.x;
            const dy = locationY - c.center.y;
            return Math.sqrt(dx * dx + dy * dy) <= c.radius;
          });

          if (tappedIndex !== -1) {
            // Remove circle on tap
            Alert.alert(
              "Remove Circle",
              "Do you want to remove this circle?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Remove",
                  style: "destructive",
                  onPress: () =>
                    setCircles((prev) =>
                      prev.filter((_, idx) => idx !== tappedIndex)
                    ),
                },
              ]
            );
            return;
          }

          // Start drawing a new circle
          drawing.current = true;
          setTempCircle({ center: { x: locationX, y: locationY }, radius: 0 });
          console.log("Started drawing circle at:", { x: locationX, y: locationY });
        },
        onPanResponderMove: (evt) => {
          if (!drawing.current || !tempCircle) return;
          console.log("onPanResponderMove triggered", evt.nativeEvent);
          const { locationX, locationY } = evt.nativeEvent;
          const dx = locationX - tempCircle.center.x;
          const dy = locationY - tempCircle.center.y;
          setTempCircle({
            ...tempCircle,
            radius: Math.sqrt(dx * dx + dy * dy),
          });
        },
        onPanResponderRelease: () => {
          if (drawing.current && tempCircle && tempCircle.radius > 0) {
            setCircles((prev) => [...prev, tempCircle]);
            console.log("Circle added:", tempCircle);
          }
          drawing.current = false;
          setTempCircle(null);
          console.log("onPanResponderRelease triggered");
        },
        onPanResponderTerminate: () => {
          drawing.current = false;
          setTempCircle(null);
          console.log("onPanResponderTerminate triggered");
        },
      }),
    [circles, tempCircle]
  );

  const onLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ w: width, h: height });
    console.log("Layout updated:", { width, height });
  };

  const saveImage = async () => {
    try {
      // Capture the screenshot of the ViewShot ref
      const uri = await viewShotRef.current.capture({
        format: "jpg",
        quality: 0.8,
      });
      console.log("Captured screenshot URI:", uri);

      // Replace the original image with the captured screenshot
      let localImageArr = [{ ...image, path: uri, uri: uri }]; // Preserve original image properties

      if (localImageArr.length <= 0) {
        Alert.alert("Validation Error", "Please capture at least one image first.");
        return;
      }
      setIsLoading(true);
      console.log("localImageArr length:", localImageArr.length);
      if (provider === "google") {
        await checkAndRefreshGoogleAccessToken(accessToken);
        const patientInfo = {
          patientId,
          patientName,
        };
        const uploadedFileIds = await uploadCaptureFilesToPhotoMedFolder(
          localImageArr, // Use the screenshot URI
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
        dispatch(setPatientImages(imgss));
        console.log("Uploaded images:", imgss);
      } else {
        // Dropbox upload
        for (let file of localImageArr) {
          let result = await uploadFileToDropbox({
            file, // Use the screenshot URI
            userId: patientName + patientId,
            accessToken,
          }).unwrap();
          let publicUrl = await getDropboxFileUrl(result.path_display, accessToken);
          console.log("Dropbox public URL:", publicUrl);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again later.");
      console.error("Error capturing or uploading image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
     <Loading visible={isLoading} />
      {/* Background image and SVG overlay wrapped in ViewShot */}
      <View style={styles.drawingArea}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: "jpg", quality: 0.8 }}
          style={[styles.imageContainer, { width: imageSize.w, height: imageSize.h }]}
        >
          <View
            style={[styles.imageContainer, { width: imageSize.w, height: imageSize.h }]}
            onLayout={onLayout}
            {...panResponder.panHandlers}
          >
            <Image
              source={{ uri: image?.path }}
              style={[styles.backgroundImage, { width: imageSize.w, height: imageSize.h }]}
              resizeMode="contain"
              onLayout={(e) => {
                console.log("Image layout:", e.nativeEvent.layout);
              }}
            />
            {/* SVG overlay for circles */}
            <Svg style={StyleSheet.absoluteFill} width={imageSize.w} height={imageSize.h}>
              {/* Saved circles */}
              {circles.map((c, i) => (
                <Circle
                  key={i}
                  cx={c.center.x}
                  cy={c.center.y}
                  r={c.radius}
                  stroke="#2DD4BF"
                  strokeWidth={3}
                  fill="rgba(45,212,191,0)"
                />
              ))}
              {/* Circle being drawn */}
              {tempCircle && tempCircle.radius > 0 && (
                <Circle
                  cx={tempCircle.center.x}
                  cy={tempCircle.center.y}
                  r={tempCircle.radius}
                  stroke="red"
                  strokeWidth={2}
                  fill="rgba(255,0,0,0.1)"
                />
              )}
            </Svg>
          </View>
        </ViewShot>
      </View>
      <View style={styles.buttonContainer}>
        <CustomBtn
          title="Clear All"
          btnStyle={{ width: scale(100), marginRight: 10 }}
          onPress={() => setCircles([])}
        />
        <CustomBtn
          title="Save"
          btnStyle={{ width: scale(100), marginLeft: 10 }}
          onPress={() => saveImage()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  drawingArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imageContainer: {
    overflow: "hidden",
  },
  backgroundImage: {
    position: "absolute",
  },
  buttonContainer: {
    padding: scale(16),
    width: width,
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});