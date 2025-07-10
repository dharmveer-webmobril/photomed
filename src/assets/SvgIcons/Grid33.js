import * as React from "react";
import Svg, { Line } from "react-native-svg";
const Grid33 = (props) => (
  <Svg
    width={35}
    height={35}
    viewBox="0 0 35 35"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Line x1={23.875} x2={23.875} y2={35} stroke="#484848" strokeWidth={0.5} />
    <Line x1={10.75} x2={10.75} y2={35} stroke="#484848" strokeWidth={0.5} />
    <Line
      x1={35}
      y1={23.875}
      x2={-1.09278e-8}
      y2={23.875}
      stroke="#484848"
      strokeWidth={0.5}
    />
    <Line
      x1={35}
      y1={11.625}
      x2={-1.09278e-8}
      y2={11.625}
      stroke="#484848"
      strokeWidth={0.5}
    />
  </Svg>
);
export default Grid33;
