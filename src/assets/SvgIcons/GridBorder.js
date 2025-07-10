import * as React from "react";
import Svg, { Rect } from "react-native-svg";
const GridBorder = ({tintColor='#484848',...props}) => (
  <Svg
    width={32}
    height={32}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Rect
      x={0.75}
      y={0.75}
      width={30.5}
      height={30.5}
      stroke={tintColor}
      strokeWidth={0.5}
    />
  </Svg>
);
export default GridBorder;
