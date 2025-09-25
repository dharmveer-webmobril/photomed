import {  StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, {  useMemo, useState } from "react";
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
import {  countryCodes } from "react-native-country-codes-picker";



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
      setConsent(true); // Show the popup when the screen is focused
      return () => setConsent(false); // Cleanup when the screen loses focus
    }, [])
  );

  const handleOkPress = () => {
    setConsent(false); // Close the popup when OK is pressed
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
    // if (phone.trim() === "") {
    //   Toast.show("Please enter your mobile number");
    //   return false;
    // }
    // if (!/^\d{5,15}$/.test(phone.trim())) {
    //   Toast.show("Please enter a valid mobile number with 5 to 15 digits");
    //   return false;
    // }
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
      // Toast.show(response.ResponseMessage);
      clearFields();
      setIsVisible(true);
    } catch (error) {
      console.log('errorerror', JSON.stringify(error));

      Toast.show(error.data.ResponseMessage);
    }
  };

  // const handleDateChange = () => {
  //   // console.log("Selected date: ", selectedDate);
  //   if (selected instanceof Date && !isNaN(selected)) {
  //     setDatePickerVisibility(false);
  //     // Avoid unnecessary updates
  //     if (selected !== datePickerValue) {
  //       setDatePickerValue(selected);
  //       // Format the date as DD-MM-YYYY
  //       const day = String(selected.getDate()).padStart(2, "0");
  //       const month = String(selected.getMonth() + 1).padStart(2, "0");
  //       const year = selected.getFullYear();
  //       const formattedDate = `${day}-${month}-${year}`;

  //       setDob(formattedDate);
  //     }
  //   } else {
  //     setDatePickerVisibility(false);
  //   }
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
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        extraScrollHeight={10}
      >
        <ConsentPopUp
          title={"Consent Required"}
          onPressSuccess={handleOkPress}
          visible={consent}
        />
        <Loading visible={isLoading} />

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
          onCancel={() => {
            setDatePickerVisibility(false)
          }}
        />
        {/* <DatePickerModal
          selected={selected}
          modalVisible={modalVisible}
          selcetDate={(date)=>setSelected(date)}
          closeModal={() => setModalVisible(false)}
          doneModal={() => {setModalVisible(false), handleDateChange()}}
        /> */}

        <RecordAddedPopUp
          onPressCancel={() => {
            setIsVisible(false);
            goBack();
          }}
          visible={visible}
        />
        <View style={{ flex: 0.6 }}>
          <AppTextInput
            label={"Name"}
            maxLength={100}
            placeHolderTxtColor={COLORS.placeHolderTxtColor}
            placeholder={"Enter name"}
            value={name}
            onChangeText={setName}
          />


          <TouchableOpacity style={styles.datePickerBox}
            onPress={() => setDatePickerVisibility(true)}
          // onPress={() => setModalVisible(true)}
          >
            <Text style={{ color: dob ? COLORS.textColor : COLORS.placeHolderTxtColor, fontSize: 12, }}>{dob ? dob : 'DD-MM-YYYY'}</Text>
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
            label={"Email"}
            keyboardType={"email-address"}
            placeHolderTxtColor={COLORS.placeHolderTxtColor}
            placeholder={"Enter email address"}
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <View style={{ flex: 0.4, justifyContent: "center" }}>
          <CustomBtn onPress={handleSave} title={"Save"} loading={isLoading} />
        </View>
      </KeyboardAwareScrollView>
    </WrapperContainer>
  );
};

export default AddPatient;

const styles = StyleSheet.create({
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