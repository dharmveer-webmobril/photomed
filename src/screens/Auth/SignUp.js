import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import WrapperContainer from '../../components/WrapperContainer'
import { imagePath } from '../../configs/imagePath'
import commonStyles from '../../styles/commonStyles'
import AppTextInput from '../../components/AppTextInput'
import { moderateScale, verticalScale } from '../../styles/responsiveLayoute'
import COLORS from '../../styles/colors'
import FONTS from '../../styles/fonts'
import CustomBtn from '../../components/CustomBtn'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useNavigation } from '@react-navigation/native'
import ScreenName from '../../configs/screenName'
import { navigate } from '../../navigators/NavigationService'
import { useRegisterMutation } from '../../redux/api/user'
import Loading from '../../components/Loading'
import { validateEmail, validateNameLength } from '../../components/Validation'
import Toast from 'react-native-simple-toast'
import DeviceInfo from 'react-native-device-info'
import { getData } from '../../configs/helperFunction'
import Tick from '../../assets/SvgIcons/Tick'

const SignUp = () => {
    const [signUpMutation, { isLoading }] = useRegisterMutation();
    const [full_name, setFullName] = useState('')
    const [mobile, setMobile] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [terms, setTerms] = useState(false)
    const [passwordVisibility, setpasswordVisibility] = useState(true);
    const [cpasswordVisibility, setcpasswordVisibility] = useState(true);
    const toggleTerms = (terms) => {
        setTerms(terms)
    }


    const navigation = useNavigation()

    const validateFields = () => {
        // Validate full name
        if (full_name.trim() === '') {
            Toast.show('Please enter your full name');
            return false;
        }
        if (validateNameLength(full_name.trim())) {
            Toast.show('Full name must be at least 3 characters long');
            return false;
        }
        // Validate mobile number
        if (mobile.trim() !== '') {
            if (!/^\d{5,15}$/.test(mobile.trim())) {
                Toast.show('Please enter a valid mobile number with 5 to 15 digits');
                return false;
            }
        }

        // Validate email
        if (email.trim() === '') {
            Toast.show('Please enter email address');
            return false;
        }
        if (!validateEmail(email.trim())) {
            Toast.show('Please enter a valid email address');
            return false;
        }

        // Validate password
        if (password.trim() === '') {
            Toast.show('Please enter password');
            return false;
        }
        if (password.trim().length < 6) {
            Toast.show('Password must be at least 6 characters long');
            return false;
        }
        // Validate confirm password
        if (confirmPassword.trim() === '') {
            Toast.show('Please confirm your password');
            return false;
        }
        if (password !== confirmPassword) {
            Toast.show('Passwords do not match');
            return false;
        }
        if (!terms) {
            Toast.show('Please accept Terms and Conditions and Privacy Policy');
            return false;
        }
        return true;
    };

    const getPlatformValue = () => {
        if (Platform.OS === 'android') {
            return 1; // For Android
        } else {
            return 2; // For iOS
        }
    };


    const handleRegister = async () => {
        if (!validateFields()) return;
        // Proceed with API call or further actions
        try {
            const device_type = getPlatformValue();
            const device_id = await DeviceInfo.getUniqueId() || 'default_device_id'; // Default value if not set
            const fcmToken = await getData('fcmToken') || 'abcd1234'; // Default value if not set
            const response = await signUpMutation({ full_name, email, password, mobile, device_type, device_id, fcmToken });
            console.log('responseresponse', JSON.stringify(response, null, 2));

            if (response.data?.succeeded) {
                // Toast.show(`Your otp is : ${response.data.ResponseBody.otp}`);
                navigate(ScreenName.OTP_VERIFICATION, { screenName: ScreenName.SIGN_UP, userToken: response.data.ResponseBody.token, email: email })
                // Handle successful registration logic
            } else {
                Toast.show(response?.data?.ResponseMessage || 'Something went wrong');
            }
        } catch (error) {
            console.error('Registration Error:', error);
        }
    };


    const navigateToNextScreen = (screen) => {
        navigation.navigate(screen)
    }
    return (
        <WrapperContainer wrapperStyle={[commonStyles.innerContainer, styles.container]}>
            <Loading visible={isLoading} />
            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContentContainer}
                extraScrollHeight={10}
                enableOnAndroid={true}
            >
                <Image source={imagePath.logo} style={styles.logoStyle} />
                <AppTextInput
                    value={full_name}
                    maxLength={20}
                    onChangeText={(txt) => setFullName(txt)}
                    placeholder={'Full Name'}
                    leftIcon={imagePath.user} />

                <AppTextInput
                    value={email}
                    onChangeText={(txt) => setEmail(txt)}
                    placeholder={'Email'}
                    keyboardType={'email-address'}
                    leftIcon={imagePath.email} />
                <AppTextInput
                    value={password}
                    onChangeText={(txt) => setPassword(txt)}
                    placeholder={'Enter Password'}
                    secureTextEntry={passwordVisibility}
                    leftIcon={imagePath.lock}
                    toggleSecureTextEntry={() => {
                        setpasswordVisibility(!passwordVisibility);
                    }}
                    rightIcon

                />
                <AppTextInput
                    value={confirmPassword}
                    secureTextEntry={cpasswordVisibility}
                    onChangeText={(txt) => setConfirmPassword(txt)}
                    placeholder={'Re-enter Password'}
                    toggleSecureTextEntry={() => {
                        setcpasswordVisibility(!cpasswordVisibility);
                    }}
                    leftIcon={imagePath.lock}
                    rightIcon />

                <AppTextInput
                    value={mobile}
                    onChangeText={(txt) => setMobile(txt)}
                    placeholder={'Mobile Number'}
                    keyboardType={'number-pad'}
                    leftIcon={imagePath.mobile} />
                <View
                    style={[{ alignSelf: 'flex-start', marginLeft: 2, width: '100%', alignItems: 'flex-start', flexDirection: 'row' }]}
                >
                    <TouchableOpacity onPress={() => toggleTerms(!terms)}
                        style={styles.check}>
                        {terms && <Tick height={10} width={10} />}
                    </TouchableOpacity>
                    <Text style={styles.checkTxt}>By signing up you accept the{' '}
                        <Text onPress={() => navigate(ScreenName.TERMS, { slug: 'about-us', screenName: ScreenName.TERMS })}
                            style={{ fontFamily: FONTS.medium, color: COLORS.primary }}>Terms and Conditions <Text style={{ color: '#000' }}>&amp;</Text><Text onPress={() => navigate('Privacy Policy', { slug: 'privacy-policy', screenName: 'Privacy Policy' })}
                                style={{ fontFamily: FONTS.medium, color: COLORS.primary }}> Privacy Policy</Text></Text>

                    </Text>
                </View>
                <CustomBtn onPress={handleRegister}
                    title={'Sign Up'} btnStyle={{ marginTop: verticalScale(80) }}
                />
                <Text style={styles.infoTxt}>Already have  an account? {' '}
                    <Text
                        onPress={() => navigateToNextScreen(ScreenName.LOGIN)}
                        style={{ color: COLORS.primary, fontSize: 16, fontFamily: FONTS.semiBold }}>
                        Log In
                    </Text>
                </Text>
            </KeyboardAwareScrollView>
        </WrapperContainer>
    )
}

export default SignUp

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 30,
    }, logoStyle: {
        height: 120,
        width: 120,
        marginBottom: verticalScale(80)
    }, infoTxt: {
        fontFamily: FONTS.regular,
        fontSize: 10,
        color: COLORS.textColor,
        marginTop: 20
    },
    scrollViewContentContainer: {
        flexGrow: 1,
        width: '100%',
        alignItems: 'center'
    },
    check: {
        height: 18,
        width: 18,
        borderRadius: 5,
        borderColor: COLORS.primary,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: moderateScale(10),
        backgroundColor: 'white'
    }, checkTxt: {
        fontSize: 14,
        fontFamily: FONTS.regular,
        color: COLORS.textColor
    }
})