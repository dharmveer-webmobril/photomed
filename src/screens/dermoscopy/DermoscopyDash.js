import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { goBack, navigate } from '../../navigators/NavigationService';
import ImageCropPicker from 'react-native-image-crop-picker';

export default function DermoscopyDash() {


    const openCamera = () => {
        ImageCropPicker.openCamera({
            cropping: true,
            mediaType: 'photo',
        }).then(image => {
            console.log(image);
            navigate('MarkableImage', {
                image: image
            })
        }).catch(e => console.log('Error capturing image:', e));
    };

    

    return (
        <View style={{ flex: 1 }}>

            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => goBack()} style={{ marginLeft: 10 }}>
                    <Image
                        style={styles.backIcon}
                        source={require("../../assets/images/icons/backIcon.png")}
                    />
                </TouchableOpacity>
                <Text style={styles.title}>
                    Patient Details
                </Text>
                <TouchableOpacity onPress={() => openCamera()} style={styles.rightIcon}>
                    <Image
                        style={[styles.backIcon, { tintColor: '#fff' }]}
                        source={require("../../assets/images/icons/backIcon.png")}
                    />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
        backgroundColor: '#fff',
        paddingBottom: 8
    },
    title: {
        fontSize: 15, color: "#424242", marginLeft: -30
    },
    backIcon: { height: 30, width: 30 },
    rightIcon: { marginRight: 10, height: 30, width: 30, backgroundColor: '#32327C', borderRadius: 8 }
})