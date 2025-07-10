import React from 'react';
import { View, Image } from 'react-native';
import DynamicGrid from './DynamicGrid'; // Import DynamicGrid if it is a separate component
import { verticalScale } from '../styles/responsiveLayoute';

const SelectedGridOverlay = ({
    selectedGridItem,
    selectedCategory,
    height,
    width
}) => {
    if (!selectedGridItem) return null;

    const renderContent = () => {
        switch (selectedCategory) {
            case 1:
                return (
                    (selectedGridItem.id === 1 || selectedGridItem.id === 2) && (
                        <DynamicGrid
                            containerHeight={height}
                            containerWidth={width}
                            rows={selectedGridItem.id === 1 ? 3 : 4}
                            columns={selectedGridItem.id === 1 ? 3 : 4}
                            dashArray={selectedGridItem.id === 1 ? `4 4` : `5 5`}
                        />
                    )
                );
            case 3:
                return (
                    <Image
                        style={{
                            height: height - 30,
                            width: selectedGridItem.align === 'center' ? '100%' : '50%',
                        }}
                        source={selectedGridItem.image}
                        resizeMode="contain"
                    />
                );
            case 5:
                return (
                    <Image
                        style={{
                            height: height + verticalScale(80),
                            width: selectedGridItem.align === 'center' ? '130%' : '50%',
                        }}
                        source={selectedGridItem.image}
                        resizeMode="contain"
                    />
                );
            default:
                return (
                    <Image
                        style={{
                            height: height - 30,
                            tintColor: '#ffffff',
                            width: width,
                        }}
                        source={selectedGridItem.image}
                        resizeMode="contain"
                    />
                );
        }
    };

    return (
        <View
            pointerEvents='none'
            style={{
                position: 'absolute',
                top: selectedCategory === 5 ? -verticalScale(80) : 10,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: selectedGridItem.align || 'center',

            }}
        >
            {renderContent()}
        </View>
    );
};

export default SelectedGridOverlay;
