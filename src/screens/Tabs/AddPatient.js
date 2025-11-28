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


const AddPatient = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth?.user);

  console.log('tokentokentoken', token);

  const [visible, setIsVisible] = useState(false);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const maxDate = useMemo(() => {
    return new Date()
  }, []);
  const [datePickerValue, setDatePickerValue] = useState(maxDate);
  const isConnected = useSelector((state) => state.network.isConnected);
  const [consent, setConsent] = useState(false);

  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [countryCode, setCountryCode] = useState('+32');
  const [textData, setTextData] = useState('');

  const [addPatient, { isLoading, error }] = useAddPatientMutation();


  if (error?.data?.isDeleted || error?.data?.status === 2) {
    dispatch(logout());
    Toast.show(
      "Your account is deactivated. Please contact the administrator."
    );
  }

  const getIPLocation = async () => {
    try {
      const res = await fetch('http://ip-api.com/json/');
      const data = await res.json();
      console.log(data, 'datadata');
      if (data && data?.countryCode) {
        console.log(data?.countryCode, 'data?.countryCode');
        console.log(countryCodes[0]?.code, 'data?.countryCode');
        let countryData = countryCodes.find((item) => item.code == data?.countryCode)
        if (countryData && countryData?.dial_code) {
          setCountryCode(countryData?.dial_code)
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

  const handleOkPress = () => {
    setConsent(false);
  };

  const clearFields = () => {
    setName("");
    setDob("");
    setPhone("");
    setEmail("");
    setDatePickerValue(new Date());
  };

  const validateFields = () => {
    if (name?.trim()?.length <= 0) {
      Toast.show("Please enter your name");
      return false;
    }

    if (validateNameLength(name.trim())) {
      Toast.show("Name must be 50 characters long and contain letters only.");
      return false;
    }
    if (dob.trim() === "") {
      Toast.show("Please enter your date of birth");
      return false;
    }

    if (phone && phone.trim() != '' && !/^\d{5,15}$/.test(phone.trim())) {
      Toast.show('Please enter a valid mobile number with 5 to 15 digits');
      return false;
    }

    if (email.trim() != "" && !validateEmail(email.trim())) {
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
    if (!validateFields()) {
      return;
    }
    const patientData = { full_name: cleanName, dob, mobile: (phone && phone.trim()) ? `${countryCode}-${phone}` : phone, email };
    try {
      const response = await addPatient({ token, patientData }).unwrap();
      clearFields();
      setIsVisible(true);
    } catch (error) {
      console.log('errorerror', JSON.stringify(error));

      Toast.show(error.data.ResponseMessage);
    }
  };



  const handleDateChange = (date) => {
    setDatePickerValue(date);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;
    setDob(formattedDate);
    setDatePickerVisibility(false);
  };
  const onPhoneInputChange = (val) => {
    if (val && val?.length > 0) {
      val = val.trim().split(' ').join('');
    }
    setPhone(val)
  }

  const [selected, setSelected] = useState(new Date());
  const [textSelectorModal, setTextSelectorModal] = useState(false);

  const onTextSelect = (val) => {
    setName(val)
    setTextSelectorModal(false)
  }
  const openCamera = () => {

    ImageCropPicker.openCamera({
      cropping: false,
      mediaType: "photo",
      width: 800,
      height: 800,
    })
      .then(async (img) => {
        console.log('image------', img);
        const newImg = { ...img };
        if (!newImg.path.startsWith("file://")) {
          newImg.path = `file://${newImg.path}`;
        }
        const result = await TextRecognition.recognize(newImg.path);
        console.log('TextRecognition text-', result);
        if (result.text) {
          setTextData(result.text);
          setTextSelectorModal(true)
        }
      })
      .catch((e) => console.log("Attach photo cancelled:", e));
  }
  return (
 <WrapperContainer wrapperStyle={commonStyles.innerContainer}>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        extraScrollHeight={10}
      >
        <View style={styles.topSection}>
          
          {/* NAME + OCR BUTTON */}
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

            <TouchableOpacity onPress={openCamera} style={styles.ocrBtn}>
              <Image
                source={require('../../assets/images/ocr.png')}
                style={styles.ocrIcon}
              />
            </TouchableOpacity>
          </View>

          {/* DOB PICKER */}
          <TouchableOpacity
            style={styles.datePickerBox}
            onPress={() => setDatePickerVisibility(true)}
          >
            <Text style={[styles.dateText, { color: dob ? COLORS.textColor : COLORS.placeHolderTxtColor }]}>
              {dob ? dob : 'DD-MM-YYYY'}
            </Text>
          </TouchableOpacity>

          {/* COUNTRY + PHONE */}
          <CountryPickerComp
            isPickerOpen={isCountryPickerOpen}
            closeCountryPicker={(val) => setIsCountryPickerOpen(val)}
            openCountryPicker={(val) => setIsCountryPickerOpen(val)}
            inputText={phone}
            onInputChange={(val) => onPhoneInputChange(val)}
            countryCode={countryCode}
            setCountryCode={(val) => setCountryCode(val)}
          />

          {/* EMAIL */}
          <AppTextInput
            label={"Email"}
            keyboardType={"email-address"}
            placeHolderTxtColor={COLORS.placeHolderTxtColor}
            placeholder={"Enter email address"}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* SAVE BUTTON */}
        <View style={styles.bottomSection}>
          <CustomBtn onPress={handleSave} title={"Save"} loading={isLoading} />
        </View>
      </KeyboardAwareScrollView>

      {/* POPUPS */}
      <ConsentPopUp
        title={"Consent Required"}
        onPressSuccess={handleOkPress}
        visible={consent}
      />

      <Loading visible={isLoading} />

      {/* DATE PICKER */}
      <DatePicker
        modal
        open={isDatePickerVisible}
        date={datePickerValue}
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
        onCancel={() => setDatePickerVisibility(false)}
      />

      {/* OCR TEXT SELECT MODAL */}
      <TextRecognizationUi
        isVisible={textSelectorModal}
        onClose={() => setTextSelectorModal(false)}
        textData={textData || ''}
        onDone={(val) => onTextSelect(val)}
      />

      {/* SUCCESS POPUP */}
      <RecordAddedPopUp
        onPressCancel={() => {
          setIsVisible(false);
          goBack();
        }}
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
