import * as React from "react";
import Svg, { Path } from "react-native-svg";
const CollegeIcon = (props) => (
  <Svg
    width={30}
    height={30}
    viewBox="0 0 30 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path
      d="M6.25 3.75C4.8625 3.75 3.75 4.8625 3.75 6.25V23.75C3.75 25.1375 4.8625 26.25 6.25 26.25H13.75V3.75M16.25 3.75V13.75H26.25V6.25C26.25 4.8625 25.1375 3.75 23.75 3.75M16.25 16.25V26.25H23.75C25.1375 26.25 26.25 25.1375 26.25 23.75V16.25"
      fill="white"
    />
  </Svg>
);
export default CollegeIcon;
