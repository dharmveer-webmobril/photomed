import React, { useRef, useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import DeleteIcon from '../assets/SvgIcons/DeleteIcon'
import commonStyles from '../styles/commonStyles';
import { imagePath } from '../configs/imagePath';
import TimeAgo from './TimeAgo';
import FONTS from '../styles/fonts';
import COLORS from '../styles/colors';
import { moderateScale } from '../styles/responsiveLayoute';
import FastImage from 'react-native-fast-image';

const Item = ({ item, index, onComponentOpen, onDelete }) => {
    const ref = useRef();

    const rightSwipe = () => {
        return (
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                    if (ref.current) ref.current.close();
                    onDelete(item._id);
                }}>
                <DeleteIcon/>
            </TouchableOpacity>
        );
    };

    useEffect(() => {
        if (!item.opened && ref.current) {
            ref.current.close();
        }
    }, [item.opened]);

    return (
        <GestureHandlerRootView>
        <Swipeable
            ref={ref}
            renderLeftActions={null}
            renderRightActions={rightSwipe}
            onSwipeableOpen={() => {
                onComponentOpen(index);
            }}>
            <View style={[styles.cardContainer, { marginHorizontal: 10 }]}>
        <View style={[commonStyles.flexView, { flex: 1 }]}>
          <FastImage source={imagePath.logo} style={styles.imgStyle} />
          <View style={{ flex: 1 }}>
            {item.notificationType && <Text style={styles.titleStyle}>{item.notificationType}</Text>}
            <Text numberOfLines={3} style={styles.subtitle}>
              {item.summary}
            </Text>
          </View>
        </View>
        <TimeAgo timestamp={item.createdAt} />
      </View>
        </Swipeable>
        </GestureHandlerRootView>

    );
}

export default React.memo(Item);

const styles = StyleSheet.create({
    deleteButton: {
        width: 100,
        height: moderateScale(70), // Matches cardContainer height
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        marginVertical: moderateScale(8),
        marginRight:moderateScale(15)
    },
    cardContainer: {
        ...commonStyles.shadowContainer,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
        width: '90%',
        flex: 1,
        padding: moderateScale(10),
        marginVertical: moderateScale(8),
        height: moderateScale(70), // Explicitly set height
    },
    imgStyle: {
        height: 40,
        width: 40,
        resizeMode: 'cover',
        borderRadius: 10,
        marginRight: moderateScale(10),
        borderColor: COLORS.textColor,
        borderWidth: 1,
    },
    titleStyle: {
        fontFamily: FONTS.medium,
        fontSize: 11,
        color: COLORS.textColor,
    },
    subtitle: {
        fontFamily: FONTS.regular,
        fontSize: 10,
        color: COLORS.textColor,
    },
});
