import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import COLORS from '../styles/colors'
import { moderateScale, verticalScale } from '../styles/responsiveLayoute'
import FONTS from '../styles/fonts'
import CamIcon from '../assets/SvgIcons/CamIcon'
import GallIcon from '../assets/SvgIcons/GallIcon'
import CustomBtn from './CustomBtn'
import commonStyles from '../styles/commonStyles'

const ChooseImagePopUp = ({
    visible,
    onPressCamera,
    onPressGallery,
    onPressCancel,
}) => {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={onPressCancel}
        >
            <View style={styles.overlay}>

                {/* Tap outside to close */}
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onPressCancel}
                />

                {/* Bottom Sheet */}
                <View style={styles.bottomSheet}>

                    {/* Handle */}
                    <View style={styles.handle} />

                    <View
                        style={[
                            commonStyles.flexView,
                            { justifyContent: 'space-between', marginVertical: verticalScale(10) },
                        ]}
                    >
                        <TouchableOpacity
                            onPress={onPressCamera}
                            style={styles.option}
                        >
                            <CamIcon />
                            <Text style={styles.txtStyle}>Camera</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onPressGallery}
                            style={styles.option}
                        >
                            <GallIcon />
                            <Text style={styles.txtStyle}>Gallery</Text>
                        </TouchableOpacity>
                    </View>

                    <CustomBtn
                        onPress={onPressCancel}
                        btnStyle={styles.cancelBtn}
                        titleStyle={{ fontSize: 12 }}
                        title="Cancel"
                    />
                </View>
            </View>
        </Modal>
    )
}

export default ChooseImagePopUp
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },

    backdrop: {
        flex: 1,
    },

    bottomSheet: {
        backgroundColor: COLORS.whiteColor,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingVertical: verticalScale(20),
        paddingHorizontal: moderateScale(30),
    },

    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#ccc',
        alignSelf: 'center',
        marginBottom: verticalScale(10),
    },

    option: {
        justifyContent: 'center',
        alignItems: 'center',
    },

    txtStyle: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: COLORS.textColor,
        textAlign: 'center',
        marginTop: 4,
    },

    cancelBtn: {
        marginTop: verticalScale(20),
        height: 35,
    },
})
