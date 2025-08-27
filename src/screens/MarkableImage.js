import React from "react";
import { View, ImageBackground } from "react-native";
import { SketchCanvas } from "@terrylinla/react-native-sketch-canvas";

const MarkMoleArea = ({ photo }) => {
  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={{ uri: "https://randomuser.me/api/portraits/men/1.jpg" }}
        style={{ flex: 1 }}
        resizeMode="contain"
      >
        <SketchCanvas
          style={{ flex: 1 }}
          strokeColor={"red"}
          strokeWidth={3}
          onStrokeEnd={(path) => {
            console.log("Mole marked path:", path);
            // You can save this path or export as an image
          }}
        />
      </ImageBackground>
    </View>
  );
};

export default MarkMoleArea;
