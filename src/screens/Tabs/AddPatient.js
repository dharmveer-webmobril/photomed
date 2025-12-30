import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useMemo, useState } from "react";
import WrapperContainer from "../../components/WrapperContainer";
import commonStyles from "../../styles/commonStyles";
import AppTextInput from "../../components/AppTextInput";
import CountryPickerComp from '../../components/CountryPickerComp'
import CustomBtn from "../../components/CustomBtn";
import { goBack } from "../../navigators/NavigationService";
import RecordAddedPopUp from "../../components/RecordAddedPopUp";
import COLORS from "../../styles/colors";
import { validateEmail, validateNameLength } from "../../components/Validation";
import { useAddPatientMutation } from "../../redux/api/common";
import { useDispatch, useSelector } from "react-redux";
import Loading from "../../components/Loading";
import Toast from "react-native-simple-toast";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { logout } from "../../redux/slices/authSlice";
import ConsentPopUp from "../../components/ConsentPopUp";
import { useFocusEffect } from "@react-navigation/native";
import DatePicker from 'react-native-date-picker'
import { countryCodes } from "react-native-country-codes-picker";
import ImageCropPicker from "react-native-image-crop-picker";
import TextRecognition from "@react-native-ml-kit/text-recognition";
import TextRecognizationUi from './../TextRecognizationUi'
import ChooseImagePopUp from "../../components/ChooseImagePopUp";
import { configUrl } from "../../configs/api";
import { setCurrentPatient } from "../../redux/slices/patientSlice";

const AddPatient = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth?.user);
  const [visible, setIsVisible] = useState(false);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [image, setImage] = useState(null)
  const [imageModal, setImageModal] = useState(false);
  const [pickerType, setPickerType] = useState('profile');

  const maxDate = useMemo(() => new Date(), []);
  const [datePickerValue, setDatePickerValue] = useState(maxDate);
  const isConnected = useSelector((state) => state.network.isConnected);
  const [consent, setConsent] = useState(false);

  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [countryCode, setCountryCode] = useState('+32');
  const [textData, setTextData] = useState('');
  const [addPatient, { isLoading, error }] = useAddPatientMutation();

  if (error?.data?.isDeleted || error?.data?.status === 2) {
    dispatch(logout());
    Toast.show("Your account is deactivated. Please contact the administrator.");
  }

  const getIPLocation = async () => {
    try {
      const res = await fetch('http://ip-api.com/json/');
      const data = await res.json();
      if (data && data?.countryCode) {
        let countryData = countryCodes.find((item) => item.code == data?.countryCode)
        if (countryData?.dial_code) {
          setCountryCode(countryData.dial_code)
        }
      }
    } catch (error) {
      console.error('IP Location Error:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      getIPLocation()
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      setConsent(true);
      return () => setConsent(false);
    }, [])
  );

  const handleOkPress = () => setConsent(false);

  const clearFields = () => {
    setName("");
    setDob("");
    setPhone("");
    setEmail("");
    setImage(null);
    setDatePickerValue(new Date());
  };

  const validateFields = () => {
    if (!name.trim()) {
      Toast.show("Please enter your name");
      return false;
    }
    if (validateNameLength(name.trim())) {
      Toast.show("Name must be 50 characters long and contain letters only.");
      return false;
    }
    if (!dob.trim()) {
      Toast.show("Please enter your date of birth");
      return false;
    }
    if (phone && phone.trim() !== '' && !/^\d{5,15}$/.test(phone.trim())) {
      Toast.show('Please enter a valid mobile number with 5 to 15 digits');
      return false;
    }
    if (email.trim() !== "" && !validateEmail(email.trim())) {
      Toast.show("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const cleanName = name?.trim()

  const handleSave = async () => {

    if (!isConnected) {
      Toast.show("No internet connection. Please try again.");
      return;
    }
    if (!validateFields()) return;

    let formData = new FormData();

    if (image) {
      formData.append('face', {
        uri: image.path,
        type: image.mime,
        name: image.filename || `photo_${Date.now()}.jpg`
      })
    }
    cleanName && formData.append('full_name', cleanName)
    dob && formData.append('dob', dob)
    phone && formData.append('mobile', phone && phone.trim() ? `${countryCode}-${phone}` : phone)
    email && formData.append('email', email)


    try {
      let res = await addPatient({ token, formData }).unwrap();
      console.log('ress---', res);
      if (image && res?.succeeded && res?.ResponseBody) {
        updatePatientImage(res?.ResponseBody?._id)
      }
      clearFields();
      setIsVisible(true);
    } catch (error) {
      Toast.show(error.data.ResponseMessage);
    }
  };

  const handleDateChange = (date) => {
    setDatePickerValue(date);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    setDob(`${day}-${month}-${year}`);
    setDatePickerVisibility(false);
  };

  const onPhoneInputChange = (val) => {
    if (val?.length > 0) val = val.trim().split(' ').join('');
    setPhone(val);
  };

  const [textSelectorModal, setTextSelectorModal] = useState(false);

  const onTextSelect = (val) => {
    setName(val)
    setTextSelectorModal(false)
  }

  const openCamera = () => {
    ImageCropPicker.openCamera({
      cropping: true,
      mediaType: "photo",
      width: 200,
      height: 200,
      compressImageQuality: 0.4,
    }).then((img) => {
      funcManageImage(img)
    }).catch((er) => {
      console.log('errrorororo', er);
      if (er?.message?.includes('User did not grant camera permission.')) {
        Toast.show("To take a photo, please allow camera access for PhotoMed Pro in your device settings.");
        return;
      }
    })
  }

  const chooseImage = () => {
    ImageCropPicker.openPicker({
      cropping: true,
      mediaType: "photo",
      width: 200,
      height: 200,
      compressImageQuality: 0.4,
    }).then(async (img) => {
      funcManageImage(img)
    }).catch((er) => {
      console.log('errrorororo', er);
      if (er?.message?.includes('User did not grant library permission.')) {
        Toast.show("To select a photo, please allow photo access for PhotoMed Pro in your device settings.");
        return;
      }
    })
  }

  const funcManageImage = async (img) => {
    const newImg = { ...img };
    if (!newImg.path.startsWith("file://")) {
      newImg.path = `file://${newImg.path}`;
    }

    if (pickerType === 'profile') {
      setImage(newImg)
    } else {
      const result = await TextRecognition.recognize(newImg.path);
      console.log('resultresultresult--', result);
      if (result && result?.text) {
        setTextData(result.text);
        setTextSelectorModal(true)
      }
    }
    setImageModal(false);

  }

  const updatePatientImage = async (patientId) => {
    const formData = new FormData();
    formData.append('profile', {
      uri: image.path,
      type: image.mime,
      name: image.filename || `photo_${Date.now()}.jpg`
    })


    fetch(`${configUrl.BASE_URL}updatepatient/${patientId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    })
      .then((response) => response.json())
      .then((json) => {
        console.log('updatePatientImageupdatePatientImage', json);
      })
      .catch((error) => {
        console.error("upload error--------", error);
      });
  };


  

  return (
    <WrapperContainer wrapperStyle={commonStyles.innerContainer} >
      <ChooseImagePopUp
        visible={imageModal}
        onPressCamera={openCamera}
        onPressGallery={chooseImage}
        onPressCancel={() => setImageModal(false)}
      />

      <KeyboardAwareScrollView showsVerticalScrollIndicator={false} extraScrollHeight={10}>

        <View style={styles.topSection}>

          {/* Profile Image */}
          <View style={styles.profileContainer} >
            {
              image
                ? <Image style={styles.profileImage} source={{ uri: image.path }} />
                : <Image style={styles.profilePlaceholder} source={require('../../assets/images/user.png')} />
            }

            <TouchableOpacity onPress={() => { setImageModal(true); setPickerType('profile') }} style={styles.cameraBtn} >
              <Image style={styles.cameraIcon} source={require('../../assets/images/icons/cam.png')} />
            </TouchableOpacity>
          </View>

          {/* Name + OCR */}
          <View style={styles.nameRow}>
            <View style={styles.nameInputWrapper}>
              <AppTextInput
                label={"Name"}
                maxLength={100}
                placeHolderTxtColor={COLORS.placeHolderTxtColor}
                placeholder={"Enter name"}
                value={name}
                onChangeText={setName}
              />
            </View>

            < TouchableOpacity style={styles.ocrBtn} onPress={() => { setImageModal(true); setPickerType('scanner') }}>
              <Image source={require('../../assets/images/ocr.png')} style={styles.ocrIcon} />
            </TouchableOpacity>
          </View>

          {/* DOB */}
          <TouchableOpacity style={styles.datePickerBox} onPress={() => setDatePickerVisibility(true)}>
            <Text style={[styles.dateText, { color: dob ? COLORS.textColor : COLORS.placeHolderTxtColor }]}>
              {dob || 'DD-MM-YYYY'}
            </Text>
          </TouchableOpacity>

          {/* Country + Phone */}
          <CountryPickerComp
            isPickerOpen={isCountryPickerOpen}
            closeCountryPicker={setIsCountryPickerOpen}
            openCountryPicker={setIsCountryPickerOpen}
            inputText={phone}
            onInputChange={onPhoneInputChange}
            countryCode={countryCode}
            setCountryCode={setCountryCode}
          />

          {/* Email */}
          <AppTextInput
            label={"Email"}
            keyboardType={"email-address"}
            placeHolderTxtColor={COLORS.placeHolderTxtColor}
            placeholder={"Enter email address"}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Save */}
        <View style={styles.bottomSection}>
          <CustomBtn onPress={handleSave} title={"Save"} loading={isLoading} />
        </View>

      </KeyboardAwareScrollView>

      {/* Popups */}
      <ConsentPopUp title={"Consent Required"} onPressSuccess={handleOkPress} visible={consent} />

      <Loading visible={isLoading} />

      <DatePicker
        modal
        open={isDatePickerVisible}
        date={datePickerValue}
        onConfirm={(date) => {
          if (date > new Date()) {
            Toast.show("You can’t select a future date");
            setDatePickerVisibility(false)
            return;
          }
          handleDateChange(date)
        }}
        mode="date"
        onCancel={() => setDatePickerVisibility(false)}
      />

      <TextRecognizationUi
        isVisible={textSelectorModal}
        onClose={() => setTextSelectorModal(false)}
        textData={textData || ''}
        onDone={onTextSelect}
      />

      <RecordAddedPopUp
        onPressCancel={() => { setIsVisible(false); goBack(); }}
        visible={visible}
      />

    </WrapperContainer>
  );
};

export default AddPatient;

const styles = StyleSheet.create({
  topSection: {
    flex: 0.6,
  },

  bottomSection: {
    flex: 0.4,
    justifyContent: "center",
  },

  profileContainer: {
    height: 90,
    width: 90,
    borderRadius: 45,
    borderWidth: 1,
    alignSelf: "center",
    marginBottom: 40,
    justifyContent: "center",
    alignItems: "center"
  },

  profilePlaceholder: {
    height: '60%',
    width: "60%",
    resizeMode: "contain"
  },

  profileImage: {
    height: '100%',
    width: '100%',
    resizeMode: "cover",
    borderRadius: 150
  },

  cameraBtn: {
    height: 30,
    width: 30,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: COLORS.primary,
    position: 'absolute',
    right: -5,
    bottom: 5,
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center"
  },

  cameraIcon: {
    height: 20,
    width: 20,
    resizeMode: "contain"
  },

  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  nameInputWrapper: {
    flex: 1,
    marginRight: 20,
  },

  ocrBtn: {
    marginTop: -20,
    height: 38,
    width: 38,
    borderWidth: 1,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  ocrIcon: {
    height: 25,
    width: 25,
    resizeMode: "contain",
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
  },

  dateText: {
    fontSize: 12,
  },
});
