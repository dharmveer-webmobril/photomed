import * as React from "react";
import Svg, { G, Path, Defs, ClipPath, Rect } from "react-native-svg";
const ReframeIcon = ({tintColor='#32327C',...props}) => (
  <Svg
    width={26}
    height={26}
    viewBox="0 0 26 26"
    fill={"none"}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <G clipPath="url(#clip0_210_286)">
      <Path
        d="M7.93687 22.8331C4.4625 21.1756 1.97625 17.8075 1.59375 13.8125H0C0.541875 20.3575 6.01375 25.5 12.6969 25.5C12.9412 25.5 13.1644 25.4787 13.3981 25.4681L9.35 21.4094L7.93687 22.8331ZM12.8031 0C12.5588 0 12.3356 0.02125 12.1019 0.0425L16.15 4.09062L17.5631 2.6775C21.0375 4.32438 23.5238 7.6925 23.9062 11.6875H25.5C24.9581 5.1425 19.4862 0 12.8031 0ZM17 14.875H19.125V8.5C19.125 7.93641 18.9011 7.39591 18.5026 6.9974C18.1041 6.59888 17.5636 6.375 17 6.375H10.625V8.5H17V14.875ZM8.5 17V4.25H6.375V6.375H4.25V8.5H6.375V17C6.375 17.5636 6.59888 18.1041 6.9974 18.5026C7.39591 18.9011 7.93641 19.125 8.5 19.125H17V21.25H19.125V19.125H21.25V17H8.5Z"
        fill={tintColor}
      />
    </G>
    <Defs>
      <ClipPath id="clip0_210_286">
        <Rect width={25.5} height={25.5} fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);
export default ReframeIcon;
