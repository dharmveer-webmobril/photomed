import React, { useRef, useState } from 'react';
import { Alert, Image, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import {ResumableZoom} from 'react-native-zoom-toolkit';
import { scalePoint } from './scaling';
import COLORS from '../styles/colors';
import FaceMan from "../assets/SvgIcons/FaceMan";
import EyeIcon from "../assets/SvgIcons/EyeIcon";
import NoseIcon from "../assets/SvgIcons/NoseIcon";
import LipIcon from "../assets/SvgIcons/LipIcon";
import FullScreen from "../assets/SvgIcons/FullScreen";
import { moderateScale, verticalScale } from '../styles/responsiveLayoute';

const ImageZoomML = (props) => {
  const ref = useRef(null);
  const [filter, setSelectedFilter] = useState('reset');

  console.log('props.route.params.imageUri', props.route.params);

  const { width } = useWindowDimensions();

  const scaledPoint = scalePoint(props.route.params.imageData?.width, props.route.params.imageData?.height, width);

  const zoomToTarget = (targetType) => {
    if (filter == targetType) return;
    const face = props.route.params.faces[0];
    const { landmarks } = face;
    let target;
    let zoomLevel;
    try {
      switch (targetType) {
        case "nose":
          target = scaledPoint(landmarks.noseBase.position);
          zoomLevel = 6
          break;
        case "eyes":
          target = {
            x: ((landmarks.leftEye.position.x + landmarks.rightEye.position.x) / 2),
            y: ((landmarks.leftEye.position.y + landmarks.rightEye.position.y) / 2),
          };
          target = scaledPoint(target);
          zoomLevel = 4.5
          break;
        case "mouth":
          target = scaledPoint(landmarks.mouthBottom.position);
          zoomLevel = 5.5
          break;
        case 'FaceMan': {
          target = scaledPoint(landmarks.noseBase.position);
          zoomLevel = 3;
          break;
        }
        default:
          ref.current.reset();
          setSelectedFilter(targetType)
          return;
      }

      setSelectedFilter(targetType)
      if (ref?.current) {
        ref.current.reset();
        setTimeout(() => {
          ref.current.zoom(zoomLevel, target);
        }, 300);
      }
    } catch (error) {
      Alert.alert('No Face Detected', 'Cannot zoom to a face part as no face was detected.');
    }
  };

  const FilterComp = ({ onPress, Icon, isFilterSelected }) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          marginHorizontal: moderateScale(10),
          backgroundColor: COLORS.greyBgColor,
          borderColor: isFilterSelected ? COLORS.primary : COLORS.greyBgColor,
          borderWidth: isFilterSelected ? 3 : 1,
          height: 42,
          width: 42,
          borderRadius: 10,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: verticalScale(5),
        }}
      >
        {Icon && Icon}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <ResumableZoom ref={ref} maxScale={10}>
        {/* <View style={{ height: 400, width: width,backgroundColor:"#000" }}> */}
        <Image source={{ uri: props.route.params.imageData.path }} style={{ height: 400, width: width }} resizeMode='contain' />
        {/* </View> */}
      </ResumableZoom>

      <View style={{ position: "absolute", alignSelf: "center", bottom: 10 }}>
        <View style={{ flexDirection: 'row' }}>
          <FilterComp
            onPress={() => zoomToTarget('FaceMan')}
            Icon={<FaceMan />}
            isFilterSelected={filter == 'FaceMan'}
          />
          <FilterComp
            onPress={() => zoomToTarget('eyes')}
            Icon={<EyeIcon />}
            isFilterSelected={filter == 'eyes'}
          />
          <FilterComp
            onPress={() => zoomToTarget('nose')}
            Icon={<NoseIcon />}
            isFilterSelected={filter == 'nose'}
          />
          <FilterComp
            onPress={() => zoomToTarget('mouth')}
            Icon={<LipIcon />}
            isFilterSelected={filter == 'mouth'}
          />
          <FilterComp
            onPress={() => zoomToTarget('reset')}
            Icon={<FullScreen />}
            isFilterSelected={filter == 'reset'}
          />
        </View>
      </View>
    </View>
  );

};

export default ImageZoomML;