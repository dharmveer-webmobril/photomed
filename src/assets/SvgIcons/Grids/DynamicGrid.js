import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line } from 'react-native-svg';

const DynamicGrid = ({
    rows = 4, // Number of rows
    columns = 4, // Number of columns
    containerHeight, // Custom container height (optional)
    containerWidth, // Custom container width (optional)
    strokeColor = 'white', // Grid line color
    strokeWidth = 1, // Line thickness
    dashArray = '5 5', // Dash pattern for the lines
}) => {
    // Screen dimensions as fallback
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

    // Use provided dimensions or fallback to screen size
    const containerW = containerWidth || screenWidth;
    const containerH = containerHeight || screenHeight;

    // Calculate the size of each cell based on rows/columns
    const cellWidth = containerW / columns;
    const cellHeight = containerH / rows;

    // Adjust grid height or width to maintain aspect ratio
    const adjustedWidth = columns * cellWidth;
    const adjustedHeight = rows * cellHeight;

    // Generate positions for vertical and horizontal lines
    const verticalLines = Array.from({ length: columns + 1 }, (_, i) => i * cellWidth);
    const horizontalLines = Array.from({ length: rows + 1 }, (_, i) => i * cellHeight);

    return (
        <View style={[styles.container, { width: adjustedWidth, height: adjustedHeight }]}>
            <Svg width={adjustedWidth} height={adjustedHeight} style={StyleSheet.absoluteFill}>
                {/* Render vertical grid lines */}
                {verticalLines.map((x, index) => {
                    if (index == 0 || index == verticalLines.length - 1) return <></>
                    return <Line
                        key={`v-line-${index}`}
                        x1={x}
                        x2={x}
                        y1={0}
                        y2={adjustedHeight}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={dashArray}
                    />
                })}

                {/* Render horizontal grid lines */}
                {horizontalLines.map((y, index) => {
                    if (index == 0 || index == verticalLines.length - 1) return <></>
                    return <Line
                        key={`h-line-${index}`}
                        x1={0}
                        x2={adjustedWidth}
                        y1={y}
                        y2={y}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={dashArray}
                    />
                }
                )}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignSelf: 'center',
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
});

export default DynamicGrid;
