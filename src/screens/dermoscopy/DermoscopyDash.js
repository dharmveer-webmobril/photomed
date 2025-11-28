import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    SafeAreaView,
    FlatList,
} from 'react-native';
import ImageCropPicker from 'react-native-image-crop-picker';
import { goBack, navigate } from '../../navigators/NavigationService';
import MenuData from '../../components/MenuData';

export default function DermoscopyDash() {
    const [body, setBody] = useState();

    const [bodyPart, setBodyPart] = useState([
        {
            title: 'Left Arm',
            parts: ['Upper Arm', 'Forearm', 'Hand'],
        },
        {
            title: 'Right Arm',
        },
        {
            title: 'Chest',
        },
        {
            title: 'Right Back',
        },
        {
            title: 'Left Back',
        },
    ]);

     

    const openCamera = (val) => {
        ImageCropPicker.openCamera({
            cropping: true,
            mediaType: 'photo',
        })
            .then((image) => {
                console.log(image);
                navigate('MarkableImage', {
                    body: val,
                });
            })
            .catch((e) => console.log('Error capturing image:', e));
    };

    const onPressPart = (part) => {
        console.log('Selected part:', part);
        navigate('MarkableImage', {
            body: part,
        });
    };

    const renderBodyBox = ({ item }) => (
        <TouchableOpacity onPress={() => onPressPart(item.title)} style={styles.bodyBox}>
            <Text style={styles.bodyTitle}>{item.title}</Text>

        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => goBack()} style={{ marginLeft: 10 }}>
                    <Image
                        style={styles.backIcon}
                        source={require('../../assets/images/icons/backIcon.png')}
                    />
                </TouchableOpacity>
                <Text style={styles.title}>Patient Details</Text>
                <TouchableOpacity style={styles.rightIcon}>
                    <MenuData onSelect={(value) => onPressMenuOption(value)} />
                </TouchableOpacity>
            </View>

            {/* Body parts grid */}
            <FlatList
                data={bodyPart}
                renderItem={renderBodyBox}
                keyExtractor={(item, index) => index.toString()}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        backgroundColor: '#fff',
        paddingVertical: 10,
    },
    title: {
        fontSize: 16,
        color: '#424242',
        fontWeight: '600',
    },
    backIcon: { height: 30, width: 30 },
    rightIcon: {
        marginRight: 10,
        height: 30,
        width: 30,
        backgroundColor: '#32327C',
        borderRadius: 8,
    },
    listContent: {
        paddingHorizontal: 10,
        paddingBottom: 20,
    },
    bodyBox: {
        flex: 1,
        backgroundColor: '#F7F8FA',
        borderRadius: 10,
        padding: 12,
        marginVertical: 8,
        marginHorizontal: 4,
        elevation: 2,
    },
    bodyTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#32327C',
        marginBottom: 8,
        textAlign: 'center',
    },
    partsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 6,
    },
    partButton: {
        backgroundColor: '#E0E0F8',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 8,
        margin: 4,
    },
    partText: {
        fontSize: 10,
        color: '#32327C',
        fontWeight: '500',
    },
});
