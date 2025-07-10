import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { scaleFrame, scalePoint } from './scaling';

const FaceMap = ({ face, width, height, showLandmarks, showContours, showFrame }) => {
  const screen = useWindowDimensions();
  const scaledFrame = scaleFrame(width, height, screen.width);
  const scaledPoint = scalePoint(width, height, screen.width);

  const { landmarks, contours } = face;
  const frame = scaledFrame(face.frame);

  function renderContours() {
    return contours && Object.entries(contours).map(([key, contour]) => {
      const points = contour.points;
      return (
        <React.Fragment key={key}>
          {points.map((point, pointId) => {
            const { x, y } = scaledPoint(point);
            return (
              <View
                key={`${pointId}-${x}-${y}`}
                style={[
                  styles.contourPoint,
                  { left: x, top: y },
                ]}
              />
            );
          })}
          <View
            style={[
              styles.contourPath,
              {
                left: points[0].x,
                top: points[0].y,
                width: points[points.length - 1].x - points[0].x,
                height: points[points.length - 1].y - points[0].y,
              },
            ]}
          />
        </React.Fragment>
      );
    });
  }

  return (
    <View style={[styles.container, { width, height }]}>
      {showFrame && frame && (
        <View
          style={[
            styles.frame,
            {
              width: frame.width,
              height: frame.height,
              left: frame.left,
              top: frame.top,
              backgroundColor:'#00000050',
            },
          ]}
        />
      )}

      {showLandmarks &&
        landmarks &&
        Object.entries(landmarks).map(([key, landmark]) => {
          const { x, y } = scaledPoint(landmark.position);
          console.log('landmarkslandmarks',key);
          console.log('landmarkslandmarks',x,y);
          
          return (
            <View
              key={key}
              style={[
                styles.landmark,
                { left: x - 3, top: y - 3 }, // Adjust center of circle
              ]}
            />
          );
        })
        }

      {showContours && renderContours()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  frame: {
    position: 'absolute',
    borderColor: 'white',
    // borderWidth: 2,
    opacity: 0.75,
  },
  landmark: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'yellow',
  },
  contourPoint: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'skyblue',
    opacity: 0.5,
  },
  contourPath: {
    position: 'absolute',
    borderColor: 'white',
    borderWidth: 1,
    opacity: 0.5,
  },
});

export default FaceMap;
