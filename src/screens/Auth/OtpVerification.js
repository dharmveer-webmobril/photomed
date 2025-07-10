import { Image, StyleSheet, Text, View } from 'react-native'
import React, { useRef, useState, useEffect } from 'react'
import WrapperContainer from '../../components/WrapperContainer'
import { imagePath } from '../../configs/imagePath'
import commonStyles from '../../styles/commonStyles'
import { verticalScale } from '../../styles/responsiveLayoute'
import COLORS from '../../styles/colors'
import CustomBtn from '../../components/CustomBtn'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import ScreenName from '../../configs/screenName'
import OTPTextView from 'react-native-otp-textinput'
import { navigate } from '../../navigators/NavigationService'
import { useRequestCodeMutation, useVerifyEmailMutation } from '../../redux/api/user'
import Loading from '../../components/Loading'
import { useDispatch, useSelector } from 'react-redux'
import { saveUserData } from '../../redux/slices/authSlice'
import Toast from 'react-native-simple-toast'
import FONTS from '../../styles/fonts'

const OtpVerification = (props) => {
    const dispatch = useDispatch()
    const [requestCodeMutation, { isLoading: loading }] = useRequestCodeMutation();
    const [token, setToken] = useState(props.route.params.userToken)
    const [verifyEmailMutation, { isLoading }] = useVerifyEmailMutation();
    const isConnected = useSelector((state) => state.network.isConnected);
    const preScreen = props.route.params.screenName
    const email = props.route.params.email

    const [otpInput, setOtpInput] = useState("");
    const input = useRef(null);
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);

    const clearInput = () => {
        if (input.current) {
            input.current.clear();
        }
    };

    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        } else {
            setCanResend(true);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleVerifyEmail = async () => {
        if (!isConnected) {
            Toast.show('No internet connection. Please try again.');
            return;
        }
        if (otpInput.trim().length < 1) {
            Toast.show('Please enter the OTP');
            return;
        }
        try {
            const response = await verifyEmailMutation({ token, otp: otpInput });
            if (response.data?.succeeded) {
                Toast.show(response.data.ResponseMessage);
                if (preScreen == ScreenName.SIGN_UP) {
                    console.log('response.data',response.data);
                    dispatch(saveUserData(response.data.ResponseBody.token))
                } else {
                    navigate(ScreenName.UPDATE_PASSWORD, { token: response.data.ResponseBody.token });
                }
            } else {
                Toast.show(response.error.data?.ResponseMessage);
            }
        } catch (error) {
            console.error('Verify Email Error:', error);
            Toast.show('Something went wrong');
        }
    };

    const handleResendOtp = async () => {
        if (canResend) {
            // Logic to resend the OTP (e.g., API call to resend OTP)
            if (!isConnected) {
                Toast.show('No internet connection. Please try again.');
                return;
            }

            // Proceed with API call or further actions
            try {
                const response = await requestCodeMutation({ email });
                // console.log('resend mail resss',response);

                if (response.data?.succeeded) {
                    setTimer(30);
                    setCanResend(false);
                    setOtpInput("");
                    clearInput();
                    // Toast.show(`Your otp is : ${response.data.ResponseBody.otp}`);
                    setToken(response.data.ResponseBody.token)
                    // Toast.show(response.data.ResponseMessage);
                    // Handle successful registration logic
                } else {
                    Toast.show(response.data?.ResponseMessage || 'Something went wrong');
                }
            } catch (error) {
                console.error('Registration Error:', error);
            }
        }
    };

    return (
        <WrapperContainer wrapperStyle={[commonStyles.innerContainer, styles.container]}>
            <Loading visible={isLoading || loading} />
            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContentContainer}
                extraScrollHeight={10}
            >
                <Image source={imagePath.logo} style={styles.logoStyle} />
                <Text style={commonStyles.authTitleStyle}>Verification</Text>
                <Text style={commonStyles.authSbTitleStyle}>Please enter the code we sent to your email</Text>
                <View style={{ width: '100%' }}>
                    <OTPTextView
                        containerStyle={{ paddingHorizontal: 20 }}
                        ref={input}
                        textInputStyle={styles.textInputContainer}
                        handleTextChange={setOtpInput}
                        inputCount={4}
                        keyboardType="numeric"
                        tintColor={COLORS.primary}
                        autoFocus
                    />
                </View>
                <Text style={[commonStyles.authSbTitleStyle, { alignSelf: 'flex-end', marginRight: 28, marginTop: 10 }]}>
                    Didn't receive an Code?{' '}
                    <Text onPress={handleResendOtp} style={{ fontFamily: FONTS.bold, textDecorationLine: 'underline', color: canResend ? COLORS.primary : COLORS.gray }}>
                        {canResend ? 'Resend Code' : `Resend in ${timer}s`}
                    </Text>
                </Text>
                <CustomBtn onPress={handleVerifyEmail}
                    title={'Verify Code'} btnStyle={{ marginTop: verticalScale(130), width: '85%' }} />
            </KeyboardAwareScrollView>
        </WrapperContainer>
    )
}

export default OtpVerification

const styles = StyleSheet.create({
    container: {
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
    },
    textInputContainer: {
        height: 40,
        width: 64,
        borderWidth: 1,
        borderRadius: 4,
        borderBottomWidth: 1,
        fontSize: 14,
        color: COLORS.blackColor,
        backgroundColor: COLORS.whiteColor
    },
})
