import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import COLORS from '../styles/colors'
import { moderateScale, scale, verticalScale } from '../styles/responsiveLayoute'
import FONTS from '../styles/fonts'
import commonStyles from '../styles/commonStyles'

const DeleteImagePopUp = ({ visible, onPressDelete, onPressCancel, title, cancel = 'Cancel', deleteTxt = 'Delete', subtitle = 'This action cannot be undone.' }) => {
  return (
    <Modal
      transparent
      visible={visible}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: scale(20) }}>
        <View style={styles.popUpContainer}>
          <Text style={styles.txtStyle}>{title}</Text>
          <Text style={[styles.desStyle, { fontFamily: FONTS.regular }]}>{subtitle}</Text>
          <View style={[commonStyles.flexView, { alignSelf: 'flex-end', marginTop: verticalScale(10) }]}>
            <TouchableOpacity style={{paddingHorizontal:10,marginRight: moderateScale(20)}}>
              <Text onPress={onPressCancel} style={[styles.actionTxt]}>{cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{paddingHorizontal:10}}>
              <Text onPress={onPressDelete} style={[styles.actionTxt]}>{deleteTxt}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default DeleteImagePopUp

const styles = StyleSheet.create({
  popUpContainer: {
    backgroundColor: COLORS.whiteColor,
    borderRadius: 10,
    paddingHorizontal: moderateScale(20),
    justifyContent: 'space-between',
    paddingVertical: verticalScale(15),
    width: '100%'
  }, 
  txtStyle: {
    fontFamily: FONTS.medium,
    fontSize: 18,
    color: COLORS.textColor,
    marginTop:verticalScale(10)
  },
  desStyle: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.textColor,
    marginTop:verticalScale(10)
  },
  actionTxt: {
    fontFamily: FONTS.medium,
    color: COLORS.primary,
    fontSize: 16
  }
})