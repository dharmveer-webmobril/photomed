import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import React, { useState } from 'react';
import WrapperContainer from '../../components/WrapperContainer';
import commonStyles from '../../styles/commonStyles';
import AppTextInput from '../../components/AppTextInput';
import FONTS from '../../styles/fonts';
import COLORS from '../../styles/colors';
import { moderateScale, verticalScale } from '../../styles/responsiveLayoute';
import CustomBtn from '../../components/CustomBtn';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useCurrentUserProfileQuery } from '../../redux/api/user';
import { useSelector } from 'react-redux';
import { usePostQueryMutation } from '../../redux/api/common';
import Loading from '../../components/Loading';
import { validateEmail, validateNameLength } from '../../components/Validation';
import { goBack } from '../../navigators/NavigationService';
import Toast from 'react-native-simple-toast'


const HelpCenter = () => {
  const token = useSelector((state) => state.auth?.user);
  const { data: userDetail } = useCurrentUserProfileQuery({ token });
  const user = userDetail?.ResponseBody;

  const [full_name, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [query, setQuery] = useState('');
  const [postQuery, { isLoading }] = usePostQueryMutation();

  const validateFields = () => {
    if (full_name.trim() === '') {
      Toast.show('Please enter your full name');
      return false;
    }
    if (validateNameLength(full_name.trim())) {
      Toast.show('Full name must be at least 3 characters long');
      return false;
    }

    if (email.trim() === '') {
      Toast.show('Please enter your email');
      return false;
    }
    if (!validateEmail(email.trim())) {
      Toast.show('Please enter a valid email');
      return false;
    }

    if (query.trim() === '') {
      Toast.show('Please enter your query');
      return false;
    }

    return true;
  };



  const handleSubmit = async () => {
    if (!validateFields()) return; // Stop if inputs are invalid

    try {
      const response = await postQuery({
        token,
        full_name,
        email,
        query,
      }).unwrap();

      Toast.show(response.ResponseMessage);
      goBack()
    } catch (error) {
      Toast.show('Failed to submit query.');
      console.error('Query Error:', error);
    }
  };

  return (
    <WrapperContainer wrapperStyle={commonStyles.innerContainer}>
      <Loading visible={isLoading} />
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContentContainer}
        extraScrollHeight={10}
      >
        <AppTextInput
          value={full_name}
          onChangeText={setFullName}
          placeholder="Full Name"
        />
        <AppTextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
        />
        <Text style={styles.titleStyle}>Query</Text>
        <TextInput
          style={styles.txtInputStyle}
          placeholder="Enter your Query"
          value={query}
          onChangeText={setQuery}
          placeholderTextColor={COLORS.placeHolderTxtColor}
          multiline={true}
          numberOfLines={8}
        />
        <CustomBtn
          onPress={handleSubmit}
          title="Send"
          btnStyle={{ marginTop: verticalScale(120) }}
        />
      </KeyboardAwareScrollView>
    </WrapperContainer>
  );
};

export default HelpCenter;

const styles = StyleSheet.create({
  titleStyle: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: COLORS.textColor,
    textAlign: 'center',
    marginTop: verticalScale(40),
    marginBottom: verticalScale(10),
  },
  txtInputStyle: {
    borderWidth: 1,
    borderColor: COLORS.textColor,
    borderRadius: 10,
    textAlignVertical: 'top',
    minHeight: 157,
    maxHeight: 157,
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
    fontSize: 12,
    paddingHorizontal: moderateScale(25),
  },
});
