import { Image, TextInput, View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import React from 'react';
import { imagePath } from '../configs/imagePath';
import COLORS from '../styles/colors';
import FONTS from '../styles/fonts';

const AppTextInput = ({
    leftIcon,
    keyboardType,
    value,
    placeholder,
    onChangeText,
    toggleSecureTextEntry,
    secureTextEntry,
    rightIcon,
    inputContainerStyle,
    textInputStyle,
    maxLength,
    leftIconStyle,
    editable=true,
    lable,
    placeHolderTxtColor = COLORS.textColor,
}) => {
    return (
        <View>
            {lable && <Text style={styles.lableStyle}>{lable}</Text>}
            <View style={[styles.textInputContainerStyle, inputContainerStyle, { backgroundColor: editable ? 'transparent' : '#e3e8e5' }]}>
                <Image
                    resizeMode='contain'
                    source={leftIcon}
                    style={[{ marginHorizontal: 9.5 }, leftIconStyle]}
                />
                <TextInput
                    style={[styles.textinputStyle, textInputStyle]}
                    keyboardType={keyboardType}
                    placeholder={placeholder}
                    placeholderTextColor={placeHolderTxtColor}
                    value={value}
                    maxLength={maxLength}
                    onChangeText={onChangeText}
                    autoCapitalize="none"
                    editable={editable}
                    secureTextEntry={secureTextEntry} // Use the secureTextEntry prop
                />
                {rightIcon && (
                    <TouchableOpacity
                        style={{
                            justifyContent: 'center',
                            alignItems: 'flex-end',
                            padding: 9.5,
                        }}
                        onPress={toggleSecureTextEntry} // Call the handler on press
                    >
                        <Image
                            resizeMode='contain'
                            source={
                                secureTextEntry
                                    ? imagePath.eyeOff
                                    : imagePath.eye
                            }
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default AppTextInput;

const styles = StyleSheet.create({
    textInputContainerStyle: {
        borderColor: COLORS.borderColor,
        borderWidth: 1,
        width: '100%',
        borderRadius: 5,
        height: 40.5,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 5,
    },
    textinputStyle: {
        textAlignVertical: 'top',
        color: COLORS.textColor,
        fontSize: 12,
        flex: 1,
        height: 39,
    },
    lableStyle: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        color: COLORS.textColor,
        marginBottom: 10,
        marginLeft: 2,
    },
});
