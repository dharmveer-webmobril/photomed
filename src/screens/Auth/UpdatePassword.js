import { Image, StyleSheet, Text, View } from 'react-native';
import React, { useState } from 'react';
import WrapperContainer from '../../components/WrapperContainer';
import { imagePath } from '../../configs/imagePath';
import commonStyles from '../../styles/commonStyles';
import AppTextInput from '../../components/AppTextInput';
import { verticalScale } from '../../styles/responsiveLayoute';
import CustomBtn from '../../components/CustomBtn';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import ScreenName from '../../configs/screenName';
import { useResetPasswordOTPCodeMutation } from '../../redux/api/user';
import { navigate } from '../../navigators/NavigationService';
import Loading from '../../components/Loading';
import { useSelector } from 'react-redux';
import Toast from 'react-native-simple-toast'


const UpdatePassword = (props) => {
    const token = props.route.params.token;
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const isConnected = useSelector((state) => state.network.isConnected);


    // State for password visibility
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const [requestPasswordMutation, { isLoading }] = useResetPasswordOTPCodeMutation();

    const validateFields = () => {
        if (password.trim() === '') {
            Toast.show('Please enter a password');
            return false;
        }
        if (password.length < 6) {
            Toast.show('Password must be at least 6 characters long');
            return false;
        }
        if (confirmPassword.trim() === '') {
            Toast.show('Please confirm your password');
            return false;
        }
        if (password !== confirmPassword) {
            Toast.show('Passwords do not match');
            return false;
        }
        return true;
    };

    const handleResetPassword = async () => {
        if (!isConnected) {
            Toast.show('No internet connection. Please try again.');
            return;
        }
        if (!validateFields()) return;
        try {
            const response = await requestPasswordMutation({ token: token, password: password });
            // console.log('reset password response', response);
            
            if (response.data?.succeeded) {
                Toast.show(response.data.ResponseMessage);
                // Navigate to the next screen.
                navigate(ScreenName.LOGIN);
            } else {
                Toast.show(response.data?.error.ResponseMessage || 'something went wrong');
            }
        } catch (error) {
            console.error('Update Password Error:', error);
            Toast.show('Something went wrong');
        }
    };

    return (
        <WrapperContainer wrapperStyle={[commonStyles.innerContainer, styles.container]}>
            <Loading visible={isLoading}/>
            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContentContainer}
                extraScrollHeight={10}
            >
                <Image source={imagePath.logo} style={styles.logoStyle} />
                <Text style={commonStyles.authTitleStyle}>Update Password</Text>
                <Text style={commonStyles.authSbTitleStyle}>Please create your new password</Text>
                
                <AppTextInput
                    rightIcon
                    value={password}
                    onChangeText={(txt) => setPassword(txt)}
                    placeholder={'New Password'}
                    leftIcon={imagePath.lock}
                    secureTextEntry={!isPasswordVisible}
                    toggleSecureTextEntry={() => setIsPasswordVisible((prev) => !prev)}
                />
                
                <AppTextInput
                    rightIcon
                    value={confirmPassword}
                    onChangeText={(txt) => setConfirmPassword(txt)}
                    placeholder={'Confirm Password'}
                    leftIcon={imagePath.lock}
                    secureTextEntry={!isConfirmPasswordVisible}
                    toggleSecureTextEntry={() => setIsConfirmPasswordVisible((prev) => !prev)}
                />
                
                <CustomBtn onPress={handleResetPassword}
                    title={'Continue'} btnStyle={{ marginTop: verticalScale(80) }} />
            </KeyboardAwareScrollView>
        </WrapperContainer>
    );
}

export default UpdatePassword;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 30,
        padding: 0
    },
    logoStyle: {
        height: 120,
        width: 120,
        marginBottom: verticalScale(30)
    },
    scrollViewContentContainer: {
        flexGrow: 1,
        width: '100%',
        alignItems: 'center'
    }
});
