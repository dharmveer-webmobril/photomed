import { StyleSheet } from 'react-native';
import COLORS from './colors';
import FONTS from './fonts';
import { moderateScale, verticalScale } from './responsiveLayoute';
const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.whiteColor
  },
  flexView: {
    // justifyContent:'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  authTitleStyle: {
    fontFamily: FONTS.medium,
    fontSize: 20,
    color: COLORS.textColor,
    marginBottom: 10
  },
  authSbTitleStyle: {
    fontSize: 12,
    marginBottom: verticalScale(20),
    fontFamily: FONTS.regular,
    color: COLORS.textColor
  },
  shadowContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
    alignSelf: 'center'
  }

});
export default commonStyles;
