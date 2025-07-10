import {  Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react'
import COLORS from '../styles/colors'
import { moderateScale, verticalScale } from '../styles/responsiveLayoute'
import CustomBtn from './CustomBtn'
import CrossIcon from '../assets/SvgIcons/CrossIcon';
import AppTextInput from './AppTextInput';

const AddTagModal = ({visible,onClose,newtag, placeholder,label,onChangeText,error,onsubmit,isLoading}) => {
  return (
    <Modal
        transparent
        visible={visible}>
        <View style={styles.modalBg}>
          <View style={styles.popUpContainer}>
            <Pressable onPress={() => {onClose()}} style={{ position: 'absolute', right: 0, top: 0, backgroundColor: COLORS.whiteColor, padding: 5, borderRadius: 20 }}>
              <CrossIcon />
            </Pressable>
            <View style={{ marginTop: 40 }}>
              <AppTextInput
                lable={label}
                maxLength={25}
                value={newtag}
                onChangeText={(text) => {
                  onChangeText(text)
                }}
                placeholder={placeholder}
                placeHolderTxtColor={COLORS.placeHolderTxtColor}
              />
              {
                <Text style={{ marginTop: -18, fontSize: 12, color: "red" }}>{error}</Text>
              }
            </View>
            <CustomBtn
            isLoadin={isLoading}
              onPress={() => {
                onsubmit()
              }}
              btnStyle={{ marginTop: 20, marginBottom: 20 }}
              title="Add"
            />
          </View>
        </View>
      </Modal>
  )
}

export default AddTagModal

const styles = StyleSheet.create({
   
  popUpContainer: {
    backgroundColor: COLORS.whiteColor,
    borderRadius: 10,
    padding: moderateScale(20),
    justifyContent: 'space-between',
    paddingVertical: verticalScale(15),
    width: '100%'
  },
  modalBg: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    padding: moderateScale(25) 
  },
});
