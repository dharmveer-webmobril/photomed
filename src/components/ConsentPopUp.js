import { Modal, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import COLORS from '../styles/colors'
import { moderateScale, verticalScale } from '../styles/responsiveLayoute'
import FONTS from '../styles/fonts'
import commonStyles from '../styles/commonStyles'
import CustomBtn from './CustomBtn'

const ConsentPopUp = ({visible,onPressSuccess,title, subTitle}) => {
  return (
    <Modal
      transparent
      visible={visible}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)',padding:moderateScale(40) }}>
        <View style={styles.popUpContainer}>
            <Text style={[styles.txtStyle,{fontSize:16,fontFamily:FONTS.bold,textDecorationLine:'underline'}]}>{title}</Text>
            <Text style={[styles.txtStyle,{fontSize:12}]}>We require your consent to store your medical images on Google Drive and Dropbox. These platforms are used to ensure safe and reliable
            storage of your data. Your information will be handled in compliance with privacy
            regulations.</Text>
            <View style={[commonStyles.flexView,{justifyContent:'center',marginVertical:verticalScale(5)}]}>
                <CustomBtn onPress={onPressSuccess}
                title={'OK'}
                titleStyle={{fontSize:13}}
                btnStyle={{height:30,width:90,marginTop:10}}/>
            </View>
        </View>
      </View>
    </Modal>
  )
}

export default ConsentPopUp

const styles = StyleSheet.create({
    popUpContainer:{
        backgroundColor:COLORS.whiteColor,
        borderRadius:10,
        padding:moderateScale(25),
        justifyContent:'space-between',
        paddingVertical:verticalScale(15),
        width:'100%'
    },txtStyle:{
        fontFamily:FONTS.medium,
        fontSize:14,
        color:COLORS.textColor,
        textAlign:'center'
    },cancelbtn:{
        backgroundColor:COLORS.whiteColor,
        borderWidth:1,
        borderColor:COLORS.primary,
        height:30,
        width:90
    }
})