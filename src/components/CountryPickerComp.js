
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native'
import React from 'react'
import AppTextInput from "./AppTextInput";
import { CountryPicker,countryCodes } from "react-native-country-codes-picker";
import COLORS from '../styles/colors';
import { imagePath } from '../configs/imagePath';

export default function CountryPickerComp({ isPickerOpen, closeCountryPicker, openCountryPicker, onInputChange, inputText, setCountryCode, countryCode }) {
console.log('countryCodecountryCode',countryCode);

    return (
        <>
            <View style={styles.countryInputContainer}>
                <TouchableOpacity
                    onPress={() => { openCountryPicker(!isPickerOpen) }}
                    style={[styles.countryInputLeftContainer, (Platform.OS == 'ios' && Platform.isPad) && { marginLeft: 50 }]}>
                    <Text style={styles.countryText}>{countryCode}</Text>
                    <Image style={styles.coutryInputLeftDropDown} source={imagePath.rightArrow} />
                </TouchableOpacity>
                <View style={{ height: 40.5, width: '80%' }}>
                    <AppTextInput
                        keyboardType={"number-pad"}
                        label={"Phone Number"}
                        leftIconStyle={{ display: 'none' }}
                        inputContainerStyle={{ borderWidth: 0, width: '100%', marginTop: Platform.OS == 'ios' ? -2 : 1.2 }}
                        placeHolderTxtColor={COLORS.placeHolderTxtColor}
                        placeholder={"Enter phone number"}
                        value={inputText}
                        onChangeText={(val) => { onInputChange(val) }}
                        textInputStyle={{ paddingLeft: 5 }}
                    />
                </View>
            </View>
            <CountryPicker
                show={isPickerOpen}
                onRequestClose={() => { closeCountryPicker(false) }}
                style={{
                    modal: {
                        height: '60%',
                        backgroundColor: '#fff'
                    },
                    textInput: {
                        height: 50,
                        borderRadius: 3,
                        color: '#000000'
                    },
                    countryButtonStyles: {
                        height: 50
                    },
                    dialCode: {
                        color: '#000'
                    },
                    countryName: {
                        color: '#000000'
                    }
                }}
                pickerButtonOnPress={(item) => {
                    console.log('itemitem--',item)
                    setCountryCode(item.dial_code);
                    closeCountryPicker(false)
                }}
            />
        </>
    )
}
const styles = StyleSheet.create({
    countryInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: 'center',
        borderColor: COLORS.borderColor,
        borderWidth: 1,
        marginBottom: 20,
        borderRadius: 5,
    },
    countryInputLeftContainer: {
        height: 40.5,
        width: '20%',
        justifyContent: (Platform.OS == 'ios' && Platform.isPad) ? 'flex-start' : 'center',
        alignItems: 'center',
        flexDirection: "row",

    },
    countryText: {
        color: COLORS.placeHolderTxtColor,
        fontSize: 12,
        color: COLORS.textColor,
    },
    coutryInputLeftDropDown: {
        marginLeft: 8,
        transform: [{ rotate: '90deg' }],
        tintColor: COLORS.textColor,
    }
});