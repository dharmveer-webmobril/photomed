import { FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import WrapperContainer from '../../components/WrapperContainer'
import commonStyles from '../../styles/commonStyles'
import { imagePath } from '../../configs/imagePath'
import COLORS from '../../styles/colors'
import FONTS from '../../styles/fonts'
import { moderateScale, verticalScale } from '../../styles/responsiveLayoute'
import { navigate } from '../../navigators/NavigationService'
import ScreenName from '../../configs/screenName'
import AccountPopUp from '../../components/AccountPopUp'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'
import { useCurrentUserProfileQuery, useDeleteAccountMutation } from '../../redux/api/user'
import { configUrl } from '../../configs/api'
import Loading from '../../components/Loading'
import Toast from 'react-native-simple-toast'
import { useFocusEffect } from '@react-navigation/native'
import DropboxIcon from '../../assets/SvgIcons/DropboxIcon'
import GoogleDriveIcon from '../../assets/SvgIcons/GoogleDriveIcon'
import ImageWithLoader from '../../components/ImageWithLoader'


const Profile = (props) => {
  const [logoutVisible, setLogoutVisible] = useState(false)
  const [deleteVisible, setDeleteVisible] = useState(false)
  const [userImage, setUserImage] = useState('')
  const dispatch = useDispatch()
  const token = useSelector((state) => state.auth?.user);
  const provider = useSelector((state) => state.auth.cloudType);

  const [deleteAccount, { isLoading: loading }] = useDeleteAccountMutation();
  const { data: userDetail, isLoading, error, refetch } = useCurrentUserProfileQuery({ token });
  const user = userDetail?.ResponseBody;
  // console.log('user',user);

  if (error?.data?.isDeleted || error?.data?.status === 2) {
    dispatch(logout());
    props.navigation.reset({
      index: 0,
    })
    Toast.show('Your account is deactivated. Please contact the administrator.')
    // console.log('errrrr',error?.data?.isDeleted,error?.data?.status)
  }

  useFocusEffect(
    useCallback(() => {
      refetch(); // Refetch data when screen comes into focus
    }, [refetch])
  );
  useEffect(() => {
    if (userDetail?.ResponseBody?.profile) {
      setUserImage(userDetail?.ResponseBody?.profile)
    }
  }, [userDetail])


  const handleDeleteAccount = async () => {
    try {
      const result = await deleteAccount({ token, id: user._id }).unwrap();
      setDeleteVisible(false)
      // Optionally, trigger a success notification or redirect the user
      Toast.show(result?.ResponseMessage)
      dispatch(logout())
    } catch (err) {
      Toast.show(err?.data?.ResponseMessage)
      setDeleteVisible(false)
      // Handle error - could display a message to the user
    }
  };




  const data = [
    {
      id: 1,
      name: 'Profile',
      screenName: ScreenName.EDIT_PROFILE,
    },
    ...(!user?.login_type ? [{
      id: 2,
      name: 'Change Password',
      screenName: ScreenName.CHANGE_PASSWORD,
    }] : []),

    ...(Platform.OS == 'ios' ? [{
      id: 8,
      name: 'Manage Subscription',
      screenName: ScreenName.SUB_MANAGE,
    }] : []),

    {
      id: 4,
      name: 'Privacy Policy',
      screenName: ScreenName.TERMS,
      slug: 'privacy-policy'
    },
    {
      id: 5,
      name: 'Legal Content',
      screenName: ScreenName.TERMS,
      slug: 'legal-content'
    },
    {
      id: 6,
      name: 'About Us',
      screenName: ScreenName.TERMS,
      slug: 'about-us'
    },
    {
      id: 7,
      name: 'Help Center',
      screenName: ScreenName.HELP_CENTER,
    },
  ];

  const navigateToNextScreen = (screen, slug, name) => {
    if (screen == ScreenName.EDIT_PROFILE) {
      navigate(screen, { user })
    } else if (screen == ScreenName.SUB_MANAGE) {
      navigate(screen, { token: token,from:'profile' })
    } else {
      navigate(screen, { slug: slug, screenName: name })
    }
  }

  const CommonComp = ({ title, arrow, onPress }) => {
    return (
      <TouchableOpacity onPress={onPress}
        style={styles.cardStyle}>
        <Text style={styles.txtStyle}>{title}</Text>
        {!arrow && <Image source={imagePath.rightArrow} />}
      </TouchableOpacity>
    )
  }

  return (
    <WrapperContainer wrapperStyle={[commonStyles.innerContainer, styles.container]}>
      <Loading visible={isLoading || loading} />
      <AccountPopUp title={'Logout'}
        onPressCancel={() => setLogoutVisible(false)}
        onPressSuccess={() => dispatch(logout())}
        subTitle={'Are you sure you want to logout from Photomed Pro? this will end your current session.'}
        visible={logoutVisible} />
      <AccountPopUp title={'Delete Account'}
        onPressCancel={() => setDeleteVisible(false)}
        onPressSuccess={handleDeleteAccount}
        subTitle={'Are you sure you want to Delete \n your account? This action can not be undone.'}
        visible={deleteVisible} />
      <View style={styles.profileContainer}>
        <ImageWithLoader uri={userImage ? { uri: configUrl.imageUrl + userImage } : imagePath.no_user_img} style={styles.userIcon} />
        <TouchableOpacity onPress={() => navigate(ScreenName.EDIT_PROFILE, { user })}
          style={styles.editIconContainer}>
          <Image source={imagePath.edit} />
        </TouchableOpacity>
      </View>
      <Text style={styles.titleStyle}>{user?.full_name}</Text>
      {provider == 'google' ? (
        <View style={styles.providerStyle}>
          <GoogleDriveIcon />
          <Text style={styles.providerTxt}>{'Connected Via ' + provider?.charAt(0)?.toUpperCase() + provider?.slice(1)}</Text>
        </View>
      ) : (
        <View style={styles.providerStyle}>
          <DropboxIcon />
          <Text style={styles.providerTxt}>{'Connected Via ' + provider?.charAt(0)?.toUpperCase() + provider?.slice(1)}</Text>
        </View>
      )}
      <View style={{ flex: 1, marginBottom: verticalScale(50) }}>
        <FlatList
          showsVerticalScrollIndicator={false}
          data={data}
          renderItem={({ item }) => {
            return (
              <CommonComp
                key={item.id}
                onPress={() => navigateToNextScreen(item.screenName, item?.slug, item.name)}
                title={item.name} />
            )
          }}
          ListFooterComponent={
            <>
              <CommonComp arrow
                onPress={() => setLogoutVisible(true)}
                title={'Logout'} />
              <CommonComp arrow
                onPress={() => setDeleteVisible(true)}
                title={'Delete Account'} /></>
          } />
      </View>

    </WrapperContainer>
  )
}

export default Profile

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20
  },
  profileContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  }, userIcon: {
    height: 80,
    width: 80,
    borderRadius: 80,
    borderColor: COLORS.primary,
    // borderWidth: 2
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
  cardStyle: {
    ...commonStyles.flexView,
    justifyContent: 'space-between',
    borderColor: COLORS.textColor,
    borderRadius: 5,
    borderWidth: 1,
    padding: 10,
    width: '100%',
    paddingHorizontal: moderateScale(20),
    marginBottom: verticalScale(20)
  }, txtStyle: {
    fontSize: 12,
    color: COLORS.textColor,
    fontFamily: FONTS.medium
  },
  titleStyle: {
    fontFamily: FONTS.semiBold,
    color: COLORS.textColor,
    fontSize: 12,
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10)
  },
  providerStyle: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 20,
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    paddingVertical: verticalScale(5)
  },
  providerTxt: {
    fontFamily: FONTS.medium,
    color: COLORS.whiteColor,
    fontSize: 12,
    marginLeft: 5
  }
})