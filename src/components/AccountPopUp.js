import { Modal, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import COLORS from '../styles/colors'
import { moderateScale, verticalScale } from '../styles/responsiveLayoute'
import FONTS from '../styles/fonts'
import commonStyles from '../styles/commonStyles'
import CustomBtn from './CustomBtn'

const AccountPopUp = ({visible,onPressSuccess,onPressCancel,title, subTitle}) => {
  return (
    <Modal
      transparent
      visible={visible}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)',padding:moderateScale(40) }}>
        <View style={styles.popUpContainer}>
            <Text style={[styles.txtStyle,{fontSize:16}]}>{title}</Text>
            <Text style={[styles.txtStyle,{fontSize:12}]}>{subTitle}</Text>
            <View style={[commonStyles.flexView,{justifyContent:'space-between',marginVertical:verticalScale(5)}]}>
                <CustomBtn onPress={onPressSuccess}
                title={'Yes'}
                titleStyle={{fontSize:13}}
                btnStyle={{height:30,width:90}}/>
                <CustomBtn onPress={onPressCancel}
                title={'No'}
                titleStyle={{fontSize:13,color:COLORS.primary,fontFamily:FONTS.medium}}
                btnStyle={styles.cancelbtn}/>
            </View>
        </View>
      </View>
    </Modal>
  )
}

export default AccountPopUp

const styles = StyleSheet.create({
    popUpContainer:{
        height:182,
        backgroundColor:COLORS.whiteColor,
        borderRadius:10,
        padding:moderateScale(40),
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