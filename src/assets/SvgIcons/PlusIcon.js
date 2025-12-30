import * as React from "react";
import Svg, { Path } from "react-native-svg";
const PlusIcon = (props) => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path
      d="M12 5V19M5 12H19"
      stroke={props.color || "#32327C"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default PlusIcon;







