import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
} from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import COLORS from '../../styles/colors';
import FONTS from '../../styles/fonts';
import { SafeAreaView } from 'react-native-safe-area-context';
import HumanBodyMap from './SVGReact';

const { width, height } = Dimensions.get('window');

// Human body silhouette SVG path
const BODY_SILHOUETTE = "M 104.265 117.959 c -0.304 3.58 2.126 22.529 3.38 29.959 c 0.597 3.52 2.234 9.255 1.645 12.3 c -0.841 4.244 -1.084 9.736 -0.621 12.934 c 0.292 1.942 1.211 10.899 -0.104 14.175 c -0.688 1.718 -1.949 10.522 -1.949 10.522 c -3.285 8.294 -1.431 7.886 -1.431 7.886 c 1.017 1.248 2.759 0.098 2.759 0.098 c 1.327 0.846 2.246 -0.201 2.246 -0.201 c 1.139 0.943 2.467 -0.116 2.467 -0.116 c 1.431 0.743 2.758 -0.627 2.758 -0.627 c 0.822 0.414 1.023 -0.109 1.023 -0.109 c 2.466 -0.158 -1.376 -8.05 -1.376 -8.05 c -0.92 -7.088 0.913 -11.033 0.913 -11.033 c 6.004 -17.805 6.309 -22.53 3.909 -29.24 c -0.676 -1.937 -0.847 -2.704 -0.536 -3.545 c 0.719 -1.941 0.195 -9.748 1.072 -12.848 c 1.692 -5.979 3.361 -21.142 4.231 -28.217 c 1.169 -9.53 -4.141 -22.308 -4.141 -22.308 c -1.163 -5.2 0.542 -23.727 0.542 -23.727 c 2.381 3.705 2.29 10.245 2.29 10.245 c -0.378 6.859 5.541 17.342 5.541 17.342 c 2.844 4.332 3.921 8.442 3.921 8.747 c 0 1.248 -0.273 4.269 -0.273 4.269 l 0.109 2.631 c 0.049 0.67 0.426 2.977 0.365 4.092 c -0.444 6.862 0.646 5.571 0.646 5.571 c 0.92 0 1.931 -5.522 1.931 -5.522 c 0 1.424 -0.348 5.687 0.42 7.295 c 0.919 1.918 1.595 -0.329 1.607 -0.78 c 0.243 -8.737 0.768 -6.448 0.768 -6.448 c 0.511 7.088 1.139 8.689 2.265 8.135 c 0.853 -0.407 0.073 -8.506 0.073 -8.506 c 1.461 4.811 2.569 5.577 2.569 5.577 c 2.411 1.693 0.92 -2.983 0.585 -3.909 c -1.784 -4.92 -1.839 -6.625 -1.839 -6.625 c 2.229 4.421 3.909 4.257 3.909 4.257 c 2.174 -0.694 -1.9 -6.954 -4.287 -9.953 c -1.218 -1.528 -2.789 -3.574 -3.245 -4.789 c -0.743 -2.058 -1.304 -8.674 -1.304 -8.674 c -0.225 -7.807 -2.155 -11.198 -2.155 -11.198 c -3.3 -5.282 -3.921 -15.135 -3.921 -15.135 l -0.146 -16.635 c -1.157 -11.347 -9.518 -11.429 -9.518 -11.429 c -8.451 -1.258 -9.627 -3.988 -9.627 -3.988 c -1.79 -2.576 -0.767 -7.514 -0.767 -7.514 c 1.485 -1.208 2.058 -4.415 2.058 -4.415 c 2.466 -1.891 2.345 -4.658 1.206 -4.628 c -0.914 0.024 -0.707 -0.733 -0.707 -0.733 C 115.068 0.636 104.01 0 104.01 0 h -1.688 c 0 0 -11.063 0.636 -9.523 13.089 c 0 0 0.207 0.758 -0.715 0.733 c -1.136 -0.03 -1.242 2.737 1.215 4.628 c 0 0 0.572 3.206 2.058 4.415 c 0 0 1.023 4.938 -0.767 7.514 c 0 0 -1.172 2.73 -9.627 3.988 c 0 0 -8.375 0.082 -9.514 11.429 l -0.158 16.635 c 0 0 -0.609 9.853 -3.922 15.135 c 0 0 -1.921 3.392 -2.143 11.198 c 0 0 -0.563 6.616 -1.303 8.674 c -0.451 1.209 -2.021 3.255 -3.249 4.789 c -2.408 2.993 -6.455 9.24 -4.29 9.953 c 0 0 1.689 0.164 3.909 -4.257 c 0 0 -0.046 1.693 -1.827 6.625 c -0.35 0.914 -1.839 5.59 0.573 3.909 c 0 0 1.117 -0.767 2.569 -5.577 c 0 0 -0.779 8.099 0.088 8.506 c 1.133 0.555 1.751 -1.047 2.262 -8.135 c 0 0 0.524 -2.289 0.767 6.448 c 0.012 0.451 0.673 2.698 1.596 0.78 c 0.779 -1.608 0.429 -5.864 0.429 -7.295 c 0 0 0.999 5.522 1.933 5.522 c 0 0 1.099 1.291 0.648 -5.571 c -0.073 -1.121 0.32 -3.422 0.369 -4.092 l 0.106 -2.631 c 0 0 -0.274 -3.014 -0.274 -4.269 c 0 -0.311 1.078 -4.415 3.921 -8.747 c 0 0 5.913 -10.488 5.532 -17.342 c 0 0 -0.082 -6.54 2.299 -10.245 c 0 0 1.69 18.526 0.545 23.727 c 0 0 -5.319 12.778 -4.146 22.308 c 0.864 7.094 2.53 22.237 4.226 28.217 c 0.886 3.094 0.362 10.899 1.072 12.848 c 0.32 0.847 0.152 1.627 -0.536 3.545 c -2.387 6.71 -2.083 11.436 3.921 29.24 c 0 0 1.848 3.945 0.914 11.033 c 0 0 -3.836 7.892 -1.379 8.05 c 0 0 0.192 0.523 1.023 0.109 c 0 0 1.327 1.37 2.761 0.627 c 0 0 1.328 1.06 2.463 0.116 c 0 0 0.91 1.047 2.237 0.201 c 0 0 1.742 1.175 2.777 -0.098 c 0 0 1.839 0.408 -1.435 -7.886 c 0 0 -1.254 -8.793 -1.945 -10.522 c -1.318 -3.275 -0.387 -12.251 -0.106 -14.175 c 0.453 -3.216 0.21 -8.695 -0.618 -12.934 c -0.606 -3.038 1.035 -8.774 1.641 -12.3 c 1.245 -7.423 3.685 -26.373 3.38 -29.959 l 1.008 0.354 C 103.809 118.312 104.265 117.959 104.265 117.959 Z";

// Body parts with approximate coordinates based on the SVG viewBox (0 0 206.326 206.326)
const BODY_PARTS = [
    {
        id: 'Head',
        label: 'Head',
        touchArea: { x: 75, y: 0, width: 56, height: 50 },
        cx: 103,
        cy: 25
    },
    {
        id: 'Neck',
        label: 'Neck',
        touchArea: { x: 88, y: 45, width: 30, height: 20 },
        cx: 103,
        cy: 55
    },
    {
        id: 'Arm R',
        label: 'Arm R',
        touchArea: { x: 120, y: 60, width: 40, height: 50 },
        cx: 140,
        cy: 85
    },
    {
        id: 'Arm L',
        label: 'Arm L',
        touchArea: { x: 46, y: 60, width: 40, height: 50 },
        cx: 66,
        cy: 85
    },
    {
        id: 'Hand R',
        label: 'Hand R',
        touchArea: { x: 135, y: 105, width: 25, height: 20 },
        cx: 147,
        cy: 115
    },
    {
        id: 'Hand L',
        label: 'Hand L',
        touchArea: { x: 46, y: 105, width: 25, height: 20 },
        cx: 59,
        cy: 115
    },
    {
        id: 'Thorax',
        label: 'Thorax',
        touchArea: { x: 80, y: 60, width: 46, height: 50 },
        cx: 103,
        cy: 85
    },
    {
        id: 'Abdomen',
        label: 'Abdomen',
        touchArea: { x: 85, y: 110, width: 36, height: 50 },
        cx: 103,
        cy: 135
    },
    {
        id: 'Leg R',
        label: 'Leg R',
        touchArea: { x: 95, y: 160, width: 25, height: 45 },
        cx: 107,
        cy: 182
    },
    {
        id: 'Leg L',
        label: 'Leg L',
        touchArea: { x: 86, y: 160, width: 25, height: 45 },
        cx: 99,
        cy: 182
    },
    {
        id: 'Foot R',
        label: 'Foot R',
        touchArea: { x: 100, y: 200, width: 20, height: 6 },
        cx: 110,
        cy: 203
    },
    {
        id: 'Foot L',
        label: 'Foot L',
        touchArea: { x: 86, y: 200, width: 20, height: 6 },
        cx: 96,
        cy: 203
    },
];

export default function BodyPartSelector() {
    const [selectedPart, setSelectedPart] = useState(null);

    const handlePartPress = (partId) => {
        setSelectedPart(partId === selectedPart ? null : partId);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Select Body Part</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <HumanBodyMap
                    onSelect={(part) => {
                        console.log("Selected Body Part:", part);
                    }}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.whiteColor,
    },
    header: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderColor,
        backgroundColor: COLORS.whiteColor,
    },
    title: {
        fontSize: 20,
        fontFamily: FONTS.medium,
        color: COLORS.textColor,
        textAlign: 'center',
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    svgContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
        position: 'relative',
    },
    listContainer: {
        width: '100%',
        marginTop: 20,
    },
    listTitle: {
        fontSize: 18,
        fontFamily: FONTS.medium,
        color: COLORS.textColor,
        marginBottom: 15,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginVertical: 5,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
    },
    listItemSelected: {
        backgroundColor: COLORS.primary + '20',
    },
    indicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.borderColor,
        marginRight: 12,
    },
    indicatorSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    listItemText: {
        fontSize: 16,
        fontFamily: FONTS.regular,
        color: COLORS.textColor,
    },
    listItemTextSelected: {
        fontFamily: FONTS.medium,
        color: COLORS.primary,
    },
    selectedContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: COLORS.primary + '20',
        borderRadius: 8,
        width: '100%',
    },
    selectedText: {
        fontSize: 16,
        fontFamily: FONTS.medium,
        color: COLORS.primary,
        textAlign: 'center',
    },
    touchOverlay: {
        position: 'absolute',
    },
});
