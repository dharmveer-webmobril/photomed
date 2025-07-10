import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import COLORS from '../styles/colors'
import { moderateScale, verticalScale } from '../styles/responsiveLayoute'
import FONTS from '../styles/fonts'
import commonStyles from '../styles/commonStyles'
import CheckIcon from '../assets/SvgIcons/CheckIcon'
import CrossIcon from '../assets/SvgIcons/CrossIcon'

const RecordAddedPopUp = ({ visible, onPressCancel }) => {
    return (
        <Modal
            transparent
            visible={visible}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: moderateScale(40) }}>
                <View style={styles.popUpContainer}>
                    <TouchableOpacity onPress={onPressCancel}
                    style={styles.crossIcon}>
                        <CrossIcon />
                    </TouchableOpacity>
                    <CheckIcon />
                    <Text style={[styles.txtStyle, { marginVertical: verticalScale(10) }]}>Patient Record Added</Text>
                    <Text style={[styles.txtStyle, { marginBottom: verticalScale(30) }]}>The patient record has been successfully
                        added to the system.</Text>
                </View>
            </View>
        </Modal>
    )
}

export default RecordAddedPopUp

const styles = StyleSheet.create({
    popUpContainer: {
        backgroundColor: COLORS.whiteColor,
        borderRadius: 10,
        padding: moderateScale(20),
        justifyContent: 'space-between',
        paddingVertical: verticalScale(10),
        width: '100%',
        alignItems: 'center'
    }, txtStyle: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.textColor,
        textAlign: 'center'
    },
    actionTxt: {
        fontFamily: FONTS.medium,
        color: COLORS.primary,
        fontSize: 12
    },
    crossIcon: {
        position: 'absolute',
        right: moderateScale(15),
        top: verticalScale(10)
    }
})