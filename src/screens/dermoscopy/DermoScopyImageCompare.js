import {
    View,
    Text,
    StyleSheet,
    useWindowDimensions,
    Platform,
    Dimensions,
    Image,
    TouchableOpacity,
    FlatList,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
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
import { moderateScale, verticalScale } from "../../styles/responsiveLayoute";
import { useRoute } from "@react-navigation/native";
import FastImage from "react-native-fast-image";
import { goBack } from "../../navigators/NavigationService";
import ImageWithLoader from "../../components/ImageWithLoader";
import { SafeAreaView } from 'react-native-safe-area-context'
const windowWidth = Dimensions.get("window").width;


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

export default function DermoScopyImageCompare() {
    const cameraRef = useRef(null);

    const [isFrontCamera, setIsFrontCamera] = useState(false);
    const [cameraPermission, setCameraPermission] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [percentage, setPercentage] = useState(50);
    const [aspectRatio] = useState("16:9");

    const opacity = useSharedValue(0.5);
    const { width, height: windowHeight } = useWindowDimensions();

    const route = useRoute();
    const images = route?.params?.images || [];

    useEffect(() => {
        if (images.length > 0) setSelectedImage(images[0]);
    }, [route?.params]);

    // Aspect ratios
    const device = useCameraDevice(isFrontCamera ? "front" : "back");
    // new====================
    const { width: screenWidth } = useWindowDimensions();
    const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS['1:1']); // Default to 16:9
    const targetRatio = RATIO_VALUES[selectedRatio];

    const format = useCameraFormat(device, [
        { videoResolution: 'max' },
        { videoAspectRatio: targetRatio },
        { photoAspectRatio: targetRatio },
        { fps: 'max' },
    ]);

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
                <Text style={[styles.txtStyle, { fontSize: 16 }]}>Loading...</Text>
            </View>
        );
    }
    const toggleCamera = () => {
        setIsFrontCamera((prevState) => !prevState); // Toggle between front and back camera
    };
    if (!device) {
        return (
            <View style={styles.center}>
                <Text style={styles.txtStyle}>No Camera Available</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
            <TouchableOpacity onPress={() => { goBack() }} style={{ height: 40, justifyContent: "center", paddingVertical: 10,zIndex:99999 }}>
                <Image source={require('../../assets/images//icons/close.png')} style={{ height: 20, width: 20, marginLeft: 20, tintColor: COLORS.primary }} />
            </TouchableOpacity>
            {/* Camera View */}
            <View style={styles.cameraWrapper}>
                <Camera
                    style={[StyleSheet.absoluteFill]}
                    ref={cameraRef}
                    device={device}
                    format={format}
                    isActive={true}
                    photo={true}
                    resizeMode="cover"
                />

                {/* Ghost Overlay */}
                {selectedImage && (
                    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, animatedStyle]}>
                        <FastImage
                            source={{ uri: selectedImage.path }}
                            style={styles.overlayImage}
                        />
                    </Animated.View>
                )}
            </View>
            <View style={{ position: "absolute", bottom: 10, left: 0, right: 0 }}>
                <View style={{ marginTop: 20, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 0, }}>
                    <View style={{ width: "10%" }} />
                    {/* Slider UI */}
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
                            style={{ height: 21, width: 21, tintColor: COLORS.whiteColor }}
                            source={require("../../assets/images/icons/switch.png")}
                        />
                    </TouchableOpacity>
                </View>
                <View style={{ width: "100%", justifyContent: "center", alignItems: "center", marginTop: 20, flex: 1 }}>
                    {
                        images?.length > 1 &&
                        <>
                            <FlatList
                                horizontal
                                data={images}
                                contentContainerStyle={{ alignSelf: 'center' }}
                                renderItem={({ item }) => {
                                    return <TouchableOpacity
                                        style={[{
                                            height: 60,
                                            width: 60,
                                            marginHorizontal: 5,
                                            borderRadius: 2,
                                        },
                                        selectedImage === item && { borderWidth: 3, borderColor: COLORS.primary, }
                                        ]}
                                        onPress={() => {
                                            setSelectedImage(item);
                                        }}
                                    >
                                        <ImageWithLoader
                                            uri={item.path}
                                            style={[
                                                {
                                                    height: '100%',
                                                    width: '100%',
                                                    borderRadius: 2,
                                                },

                                            ]}
                                        />
                                    </TouchableOpacity>
                                }}
                            />
                        </>
                    }
                </View>
            </View>
        </SafeAreaView>
    );
}

// ------------------- Styles -------------------------
const styles = StyleSheet.create({
    cameraWrapper: {
        flex: 1,
        backgroundColor: 'black', // Shows as black bars with 'contain'
        justifyContent: "center",
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
    sliderContainer: {
        alignItems: "center",
    },
    slider: {
        width: 200,
        height: 40,
    },
    overlayImage: {
        width: windowWidth,
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
    },
    camBtn: {
        backgroundColor: COLORS.primary,
        padding: 10,
        borderRadius: 5,
        marginBottom: moderateScale(5),
        height: 40,
        width: 40
    },
});
