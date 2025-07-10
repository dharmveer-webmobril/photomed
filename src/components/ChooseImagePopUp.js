import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import COLORS from '../styles/colors'
import { moderateScale, verticalScale } from '../styles/responsiveLayoute'
import FONTS from '../styles/fonts'
import CamIcon from '../assets/SvgIcons/CamIcon'
import GallIcon from '../assets/SvgIcons/GallIcon'
import CustomBtn from './CustomBtn'
import commonStyles from '../styles/commonStyles'

const ChooseImagePopUp = ({ visible, onPressCamera, onPressGallery, onPressCancel }) => {
    return (
        <Modal
            transparent
            visible={visible}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: moderateScale(40) }}>
                <View style={styles.popUpContainer}>
                    <View style={[commonStyles.flexView,{justifyContent:'space-between',marginVertical:verticalScale(5)}]}>
                    <TouchableOpacity onPress={onPressCamera}
                    style={{justifyContent:'center',alignItems:'center'}}>
                        <CamIcon/>
                        <Text style={styles.txtStyle}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onPressGallery}
                    style={{justifyContent:'center',alignItems:'center'}}>
                        <GallIcon/>
                        <Text style={styles.txtStyle}>Gallery</Text>
                    </TouchableOpacity>
                    </View>
                    <CustomBtn 
                    onPress={onPressCancel}
                    btnStyle={{marginTop:verticalScale(20),height:30}} 
                    titleStyle={{fontSize:12}}
                    title={'Cancel'}/>
                </View>
            </View>
        </Modal>
    )
}

export default ChooseImagePopUp

const styles = StyleSheet.create({
    popUpContainer: {
        backgroundColor: COLORS.whiteColor,
        borderRadius: 10,
        padding: moderateScale(25),
        width: '90%',
        paddingHorizontal:moderateScale(40)
    }, txtStyle: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: COLORS.textColor,
        textAlign: 'center',
        marginTop:2
    },
})