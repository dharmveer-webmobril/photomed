import { StyleSheet, Alert } from 'react-native';
import React, { useState } from 'react';
import WrapperContainer from '../../components/WrapperContainer';
import commonStyles from '../../styles/commonStyles';
import COLORS from '../../styles/colors';
import FONTS from '../../styles/fonts';
import { moderateScale, verticalScale } from '../../styles/responsiveLayoute';
import AppTextInput from '../../components/AppTextInput';
import CustomBtn from '../../components/CustomBtn';
import { goBack } from '../../navigators/NavigationService';
import { useChangePasswordMutation } from '../../redux/api/user';
import { useSelector } from 'react-redux';
import Loading from '../../components/Loading';
import Toast from 'react-native-simple-toast'
import { logout } from '../../redux/slices/authSlice';

const ChangePassword = () => {
    const token = useSelector((state) => state?.auth?.user);
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // State for toggling secureTextEntry
    const [showCurrentPassword, setShowCurrentPassword] = useState(true);
    const [showNewPassword, setShowNewPassword] = useState(true);
    const [showConfirmPassword, setShowConfirmPassword] = useState(true);

    const [changePasswordMutation, { isLoading, error }] = useChangePasswordMutation();

    if (error?.data?.isDeleted || error?.data?.status === 2) {
        dispatch(logout());
        Toast.show('Your account is deactivated. Please contact the administrator.')
        // console.log(error?.data?.isDeleted,error?.data?.status)
      }

    // Validation logic
    const validateFields = () => {
        if (currentPassword.trim() === '') {
            Toast.show('Please enter your current password');
            return false;
        }
        if (password.trim() === '') {
            Toast.show('Please enter a new password');
            return false;
        }
        if (password.length < 6) {
            Toast.show('Password must be at least 6 characters long');
            return false;
        }
        if (confirmPassword.trim() === '') {
            Toast.show('Please confirm your new password');
            return false;
        }
        if (password !== confirmPassword) {
            Toast.show('Passwords do not match');
            return false;
        }
        return true;
    };

    const handleChangePassword = async () => {
        if (!validateFields()) return;

        try {
            const response = await changePasswordMutation({
                token,
                old_password: currentPassword,
                new_password: password,
            }).unwrap();
            if (response.succeeded) {
                Toast.show(response.ResponseMessage)
                goBack()
            } else {
                Toast.show(response.ResponseMessage)
            }
        } catch (error) {
            console.error('Change Password Error:', error);
            Toast.show('Failed to update password. Please try again.');
        }
    };

    return (
        <WrapperContainer
            wrapperStyle={[commonStyles.innerContainer, styles.container]}
        >
            <Loading visible={isLoading} />
            <AppTextInput
                rightIcon
                placeHolderTxtColor={COLORS.placeHolderTxtColor}
                lable={'Current Password'}
                placeholder={'Enter your current password'}
                secureTextEntry={showCurrentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                toggleSecureTextEntry={() => setShowCurrentPassword(!showCurrentPassword)}
            />
            <AppTextInput
                rightIcon
                placeHolderTxtColor={COLORS.placeHolderTxtColor}
                lable={'New Password'}
                placeholder={'Please enter a new password'}
                secureTextEntry={showNewPassword}
                value={password}
                onChangeText={setPassword}
                toggleSecureTextEntry={() => setShowNewPassword(!showNewPassword)}
            />
            <AppTextInput
                rightIcon
                placeHolderTxtColor={COLORS.placeHolderTxtColor}
                lable={'Confirm New Password'}
                placeholder={'Please confirm your new password'}
                secureTextEntry={showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                toggleSecureTextEntry={() => setShowConfirmPassword(!showConfirmPassword)}
            />
            <CustomBtn
                onPress={handleChangePassword}
                title={'Update Password'}
                btnStyle={{ marginTop: verticalScale(140) }}
                loading={isLoading}
            />
        </WrapperContainer>
    );
};

export default ChangePassword;


const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    profileContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    userIcon: {
        height: 80,
        width: 80,
        borderRadius: 80,
        borderColor: COLORS.primary,
        borderWidth: 2,
    },
    editIconContainer: {
        borderRadius: 25,
        backgroundColor: COLORS.primary,
        position: 'absolute',
        right: -10,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 3,
        borderColor: COLORS.whiteColor,
        borderWidth: 0.5,
    },
    cardStyle: {
        ...commonStyles.flexView,
        justifyContent: 'space-between',
        borderColor: COLORS.textColor,
        borderRadius: 5,
        borderWidth: 1,
        padding: 10,
        width: '100%',
        paddingHorizontal: moderateScale(20),
        marginBottom: verticalScale(20),
    },
    txtStyle: {
        fontSize: 12,
        color: COLORS.textColor,
        fontFamily: FONTS.medium,
    },
    titleStyle: {
        fontFamily: FONTS.semiBold,
        color: COLORS.textColor,
        fontSize: 12,
        marginTop: verticalScale(10),
        marginBottom: verticalScale(20),
    },
});
