import {
    View,
    Text,
    StyleSheet,
    Platform,
    Image,
    TouchableOpacity,
    FlatList,
    useWindowDimensions,
} from "react-native";
import React, { useEffect, useRef, useState, useMemo } from "react";
import {
    Camera,
    useCameraDevice,
    useCameraFormat,
} from "react-native-vision-camera";
import Slider from "@react-native-community/slider";
import COLORS from "../../styles/colors";
import FONTS from "../../styles/fonts";
import GhostIcon from "../../assets/SvgIcons/GhostIcon";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { useRoute } from "@react-navigation/native";
import FastImage from "react-native-fast-image";
import { goBack } from "../../navigators/NavigationService";
import ImageWithLoader from "../../components/ImageWithLoader";
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateUniqueKey } from "../../configs/api";


const ASPECT_RATIOS = {
    '16:9': '16:9',
    '4:3': '4:3',
    '1:1': '1:1',
};

const RATIO_VALUES = {
    '16:9': 16 / 9,
    '4:3': 4 / 3,
    '1:1': 1,
};

export default function DermoScopyImageCompare() {
    const cameraRef = useRef(null);

    const [isFrontCamera, setIsFrontCamera] = useState(false);
    const [cameraPermission, setCameraPermission] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [percentage, setPercentage] = useState(50);
    const [capturedImages, setCapturedImages] = useState([]);
    const [isCapturing, setIsCapturing] = useState(false);

    const opacity = useSharedValue(0.5);

    const route = useRoute();
    const imagesParam = useMemo(() => route?.params?.images || [], [route?.params?.images]);
    const onSave = route?.params?.onSave; // Callback function to save images
    const body = route?.params?.body; // Body part name for naming
    const circleName = route?.params?.circleName; // Circle name for naming
    const isCaptureMode = !!onSave; // Determine if this is capture mode
    const isMainImageCapture = isCaptureMode && !circleName; // Main image capture (no circle name)

    useEffect(() => {
        if (imagesParam.length > 0) {
            setSelectedImage(imagesParam[0]);
        }
    }, [imagesParam]);

    // Aspect ratios
    const device = useCameraDevice(isFrontCamera ? "front" : "back");
    const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS['1:1']); // Default to 1:1
    const targetRatio = RATIO_VALUES[selectedRatio];
    const { width: screenWidth } = useWindowDimensions();
    const format = useCameraFormat(device, [
        { videoResolution: 'max' },
        { videoAspectRatio: targetRatio },
        { photoAspectRatio: targetRatio },
        { fps: 'max' },
    ]);
    let height = screenWidth * targetRatio;
    const toggleRatio = () => {
        const ratios = Object.values(ASPECT_RATIOS);
        const currentIndex = ratios.indexOf(selectedRatio);
        const nextIndex = (currentIndex + 1) % ratios.length;
        setSelectedRatio(ratios[nextIndex]);
    };
    // Camera Permission
    useEffect(() => {
        (async () => {
            const permission = await Camera.requestCameraPermission();
            setCameraPermission(permission);
        })();
    }, []);

    // Animated Opacity
    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    if (cameraPermission === null) {
        return (
            <View style={styles.center}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }
    const toggleCamera = () => {
        setIsFrontCamera((prevState) => !prevState); // Toggle between front and back camera
    };

    const takePhoto = async () => {
        if (!cameraRef.current || isCapturing) return;

        try {
            setIsCapturing(true);
            const photo = await cameraRef.current.takePhoto({
                flash: 'off',
            });

            // Process the photo
            const filePath = photo.path;
            const uniqueKey = generateUniqueKey();
            const fileName = circleName
                ? `${circleName}_${body}_${uniqueKey}.jpg`
                : `dermo_${body}_${uniqueKey}.jpg`;

            // Ensure proper file path format
            let newPath = filePath;
            if (Platform.OS === 'android') {
                // Android paths from Vision Camera are already absolute, add file:// prefix
                if (!filePath.startsWith("file://")) {
                    newPath = `file://${filePath}`;
                }
            } else {
                // iOS paths from Vision Camera are already in correct format
                if (!filePath.startsWith("file://") && !filePath.startsWith("ph://")) {
                    newPath = `file://${filePath}`;
                }
            }

            const newImage = {
                path: newPath,
                name: fileName,
                mime: 'image/jpeg',
            };

            // For main image capture, replace the image instead of adding to array
            if (isMainImageCapture) {
                setCapturedImages([newImage]);
            } else {
                // For circle images, add to array (multiple images allowed)
                setCapturedImages((prev) => [...prev, newImage]);
            }
        } catch (error) {
            console.error("Error taking photo:", error);
        } finally {
            setIsCapturing(false);
        }
    };

    const handleSave = () => {
        if (capturedImages.length === 0) {
            return;
        }
        if (onSave) {
            onSave(capturedImages);
        }
        goBack();
    };

    if (!device) {
        return (
            <View style={styles.center}>
                <Text style={styles.txtStyle}>No Camera Available</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => { goBack() }} style={styles.closeBtn}>
                    <Image source={require('../../assets/images//icons/close.png')} style={styles.closeIcon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleRatio} style={styles.ratioBtn}>
                    <Text style={styles.ratioBtnText}>{selectedRatio}</Text>
                </TouchableOpacity>
            </View>
            {/* Camera View */}
            <View style={{flex:1}}>

            <View style={styles.cameraWrapper}>
                <Camera
                    style={[StyleSheet.absoluteFill]}
                    ref={cameraRef}
                    device={device}
                    format={format}
                    isActive={true}
                    photo={true}
                    resizeMode="contain"
                />

                {/* Ghost Overlay - Show if selectedImage exists (works for both compare and capture mode) */}
                {selectedImage && (
                    <Animated.View 
                        pointerEvents="none" 
                        style={[styles.overlayImage, {width: screenWidth, height }, animatedStyle]}
                        key={`overlay-${selectedRatio}`}
                    >
                        <FastImage
                            key={`ghost-image-${selectedRatio}`}
                            source={{ uri: selectedImage.path }}
                            style={[styles.overlayImage, { width:screenWidth, height }]}
                        />
                    </Animated.View>
                )}
            </View>
            </View>
            <View style={styles.bottomContainer}>
                {isCaptureMode ? (
                    // Capture Mode UI
                    <>
                        {imagesParam.length > 0 && (
                            <View style={styles.sliderWrapper}>
                                <View style={styles.sliderContainer}>
                                    <GhostIcon height={25} width={25} />
                                    <Text style={styles.percentageText}>{percentage}%</Text>
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
                                </View>
                            </View>
                        )}
                        <View style={styles.controlsRow}>
                            <TouchableOpacity onPress={() => toggleCamera()} style={styles.camBtn}>
                                <Image
                                    style={styles.switchIcon}
                                    source={require("../../assets/images/icons/switch.png")}
                                />
                            </TouchableOpacity>
                            <View style={styles.captureBtnWrapper}>
                                <TouchableOpacity
                                    onPress={takePhoto}
                                    disabled={isCapturing}
                                    style={[styles.captureBtn, isCapturing && styles.captureBtnDisabled]}
                                >
                                    <View style={styles.captureBtnInner} />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={capturedImages.length === 0}
                                style={[styles.saveBtn, capturedImages.length === 0 && styles.saveBtnDisabled]}
                            >
                                <Text style={styles.saveBtnText}>
                                    {capturedImages.length > 0
                                        ? (isMainImageCapture ? 'Save' : `Save (${capturedImages.length})`)
                                        : 'Save'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {imagesParam.length > 1 && (
                            <View style={styles.imageListContainer}>
                                <FlatList
                                    horizontal
                                    data={imagesParam}
                                    contentContainerStyle={styles.imageListContent}
                                    renderItem={({ item }) => {
                                        return (
                                            <TouchableOpacity
                                                style={[
                                                    styles.imageThumbnail,
                                                    selectedImage === item && styles.imageThumbnailSelected
                                                ]}
                                                onPress={() => {
                                                    setSelectedImage(item);
                                                }}
                                            >
                                                <ImageWithLoader
                                                    uri={item.path}
                                                    style={styles.imageThumbnailImage}
                                                />
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                            </View>
                        )}
                        {capturedImages.length > 0 && (
                            <View style={styles.imageListContainer}>
                                {!isMainImageCapture && (
                                    <Text style={styles.newPhotosLabel}>New Photos:</Text>
                                )}
                                {isMainImageCapture && (
                                    <Text style={styles.newPhotosLabel}>Captured Image (tap to retake):</Text>
                                )}
                                <FlatList
                                    horizontal
                                    data={capturedImages}
                                    contentContainerStyle={styles.imageListContent}
                                    renderItem={({ item }) => {
                                        return (
                                            <TouchableOpacity
                                                style={styles.imageThumbnail}
                                                onPress={() => {
                                                    // For main image, allow replacing by removing current image
                                                    if (isMainImageCapture) {
                                                        setCapturedImages([]);
                                                    }
                                                }}
                                            >
                                                <ImageWithLoader
                                                    uri={item.path}
                                                    style={styles.imageThumbnailImage}
                                                />
                                                {isMainImageCapture && (
                                                    <View style={styles.replaceOverlay}>
                                                        <Text style={styles.replaceText}>Tap to retake</Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                            </View>
                        )}
                    </>
                ) : (
                    // Compare Mode UI (original)
                    <>
                        <View style={styles.controlsRowCompare}>
                            <View style={styles.placeholder} />
                            <View style={styles.sliderContainer}>
                                <GhostIcon height={25} width={25} />
                                <Text style={styles.percentageText}>{percentage}%</Text>
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
                            </View>
                            <TouchableOpacity onPress={() => toggleCamera()} style={styles.camBtn}>
                                <Image
                                    style={styles.switchIcon}
                                    source={require("../../assets/images/icons/switch.png")}
                                />
                            </TouchableOpacity>
                        </View>
                        {imagesParam?.length > 1 && (
                            <View style={styles.imageListContainer}>
                                <FlatList
                                    horizontal
                                    data={imagesParam}
                                    contentContainerStyle={styles.imageListContent}
                                    renderItem={({ item }) => {
                                        return (
                                            <TouchableOpacity
                                                style={[
                                                    styles.imageThumbnail,
                                                    selectedImage === item && styles.imageThumbnailSelected
                                                ]}
                                                onPress={() => {
                                                    setSelectedImage(item);
                                                }}
                                            >
                                                <ImageWithLoader
                                                    uri={item.path}
                                                    style={styles.imageThumbnailImage}
                                                />
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                            </View>
                        )}
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}

// ------------------- Styles -------------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 10,
        zIndex: 99999,
        position:'absolute',
        left:0,
        right:0,
        top:0
    },
    closeBtn: {
        height: 40,
        justifyContent: "center",
        paddingVertical: 10,
    },
    closeIcon: {
        height: 20,
        width: 20,
        tintColor: COLORS.primary,
    },
    overlayImage: {
        height: "100%",
        width: '100%',
        resizeMode: "cover",
      },
    ratioBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 60,
        alignItems: "center",
        justifyContent: "center",
    },
    ratioBtnText: {
        color: COLORS.whiteColor,
        fontSize: 14,
        fontFamily: FONTS.medium,
        fontWeight: "600",
    },
    cameraWrapper: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: "center",
        alignItems: "center",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    txtStyle: {
        color: COLORS.textColor,
        fontSize: 16,
        fontFamily: FONTS.medium,
    },
    percentageText: {
        color: COLORS.textColor,
        fontSize: 12,
        fontFamily: FONTS.medium,
        marginTop: 5,
    },
    sliderWrapper: {
        marginTop: 10,
        paddingHorizontal: 20,
        alignItems: "center",
    },
    sliderContainer: {
        alignItems: "center",
    },
    slider: {
        width: 200,
        height: 40,
    },
    bottomContainer: {
        position: "absolute",
        bottom: 10,
        left: 0,
        right: 0,
    },
    controlsRow: {
        marginTop: 20,
        paddingHorizontal: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 0,
    },
    captureBtnWrapper: {
        position: "absolute",
        left: 0,
        right: 0,
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "box-none",
    },
    controlsRowCompare: {
        marginTop: 20,
        paddingHorizontal: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 0,
    },
    placeholder: {
        width: "10%",
    },
    camBtn: {
        backgroundColor: COLORS.primary,
        padding: 10,
        borderRadius: 5,
        height: 40,
        width: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    switchIcon: {
        height: 21,
        width: 21,
        tintColor: COLORS.whiteColor,
    },
    captureBtn: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: COLORS.whiteColor,
        borderWidth: 4,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 20,
    },
    captureBtnInner: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary,
    },
    captureBtnDisabled: {
        opacity: 0.5,
    },
    saveBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 5,
        minWidth: 80,
        alignItems: "center",
        justifyContent: "center",
    },
    saveBtnDisabled: {
        backgroundColor: "#cccccc",
        opacity: 0.5,
    },
    saveBtnText: {
        color: COLORS.whiteColor,
        fontSize: 14,
        fontFamily: FONTS.medium,
    },
    imageListContainer: {
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
    },
    imageListContent: {
        alignSelf: 'center',
    },
    imageThumbnail: {
        height: 40,
        width: 40,
        marginHorizontal: 5,
        borderRadius: 2,
    },
    imageThumbnailSelected: {
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    imageThumbnailImage: {
        height: '100%',
        width: '100%',
        borderRadius: 2,
    },
    newPhotosLabel: {
        color: COLORS.textColor,
        fontSize: 12,
        fontFamily: FONTS.medium,
        marginBottom: 5,
    },
    replaceOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        paddingVertical: 2,
        paddingHorizontal: 4,
    },
    replaceText: {
        color: COLORS.whiteColor,
        fontSize: 8,
        fontFamily: FONTS.medium,
        textAlign: "center",
    },
    loadingText: {
        color: COLORS.textColor,
        fontSize: 16,
        fontFamily: FONTS.medium,
    },
});
