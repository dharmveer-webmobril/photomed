import * as React from "react";
import Svg, { Path } from "react-native-svg";
/* SVGR has dropped some elements not supported by react-native-svg: title */
const GoogleDriveIcon = (props) => (
  <Svg
    fill="#FFFFFF"
    width="20px"
    height="20px"
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path d="M30.748 19.87h-10.012l-9.744-16.881h10.016l9.74 16.88zM10.992 20.339l-5.004 8.673-5.008-8.673 9.744-16.881 5.005 8.675zM6.529 29.012l5.007-8.673h19.484l-5.007 8.673z" />
  </Svg>
);
export default GoogleDriveIcon;
