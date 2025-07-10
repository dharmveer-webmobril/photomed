import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useState, useCallback } from 'react';
import WrapperContainer from '../../components/WrapperContainer';
import { height, moderateScale, verticalScale } from '../../styles/responsiveLayoute';
import COLORS from '../../styles/colors';
import FONTS from '../../styles/fonts';
import { useDeleteNotificationMutation, useGetNotificationsQuery } from '../../redux/api/common';
import { useDispatch, useSelector } from 'react-redux';
import Loading from '../../components/Loading';
import Toast from 'react-native-simple-toast';
import Item from '../../components/Item';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { logout } from '../../redux/slices/authSlice';
import DeleteImagePopUp from '../../components/DeleteImagePopUp';

const Notification = () => {
  const token = useSelector((state) => state.auth?.user);
  const navigation = useNavigation()
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [openedIndex, setOpenedIndex] = useState(null); // State to track opened notification
  const [isVisible, setIsVisible] = useState(false)

  const { data, refetch, error, isLoading } = useGetNotificationsQuery({ token });
  const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();

  const notifications = data?.ResponseBody?.notifications;

  const reversedNotifications = notifications ? [...notifications].reverse() : [];

  if (error?.data?.isDeleted || error?.data?.status === 2) {
    dispatch(logout());
    Toast.show('Your account is deactivated. Please contact the administrator.');
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      console.error('Error refreshing notifications:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const clearAll = async () => {
    if (notifications?.length > 0) {
      const notificationIds = notifications.map((notification) => notification._id); // Collect all IDs
      try {
        await deleteNotification({ notificationIds, token }).unwrap(); // Call delete API with all IDs
        Toast.show('All notifications deleted successfully!');
        setIsVisible(false); // Hide the popup
        await refetch(); // Refresh notifications
      } catch (error) {
        console.error('Failed to delete all notifications:', error);
        Toast.show('Failed to delete all notifications.');
      }
    } else {
      Toast.show('No notifications to delete.');
    }
  };
  

  React.useLayoutEffect(() => {
    if (notifications && notifications.length > 0) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity onPress={() => setIsVisible(true)} style={styles.btnContainer}>
            <Text style={styles.txtStyle}>Clear All</Text>
          </TouchableOpacity>
        ),
      });
    } else {
      navigation.setOptions({
        headerRight: null, // Removes the button when notifications are empty
      });
    }
  }, [navigation, notifications]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const openComponent = (index) => {
    setOpenedIndex(index);
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification({ notificationIds: [notificationId], token }).unwrap();
      Toast.show('Notification deleted successfully!');
      await refetch()
    } catch (error) {
      console.error('Failed to delete notification:', error);
      Toast.show('Failed to delete notification.');
    }
  };

  return (
    <WrapperContainer wrapperStyle={styles.container}>
      <Loading visible={isLoading || isDeleting} />
      <DeleteImagePopUp
        title={'Delete All Notifications'}
        onPressCancel={() => setIsVisible(false)}
        onPressDelete={() => clearAll()}
        visible={isVisible}
      />
      <FlatList
        data={reversedNotifications}
        renderItem={({ item, index }) => (
          <Item
            item={{ ...item, opened: openedIndex === index }} // Pass `opened` flag
            index={index}
            onComponentOpen={() => openComponent(index)}
            onDelete={() => handleDeleteNotification(item?._id)}
          />
        )}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: height / 1.25 }}>
            <Text style={[styles.txtStyle, { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textColor }]}>{'No Data Found'}</Text>
          </View>
        }
      />
    </WrapperContainer>
  );
};

export default Notification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.whiteColor,
    marginBottom: Platform.OS === 'android' ? verticalScale(65) : verticalScale(50),
  },
  btnContainer: {
    backgroundColor: COLORS.primary,
    height: moderateScale(30),
    width: moderateScale(80),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
    marginRight: 10
  },
  txtStyle: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.whiteColor
  },
});
