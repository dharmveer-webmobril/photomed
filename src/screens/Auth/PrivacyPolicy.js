import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, RefreshControl } from 'react-native';
import WrapperContainer from '../../components/WrapperContainer';
import commonStyles from '../../styles/commonStyles';
import FONTS from '../../styles/fonts';
import COLORS from '../../styles/colors';
import { useGetTermsConditionsQuery } from '../../redux/api/common';
import { useSelector } from 'react-redux';
import Loading from '../../components/Loading';
import { useNavigation, useRoute } from '@react-navigation/native';
import HTMLView from 'react-native-htmlview';


const PrivacyPolicy = () => {
  const { params } = useRoute();
  
  const navigation = useNavigation();
  const { slug, screenName = 'Details' } = params; // Default title fallback
  console.log('paramass',screenName);

  const token = useSelector((state) => state.auth?.user?.token); // Ensure token is correctly accessed
  const { data, error, isLoading, isFetching, refetch } = useGetTermsConditionsQuery({ token });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: screenName });
  }, [screenName, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch(); // Refetch the data
    } finally {
      setRefreshing(false);
    }
  };

  // const removeHtmlTags = (str) => str?.replace(/<\/?[^>]+(>|$)/g, '') || '';

  const termsContent = (() => {
    if (!data) return 'Content not found.';
    const filtered = data.ResponseBody?.find((item) => item.slug === slug);
    return filtered?.content || 'Content not found.';
})();

  console.log('termsllslssss',termsContent.content);
  

  const htmlContent = `<p><a href="http://jsdf.co">&hearts; nice job!</a></p>`;
  console.log('htnmllll',htmlContent);



  if (isLoading || isFetching) {
    return (
      <WrapperContainer wrapperStyle={commonStyles.innerContainer}>
        <Loading visible />
      </WrapperContainer>
    );
  }

  if (error) {
    return (
      <WrapperContainer wrapperStyle={commonStyles.innerContainer}>
        <Text style={styles.errorText}>An error occurred while fetching the terms and conditions.</Text>
      </WrapperContainer>
    );
  }

  return (
    <WrapperContainer wrapperStyle={commonStyles.innerContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]} // Set the color of the refresh spinner
            tintColor={COLORS.primary} // iOS spinner color
          />
        }
      >
        {/* <Text style={styles.txtStyle}>{termsContent}</Text> */}
        <HTMLView
          value={`${termsContent}`}
          stylesheet={Htmlstyles}
        />
      </ScrollView>
    </WrapperContainer>
  );
};

export default PrivacyPolicy;

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 10,
    paddingBottom:40
  },
  txtStyle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textColor,
    lineHeight: 18,
    textAlign: 'justify',
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.errorColor,
    textAlign: 'center',
    padding: 20,
  },
});

const Htmlstyles = StyleSheet.create({
  p: {
      fontWeight: '600',
      color: 'black', // make links coloured pink
      marginVertical:-15
  },
  li: {
      fontWeight: '300',
      color: 'black', // make links coloured pink
  },
  ul: {
      fontWeight: '300',
      color: 'black', // make links coloured pink
      // marginVertical:10,
      marginBottom:20
  },
  strong:{
      color: 'black',

  },
  h1:{
      color: 'black',
      fontWeight:'700'
  },
  // h2:{
  //     color: 'black',
  //     fontWeight:'700'
  // },
  h3:{
      color: 'black',
      fontWeight:'700'
  },
  h4:{
      color: 'black',
      fontWeight:'700'
  },
  h5:{
      color: 'black',
      fontWeight:'700'
  }, h6:{
      color: 'black',
      fontWeight:'700'
  }

});
