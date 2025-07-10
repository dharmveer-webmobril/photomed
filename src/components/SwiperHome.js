import React from 'react';
import { View, StyleSheet, useWindowDimensions, Image } from 'react-native';
import { SwiperFlatList } from 'react-native-swiper-flatlist';
import COLORS from '../styles/colors'; // Use your COLORS file
import { configUrl } from '../configs/api';
import ImageWithLoader from './ImageWithLoader';



const ResponsiveSwiper = ({ data }) => {
    const { width, height } = useWindowDimensions();
    const formatUrl = (url) => {
        // Replace backslashes with forward slashes
        let formattedUrl = url.replace(/\\/g, "/");
        // Encode the URI to handle special characters
        return encodeURI(formattedUrl);
    };
    return (
        <View style={styles.container}>
            <SwiperFlatList
                data={data}
                showPagination
                autoplay
                autoplayDelay={3}
                autoplayLoop
                paginationActiveColor={COLORS.primary}
                paginationStyle={{ bottom: 10 }}
                paginationStyleItemInactive={styles.inactiveDot}
                paginationStyleItemActive={styles.activeDot}
                renderItem={({ item }) => {
                    const rawUrl = `${configUrl.imageUrl}${item?.profiles[0]}`;
                    const formattedUrl = formatUrl(rawUrl);
                    return <View style={[styles.child, { width, backgroundColor: "red" }]}>
                        <ImageWithLoader
                            uri={formattedUrl}
                            resizeMode={'contain'}
                            // style={{
                            //     width: width - 100,
                            //     height: height * 0.03,
                            //     alignSelf: "center",
                            //     height: verticalScale(150),
                            // }}
                            style={{ width: width * 0.9, height: height * 0.3, borderRadius: 10 }}
                        />
                    </View>
                }
                }
            />
        </View>
    );
};

export default ResponsiveSwiper;

const styles = StyleSheet.create({
    container: {
        // flex: 1,
        alignItems: 'center',
    },
    child: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    inactiveDot: {
        backgroundColor: COLORS.whiteColor,
        borderColor: COLORS.primary,
        borderWidth: 1,
        height: 6,
        width: 6,
        marginHorizontal: 3,
    },
    activeDot: {
        backgroundColor: COLORS.primary,
        height: 8,
        width: 8,
        marginHorizontal: 3,
    },
});
