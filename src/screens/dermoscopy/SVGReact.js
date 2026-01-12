import React, { useState } from "react";
import { View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
// import { BODY_PART_IDS } from "./bodyParts";

const FULL_BODY_PATH = `PASTE_YOUR_FULL_SVG_PATH_HERE`;
const BODY_PART_IDS = {
    HEAD: "head",
    NECK: "neck",
    ARM_R: "arm_r",
    ARM_L: "arm_l",
    HAND_R: "hand_r",
    HAND_L: "hand_l",
    THORAX: "thorax",
    ABDOMEN: "abdomen",
    LEG_R: "leg_r",
    LEG_L: "leg_l",
    FOOT_R: "foot_r",
    FOOT_L: "foot_l",
  };
  
export default function HumanBodyMap({ onSelect }) {
  const [selected, setSelected] = useState(null);

  const handlePress = (part) => {
    setSelected(part);
    onSelect?.(part);
  };

  const highlight = (part) =>
    selected === part ? "rgba(255,0,0,0.35)" : "transparent";

  return (
    <View>
      <Svg viewBox="0 0 206 206" width={260} height={520}>

        {/* Full Body */}
        <Path d={FULL_BODY_PATH} fill="#000" />

        {/* HEAD */}
        <Rect
          x="70"
          y="5"
          width="65"
          height="30"
          fill={highlight(BODY_PART_IDS.HEAD)}
          onPress={() => handlePress(BODY_PART_IDS.HEAD)}
        />

        {/* NECK */}
        <Rect
          x="85"
          y="35"
          width="35"
          height="15"
          fill={highlight(BODY_PART_IDS.NECK)}
          onPress={() => handlePress(BODY_PART_IDS.NECK)}
        />

        {/* THORAX */}
        <Rect
          x="60"
          y="50"
          width="85"
          height="45"
          fill={highlight(BODY_PART_IDS.THORAX)}
          onPress={() => handlePress(BODY_PART_IDS.THORAX)}
        />

        {/* ABDOMEN */}
        <Rect
          x="65"
          y="95"
          width="75"
          height="35"
          fill={highlight(BODY_PART_IDS.ABDOMEN)}
          onPress={() => handlePress(BODY_PART_IDS.ABDOMEN)}
        />

        {/* ARM LEFT */}
        <Rect
          x="20"
          y="55"
          width="35"
          height="70"
          fill={highlight(BODY_PART_IDS.ARM_L)}
          onPress={() => handlePress(BODY_PART_IDS.ARM_L)}
        />

        {/* ARM RIGHT */}
        <Rect
          x="150"
          y="55"
          width="35"
          height="70"
          fill={highlight(BODY_PART_IDS.ARM_R)}
          onPress={() => handlePress(BODY_PART_IDS.ARM_R)}
        />

        {/* HAND LEFT */}
        <Rect
          x="15"
          y="125"
          width="40"
          height="30"
          fill={highlight(BODY_PART_IDS.HAND_L)}
          onPress={() => handlePress(BODY_PART_IDS.HAND_L)}
        />

        {/* HAND RIGHT */}
        <Rect
          x="150"
          y="125"
          width="40"
          height="30"
          fill={highlight(BODY_PART_IDS.HAND_R)}
          onPress={() => handlePress(BODY_PART_IDS.HAND_R)}
        />

        {/* LEG LEFT */}
        <Rect
          x="70"
          y="130"
          width="30"
          height="50"
          fill={highlight(BODY_PART_IDS.LEG_L)}
          onPress={() => handlePress(BODY_PART_IDS.LEG_L)}
        />

        {/* LEG RIGHT */}
        <Rect
          x="105"
          y="130"
          width="30"
          height="50"
          fill={highlight(BODY_PART_IDS.LEG_R)}
          onPress={() => handlePress(BODY_PART_IDS.LEG_R)}
        />

        {/* FOOT LEFT */}
        <Rect
          x="70"
          y="180"
          width="30"
          height="20"
          fill={highlight(BODY_PART_IDS.FOOT_L)}
          onPress={() => handlePress(BODY_PART_IDS.FOOT_L)}
        />

        {/* FOOT RIGHT */}
        <Rect
          x="105"
          y="180"
          width="30"
          height="20"
          fill={highlight(BODY_PART_IDS.FOOT_R)}
          onPress={() => handlePress(BODY_PART_IDS.FOOT_R)}
        />

      </Svg>
    </View>
  );
}
