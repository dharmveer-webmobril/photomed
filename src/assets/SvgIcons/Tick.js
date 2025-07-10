import * as React from "react";
import Svg, { Rect, Path } from "react-native-svg";

const Tick = ({ color = "#32327C", ...props }) => (
  <Svg
    width="800px"
    height="800px"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    {...props}
  >
    <Rect width={16} height={16} id="icon-bound" fill="none" />
    <Path
      d="M0,9.014L1.414,7.6L5.004,11.189L14.593,1.6L16.007,3.014L5.003,14.017L0,9.014Z"
      fill={color} // Set the color dynamically
    />
  </Svg>
);

export default Tick;
