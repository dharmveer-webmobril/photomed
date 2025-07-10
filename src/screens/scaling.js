function rotateFrame(frame) {
    return {
      top: frame.left,
      left: frame.top,
      width: frame.height,
      height: frame.width,
    };
  }
  
  function rotatePoint(point) {
    return { x: point.y, y: point.x };
  }
  
  function shownDimensionsPortrait(screenWidth, imageWidth, imageHeight) {
    const shownHeight = screenWidth;
    const shownWidth = (imageWidth / imageHeight) * screenWidth;
  
    return {
      width: shownWidth,
      height: shownHeight,
    };
  }
  
  function scalePointPortrait(screenWidth, imageWidth, imageHeight, point) {
    const shown = shownDimensionsPortrait(screenWidth, imageWidth, imageHeight);
    const xOffset = (screenWidth - shown.width) / 2;
  
    return {
      x: (shown.width / imageWidth) * point.x + xOffset,
      y: (shown.height / imageHeight) * point.y,
    };
  }
  
  function scalePoint(imageWidth, imageHeight, screenWidth) {
    return function scaledPoint(point) {
      const portrait = imageHeight > imageWidth;
  
      if (portrait) {
        return scalePointPortrait(screenWidth, imageWidth, imageHeight, point);
      }
  
      return rotatePoint(
        scalePointPortrait(
          screenWidth,
          imageHeight,
          imageWidth,
          rotatePoint(point)
        )
      );
    };
  }
  
  function scaleFramePortrait(screenWidth, imageWidth, imageHeight, frame) {
    const shown = shownDimensionsPortrait(screenWidth, imageWidth, imageHeight);
    const point = scalePointPortrait(screenWidth, imageWidth, imageHeight, {
      x: frame.left,
      y: frame.top,
    });
  
    return {
      left: point.x,
      top: point.y,
      width: (shown.width / imageWidth) * frame.width,
      height: (shown.height / imageHeight) * frame.height,
    };
  }
  
  function scaleFrame(imageWidth, imageHeight, screenWidth) {
    return function scaledFrame(frame) {
      if (!frame) {
        return undefined;
      }
  
      const portrait = imageHeight > imageWidth;
  
      if (portrait) {
        return scaleFramePortrait(screenWidth, imageWidth, imageHeight, frame);
      }
  
      return rotateFrame(
        scaleFramePortrait(
          screenWidth,
          imageHeight,
          imageWidth,
          rotateFrame(frame)
        )
      );
    };
  }
  
  export { scalePoint, scaleFrame };
  