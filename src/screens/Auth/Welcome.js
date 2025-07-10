import { Image, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native'
import React, { useEffect } from 'react'
import WrapperContainer from '../../components/WrapperContainer'
import { imagePath } from '../../configs/imagePath'
import commonStyles from '../../styles/commonStyles'
import FONTS from '../../styles/fonts'
import COLORS from '../../styles/colors'
import { verticalScale } from '../../styles/responsiveLayoute'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useDispatch } from 'react-redux'
import { setWelcomeScreen } from '../../redux/slices/authSlice'
import { navigate } from '../../navigators/NavigationService'
import ScreenName from '../../configs/screenName'

const { height } = Dimensions.get('window');  // Get screen height

const Welcome = () => {
    
    const dispatch = useDispatch()

    const animation = useSharedValue(height / 3 - 100); // Start from center

    useEffect(() => {
        setTimeout(() =>{
            startAnimation();
        },2000)
    }, []);
    
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{
                translateY: animation.value,
            }],
        };
    });

    const startAnimation = () => {
        animation.value = withTiming(-10, { // Move slightly above the final position
            duration: 800,
        });
    };

    const navigateToNextScreen = async(screen) => {
        navigate(screen)
        dispatch(setWelcomeScreen(false))
    }


    return (
        <WrapperContainer wrapperStyle={[commonStyles.innerContainer,styles.container]}>
            <Animated.View style={[animatedStyle,{marginTop:verticalScale(50)}]}>
                <Image source={imagePath.logo} style={{alignSelf:'center'}}/>
            </Animated.View>
            <Text style={styles.wlcmTxtSyle}>
                Welcome{'\n'} 
                <Text style={styles.titleStyle}>
                    PhotoMed Pro
                </Text>
            </Text>
            <Text style={styles.subtitle}>Securely store and organize your medical documents</Text>
            <View style={styles.btnContainer}>
                <TouchableOpacity onPress={() => {navigateToNextScreen(ScreenName.LOGIN)}}
                activeOpacity={0.95} style={styles.btn}>
                    <Text style={styles.btnTitle}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigateToNextScreen(ScreenName.SIGN_UP)}
                activeOpacity={0.9} style={styles.signUpBtn}>
                    <Text style={styles.signUpBtnTitle}>SignUp</Text>
                </TouchableOpacity>
            </View>
        </WrapperContainer>
    )
}

export default Welcome;

const styles = StyleSheet.create({
    container:{
        alignItems: 'center', 
        justifyContent: 'center',
        // backgroundColor:'red',
    },
    wlcmTxtSyle: {
        fontSize: 18,
        fontFamily: FONTS.regular,
        color: COLORS.primary,
        textAlign: 'center',
        marginVertical: verticalScale(30)
    }, 
    titleStyle: {
        fontSize: 25,
        fontFamily: FONTS.bold
    }, 
    subtitle: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        color: COLORS.primary,
        marginBottom: verticalScale(60)
    }, 
    btnContainer: {
        ...commonStyles.flexView,
        flex:1,
        alignItems:'center',
        justifyContent:'center'
    }, 
    btn: {
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 118,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        height: 42,
        width: 140,
        paddingHorizontal: 20
    }, 
    btnTitle: {
        fontSize: 16,
        color: COLORS.whiteColor,
        fontFamily: FONTS.medium
    }, 
    signUpBtnTitle: {
        fontSize: 16,
        color: COLORS.primary,
        fontFamily: FONTS.regular,
    }, 
    signUpBtn: {
        backgroundColor: COLORS.whiteColor,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 118,
        borderWidth: 1,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        height: 42,
        width: 140,
        paddingHorizontal: 20,
        borderLeftColor: COLORS.primary,
        borderLeftWidth: 0,
        right: 1
    }
});
