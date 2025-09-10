import { Platform, StyleSheet, TouchableOpacity, View, Image, Dimensions, Text } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { validateEmail, validateNameLength } from '../components/Validation';
import { useDeletePatientMutation, useUpdatePatientMutation } from '../redux/api/common';
import WrapperContainer from '../components/WrapperContainer';
import Loading from '../components/Loading';
import AppTextInput from '../components/AppTextInput';
import CustomBtn from '../components/CustomBtn';
import commonStyles from '../styles/commonStyles';
import COLORS from '../styles/colors';
import { verticalScale } from '../styles/responsiveLayoute';
import { goBack, navigate } from '../navigators/NavigationService';
import ScreenName from '../configs/screenName';
import DeleteImagePopUp from '../components/DeleteImagePopUp';
import Toast from 'react-native-simple-toast'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { configUrl } from '../configs/api';
import { imagePath } from '../configs/imagePath';
import FastImage from 'react-native-fast-image';
import ImageCropPicker from 'react-native-image-crop-picker';
import ChooseImagePopUp from '../components/ChooseImagePopUp';
import { logout } from '../redux/slices/authSlice';
import DatePicker from 'react-native-date-picker'
import DatePickerModal from "../components/DatePickerModal";
import CountryPickerComp from '../components/CountryPickerComp';
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;



const EditPatient = (props) => {
    const token = useSelector((state) => state.auth?.user);
    const dispatch = useDispatch()
    const patientDetails = props.route.params.patient
    const { imageCount } = props.route.params
    const maxDate = useMemo(() => {
        return new Date()
    }, []);

    const [visible, setIsVisible] = useState(false);
    const [modal, setModal] = useState(false)
    const [name, setName] = useState(patientDetails.full_name);
    const [dob, setDob] = useState(patientDetails.dob);
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [datePickerValue, setDatePickerValue] = useState(new Date()); // State for the date picker value
    const isConnected = useSelector((state) => state.network.isConnected);
    const [profileImage, setProfileImage] = useState(null); // State to store selected image


    const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
    const [countryCode, setCountryCode] = useState('+91');




    const [updatePatient, { isLoading, error }] = useUpdatePatientMutation();
    const [deletePatient, { isLoading: loading }] = useDeletePatientMutation();

    useEffect(() => {
        console.log('patientDetailspatientDetails', patientDetails);

        let fullPhone = patientDetails.mobile;
        let phone = '';
        let phoneCode = '';
        let dob = patientDetails.dob;
        let newDob = dob.split('-');
        console.log('`${newDob[2]}-${newDob[1]}-${newDob[0]}`', `${newDob[2]}-${newDob[1]}-${newDob[0]}`)
        let newDate = `${newDob[2]}-${newDob[1]}-${newDob[0]}`
        setDatePickerValue(newDate)
        setSelected(new Date(newDate))
        patientDetails.email && setEmail(patientDetails.email)
        if (fullPhone) {
            if (fullPhone.startsWith('+')) {
                let numberArr = fullPhone.split('-');
                phone = numberArr[1];
                phoneCode = numberArr[0]
            } else {
                phone = patientDetails.mobile;
                phoneCode = '+91'
            }
            setPhone(phone)
            setCountryCode(phoneCode)
        }
    }, [])

    if (error?.data?.isDeleted || error?.data?.status === 2) {
        dispatch(logout());
        Toast.show('Your account is deactivated. Please contact the administrator.')
        // console.log(error?.data?.isDeleted,error?.data?.status)
    }

    const handleDelete = async () => {
        if (!isConnected) {
            Toast.show('No internet connection. Please try again.');
            return;
        }
        const id = patientDetails._id
        try {
            const response = await deletePatient({ token, id }).unwrap();
            if (response.succeeded) {
                setIsVisible(false)
                Toast.show(response.ResponseMessage)
                navigate(ScreenName.HOME)
            } else {
                Toast.show(response.ResponseMessage)
            }
        } catch (error) {
            console.error('Failed to delete patient:', error);
        }
    };



    const validateFields = () => {
        if (name.trim() === '') {
            Toast.show('Please enter your full name');
            return false;
        }
        if (validateNameLength(name.trim())) {
            Toast.show('Full name must be at least 3 characters long');
            return false;
        }
        if (dob.trim() === '') {
            Toast.show('Please enter your date of birth');
            return false;
        }

        if (phone && phone.trim() != '' && !/^\d{5,15}$/.test(phone.trim())) {
            Toast.show('Please enter a valid mobile number with 5 to 15 digits');
            return false;
        }



        if (email.trim() != "" && !validateEmail(email.trim())) {
            Toast.show('Please enter a valid email address');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!isConnected) {
            Toast.show('No internet connection. Please try again.');
            return;
        }

        if (!validateFields()) {
            return;
        }
        const id = patientDetails._id
        const patientData = {
            full_name: name, dob, mobile: (phone && phone.trim()) ? `${countryCode}-${phone}` : phone, email,
            profile: profileImage ? { uri: profileImage, fileName: 'profile.jpg', type: 'image/jpeg' } : null,
            imageCount: null
        };
        console.log('patientDatapatientData', patientData);
        // return false;

        try {
            const response = await updatePatient({ token, id, patientData }).unwrap();
            Toast.show(response.ResponseMessage)
            goBack()
            // console.log('Patient updated successfully:', response);
        } catch (error) {
            Toast.show(error.data.ResponseMessage)
            console.error('Failed to add patient:', error);
        }
    };

    // const handleDateChange = () => {
    //     console.log('Selected date: ', selected);
    //     if (selected instanceof Date && !isNaN(selected)) {
    //         setDatePickerVisibility(false);
    //         // Avoid unnecessary updates
    //         if (selected !== datePickerValue) {
    //             setDatePickerValue(selected);
    //             // Format the date as DD-MM-YYYY
    //             const day = String(selected.getDate()).padStart(2, '0');
    //             const month = String(selected.getMonth() + 1).padStart(2, '0');
    //             const year = selected.getFullYear();
    //             const formattedDate = `${day}-${month}-${year}`;

    //             setDob(formattedDate);
    //         }
    //     } else {
    //         setDatePickerVisibility(false);
    //     }
    // };

    const handleDateChange = (date) => {
        setDatePickerValue(date);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;
        setDob(formattedDate);
        setDatePickerVisibility(false);
    };

    const getProfileImage = () => {

        if (profileImage) {
            return { uri: profileImage }; // New image selected
        }
        if (patientDetails?.profileImage) {
            return { uri: configUrl.imageUrl + patientDetails?.profileImage }; // Existing profile image
        }
        return { uri: configUrl.defaultUser }; // Default image
    };

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
                setModal(false)
            })
        // .catch(e => console.log('Error picking image:', e));
    };

    const openCamera = () => {
        ImageCropPicker.openCamera({
            width: windowWidth,
            height: windowHeight,
            cropping: true,
            mediaType: 'photo',
        }).then(image => {
                // console.log('Camera Image:', image);
                setProfileImage(image.path); // Store captured image
                setModal(false)
         }).catch(e => console.log('Error capturing image:', e));
    };



    const onPhoneInputChange = (val) => {
        if (val && val?.length > 0) {
            val = val.trim().split(' ').join('');
        }
        setPhone(val)
    }
    const [selected, setSelected] = useState(new Date());
    const [modalVisible, setModalVisible] = useState(false);
    return (
        <WrapperContainer wrapperStyle={commonStyles.innerContainer}>
            <ChooseImagePopUp
                visible={modal}
                onPressCamera={openCamera}
                onPressGallery={chooseImage}
                onPressCancel={() => setModal(false)}
            />
            <View style={styles.profileContainer}>
                <FastImage source={getProfileImage()} style={styles.userIcon} />
                <TouchableOpacity onPress={() => setModal(true)}
                    style={styles.editIconContainer}>
                    <Image source={imagePath.cam} />
                </TouchableOpacity>
            </View>
            <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                extraScrollHeight={10}
            >
                <Loading visible={isLoading || loading} />
                <DeleteImagePopUp
                    title={'Delete Patient'}
                    onPressCancel={() => setIsVisible(false)}
                    onPressDelete={() => handleDelete()}
                    visible={visible} />
                {/* <DatePickerModal
                    selected={selected}
                    modalVisible={modalVisible}
                    selcetDate={(date) => setSelected(date)}
                    closeModal={() => setModalVisible(false)}
                    doneModal={() => { setModalVisible(false), handleDateChange() }}
                /> */}
                <View style={{ flex: 0.6 }}>

                    <AppTextInput
                        maxLength={20}
                        label={'Name'}
                        editable={false}
                        placeHolderTxtColor={COLORS.placeHolderTxtColor}
                        placeholder={'Enter name'}
                        value={name}
                        onChangeText={setName}
                    />
                    {/* Date Picker Modal */}

                    <DatePicker
                        modal
                        open={isDatePickerVisible}
                        date={new Date(datePickerValue)}
                        onConfirm={(date) => {
                            const today = new Date();
                            if (date > today) {
                                Toast.show("You can’t select a future date");
                                setDatePickerVisibility(false)
                                return;
                            }
                            handleDateChange(date)
                        }}
                        mode="date"
                        // maximumDate={maxDate}
                        // minimumDate={new Date('1925-01-01')}s
                        onCancel={() => {
                            setDatePickerVisibility(false)
                        }}
                    />

                    <TouchableOpacity style={styles.datePickerBox}
                        // onPress={() => setModalVisible(true)}
                        onPress={() => setDatePickerVisibility(true)}
                    >
                        <Text style={{ color: COLORS.textColor, fontSize: 12, }}>{dob}</Text>
                    </TouchableOpacity>

                    <CountryPickerComp
                        isPickerOpen={isCountryPickerOpen}
                        closeCountryPicker={(val) => { setIsCountryPickerOpen(val) }}
                        openCountryPicker={(val) => { setIsCountryPickerOpen(val) }}
                        inputText={phone}
                        onInputChange={(val) => { onPhoneInputChange(val) }}
                        countryCode={countryCode}
                        setCountryCode={(val) => { setCountryCode(val) }}
                    />

                    <AppTextInput
                        label={'Email'}
                        placeHolderTxtColor={COLORS.placeHolderTxtColor}
                        placeholder={'Enter email address'}
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>
                <View style={{ marginTop: '40%', justifyContent: 'center' }}>
                    <CustomBtn
                        onPress={handleSave} // Call handleSave on button press
                        title={'Save'}
                        btnStyle={{ marginBottom: verticalScale(20) }}
                    />
                    <CustomBtn
                        onPress={() => setIsVisible(true)} // Call handleSave on button press
                        title={'Delete Patient'}
                    />
                </View>
            </KeyboardAwareScrollView>
        </WrapperContainer>
    );
}

export default EditPatient;

const styles = StyleSheet.create({
    profileContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: verticalScale(30)
    }, userIcon: {
        height: 80,
        width: 80,
        borderRadius: 80,
        borderColor: COLORS.primary,
        borderWidth: 2
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
        borderWidth: 0.5
    },
    datePickerBox: {
        borderColor: COLORS.borderColor,
        borderWidth: 1,
        width: '100%',
        borderRadius: 5,
        height: 40.5,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 28,
    }
})