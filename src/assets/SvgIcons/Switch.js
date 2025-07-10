import * as React from "react";
import Svg, { G, Path } from "react-native-svg";
const Switch = (props) => (
  <Svg
    width="21px"
    height="21px"
    viewBox="0 0 21 21"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <G
      fill="none"
      fillRule="evenodd"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="matrix(0 1 -1 0 18.5 2.5)"
    >
      <G transform="matrix(0 -1 1 0 .5 16.5)">
        <Path d="m16 0v5h-5" transform="matrix(0 1 1 0 11 -11)" />
        <Path d="m16 5c-2.8366699-3.33333333-5.6700033-5-8.5-5-2.82999674 0-5.32999674 1-7.5 3" />
      </G>
      <G transform="matrix(0 1 -1 0 14 1)">
        <Path d="m16 0v5h-5" transform="matrix(0 1 1 0 11 -11)" />
        <Path d="m16 5c-2.8366699-3.33333333-5.6700033-5-8.5-5-2.82999674 0-5.32999674 1-7.5 3" />
      </G>
    </G>
  </Svg>
);
export default Switch;
