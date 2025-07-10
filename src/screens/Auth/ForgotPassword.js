import { Image, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import WrapperContainer from '../../components/WrapperContainer'
import { imagePath } from '../../configs/imagePath'
import commonStyles from '../../styles/commonStyles'
import AppTextInput from '../../components/AppTextInput'
import { verticalScale } from '../../styles/responsiveLayoute'
import CustomBtn from '../../components/CustomBtn'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import ScreenName from '../../configs/screenName'
import { navigate } from '../../navigators/NavigationService'
import { useRequestCodeMutation } from '../../redux/api/user'
import { validateEmail } from '../../components/Validation'
import Loading from '../../components/Loading'
import { useSelector } from 'react-redux'
import Toast from 'react-native-simple-toast'


const ForgotPassword = () => {
    const [requestCodeMutation, { isLoading }] = useRequestCodeMutation();
    const [email, setEmail] = useState('')
    const isConnected = useSelector((state) => state.network.isConnected);



    const validateFields = () => {
        if (email.trim() === '') {
            Toast.show('Please enter email address');
            return false;
        }
        if (!validateEmail(email.trim())) {
            Toast.show('Please enter a valid email address');
            return false;
        }
        return true;
    };

    const handleSendOtp = async () => {
        if (!isConnected) {
            Toast.show('No internet connection. Please try again.');
            return;
        }
        if (!validateFields()) return;

        // Proceed with API call or further actions
        try {
            const response = await requestCodeMutation({ email });
            if (response.data?.succeeded) {
                // Toast.show(`Your otp is : ${response.data.ResponseBody.otp}`);
                // Toast.show(response.data.ResponseMessage);
                navigate(ScreenName.OTP_VERIFICATION,{screenName:ScreenName.OTP_VERIFICATION,userToken:response.data.ResponseBody.token,email:email})
                // Handle successful registration logic
            } else {
                Toast.show(response.data?.ResponseMessage || 'Something went wrong');
            }
        } catch (error) {
            console.error('Registration Error:', error);
        }
    };


    return (
        <WrapperContainer wrapperStyle={[commonStyles.innerContainer, styles.container]}>
            <Loading visible={isLoading}/>
            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContentContainer}
                extraScrollHeight={10}
            // enableOnAndroid={true}
            >
                <Image source={imagePath.logo} style={styles.logoStyle} />
                <Text style={commonStyles.authTitleStyle}>Forgot Password</Text>
                <Text style={commonStyles.authSbTitleStyle}>Please enter your Email</Text>
                <AppTextInput 
                value={email}
                keyboardType={'email-address'}
                onChangeText={(txt) => setEmail(txt)}
                placeholder={'Enter Email'}
                    leftIcon={imagePath.email} />
                <CustomBtn onPress={handleSendOtp}
                title={'Send OTP'} btnStyle={{ marginTop: verticalScale(130) }} />
            </KeyboardAwareScrollView>
        </WrapperContainer>
    )
}

export default ForgotPassword

const styles = StyleSheet.create({
    container: {
        // alignItems: 'center',
        paddingHorizontal: 30,
        padding:0
    }, logoStyle: {
        height: 120,
        width: 120,
        marginBottom: verticalScale(30)
    },
    scrollViewContentContainer: {
        flexGrow: 1,
        width: '100%',
        alignItems: 'center'
    }
})