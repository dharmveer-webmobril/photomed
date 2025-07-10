import React, { useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import WrapperContainer from '../../components/WrapperContainer';
import commonStyles from '../../styles/commonStyles';
import { imagePath } from '../../configs/imagePath';
import COLORS from '../../styles/colors';
import FONTS from '../../styles/fonts';
import { verticalScale } from '../../styles/responsiveLayoute';
import AppTextInput from '../../components/AppTextInput';
import CustomBtn from '../../components/CustomBtn';
import ChooseImagePopUp from '../../components/ChooseImagePopUp';
import { goBack } from '../../navigators/NavigationService';
import ImageCropPicker from 'react-native-image-crop-picker';
import { useUpdateProfileMutation } from '../../redux/api/user';
import { configUrl } from '../../configs/api';
import { useDispatch, useSelector } from 'react-redux';
import { validateNameLength } from '../../components/Validation';
import Loading from '../../components/Loading';
import Toast from 'react-native-simple-toast'
import { logout } from '../../redux/slices/authSlice';


const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const EditProfile = (props) => {
    const user = props?.route?.params?.user;
    const dispatch = useDispatch()
    const token = useSelector((state) => state?.auth?.user);
    // console.log('token',token);
    

    const [full_name, setFullName] = useState(user?.full_name);
    const [mobile, setMobile] = useState(user?.mobile == 0 ? '' : user?.mobile );
    const [profileImage, setProfileImage] = useState(null); // State to store selected image
    const [visible, setIsVisible] = useState(false);

    const [updateProfile, { isLoading, error }] = useUpdateProfileMutation(); // Use mutation hook

    if (error?.data?.isDeleted || error?.data?.status === 2) {
        dispatch(logout());
        // console.log(error?.data?.isDeleted,error?.data?.status)
      }

    const chooseImage = () => {
        ImageCropPicker.openPicker({
            width: windowWidth,
            height: windowHeight,
            cropping: false,
            multiple: false,
            mediaType: 'photo',
        })
            .then(image => {
                // console.log('Gallery Image:', image);
                setProfileImage(image.path); // Store selected image
                setIsVisible(false)
            })
            .catch(e => console.log('Error picking image:', e));
    };

    const openCamera = () => {
        ImageCropPicker.openCamera({
            width: windowWidth,
            height: windowHeight,
            cropping: true,
            mediaType: 'photo',
        })
            .then(image => {
                // console.log('Camera Image:', image);
                setProfileImage(image.path); // Store captured image
                setIsVisible(false)
            })
            .catch(e => console.log('Error capturing image:', e));
    };


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
        if (mobile.trim() === '') {
            Toast.show('Please enter your mobile number');
            return false;
        }
        if (!/^\d{5,15}$/.test(mobile.trim())) {
            Toast.show('Please enter a valid mobile number with 5 to 15 digits');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateFields()) return;
        try {
            const response = await updateProfile({ token, full_name, mobile, profile: profileImage, }).unwrap();
            // console.log('Profile updated successfully:', response);
            goBack(); // Navigate back on success
        } catch (error) {
            // console.error('Profile update failed:', error);
        }
    };

    const getProfileImage = () => {
        if (profileImage) {
            return { uri: profileImage }; // New image selected
        }
        if (user?.profile) {
            return { uri: configUrl.imageUrl + user.profile }; // Existing profile image
        }
        return { uri: configUrl.defaultUser }; // Default image
    };

    return (
        <WrapperContainer wrapperStyle={[commonStyles.innerContainer, styles.container]}>
            <Loading visible={isLoading} />
            <ChooseImagePopUp
                visible={visible}
                onPressCamera={openCamera}
                onPressGallery={chooseImage}
                onPressCancel={() => setIsVisible(false)}
            />
            <View style={styles.profileContainer}>
                <Image source={getProfileImage()} style={styles.userIcon} />
                <TouchableOpacity
                    onPress={() => setIsVisible(true)}
                    style={styles.editIconContainer}
                >
                    <Image source={imagePath.cam} />
                </TouchableOpacity>
            </View>
            <Text style={styles.titleStyle}>{user?.full_name}</Text>
            <AppTextInput
                placeHolderTxtColor={COLORS.placeHolderTxtColor}
                lable={'Name'}
                value={full_name}
                onChangeText={(txt) => setFullName(txt)}
                placeholder={'Enter name'}
            />
            <AppTextInput
                placeHolderTxtColor={COLORS.placeHolderTxtColor}
                lable={'Email'}
                keyboardType={'email-address'}
                value={user?.email}
                editable={false}
                placeholder={'abcdefghi@gmail.com'}
            />
            <AppTextInput
                placeHolderTxtColor={COLORS.placeHolderTxtColor}
                lable={'Phone Number'}
                keyboardType={'number-pad'}
                value={mobile}
                onChangeText={(txt) => setMobile(txt)}
                placeholder={'Enter phone number'}
            />
            <CustomBtn
                onPress={handleSave}
                title={'Save'}
                btnStyle={{ marginTop: verticalScale(80) }}
            />
        </WrapperContainer>
    );
};

export default EditProfile;

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
    titleStyle: {
        fontFamily: FONTS.semiBold,
        color: COLORS.textColor,
        fontSize: 12,
        marginTop: verticalScale(10),
        marginBottom: verticalScale(20),
    },
});
