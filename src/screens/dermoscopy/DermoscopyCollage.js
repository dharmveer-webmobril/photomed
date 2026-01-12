import { View, Text, Dimensions, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import Gestures from "react-native-easy-gestures";
import ImageWithLoader from '../../components/ImageWithLoader';
import { useRoute } from '@react-navigation/native';
import COLORS from '../../styles/colors';
import ImageCropPicker from 'react-native-image-crop-picker';
import PlusIcon from '../../assets/SvgIcons/PlusIcon';

const { height } = Dimensions.get("window");
export default function CollageDermoscopy() {
  const route = useRoute();
  const [imageArr, setImageArr] = useState([])
  const [secondBoxImage, setSecondBoxImage] = useState(null);
  const [firstBoximage, setFirstBoximage] = useState(null);
  const images = route?.params?.images;

  console.log('images?.lengthimages?.length', images.length);

  useEffect(() => {
    setImageArr(images)
    if (images?.length > 0) {
      setFirstBoximage(images[images?.length-1])
    }
  }, [images])

  const openCamera = () => {
    ImageCropPicker.openCamera({
      cropping: false,
      mediaType: "photo",
      width: 1000,
      height: 1000,
      compressImageQuality: 0.8,
    })
      .then((img) => {
        setSecondBoxImage(img)
      })
      .catch((e) => console.log("Camera cancelled or error:", e));
  };

  return (
    <View style={styles.container}>
      <View style={styles.rowContainer}>
        <View style={styles.firstBox}>
          <Gestures
            scalable={{ min: 1, max: 5 }}
            style={styles.gestureContainer}
          >
            {firstBoximage && <ImageWithLoader
              uri={firstBoximage?.path}
              style={styles.image}
              resizeMode="contain"
            />}
          </Gestures>
        </View>
        <View style={styles.secondBox}>
          {secondBoxImage ? (
            <Gestures
              scalable={{ min: 1, max: 5 }}
              style={styles.gestureContainer}
            >
              <ImageWithLoader
                uri={secondBoxImage.path}
                style={styles.image}
                resizeMode="contain"
              />
            </Gestures>
          ) : (
            <TouchableOpacity onPress={() => { openCamera() }} style={styles.addImageButton}>
              <PlusIcon color={COLORS.primary} />
              <Text style={styles.addImageText}>Add Image</Text>
            </TouchableOpacity>
          )}
          {secondBoxImage && (
            <TouchableOpacity onPress={() => { openCamera() }} style={styles.changeImageButton}>
              <Text style={styles.changeImageText}>Change Image</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.thumbnailContainer}>
        {
          imageArr?.length > 1 &&
          <>
            <FlatList
              horizontal
              data={imageArr}
              contentContainerStyle={styles.flatListContent}
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity
                    style={[
                      styles.thumbnailItem,
                      secondBoxImage === item && styles.selectedThumbnail
                    ]}
                    onPress={() => {
                      setFirstBoximage(item);
                    }}
                  >
                    <ImageWithLoader
                      uri={item.path}
                      style={styles.thumbnailImage}
                    />
                  </TouchableOpacity>
                )
              }}
            />
          </>
        }
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 50,
  },
  firstBox: {
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '50%',
    height: height * 0.6,
    borderWidth: 1,
    overflow: "hidden",
  },
  secondBox: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '50%',
    height: height * 0.6,
    borderWidth: 1,
    overflow: "hidden",
  },
  gestureContainer: {
    height: "100%",
    width: "100%"
  },
  image: {
    width: "100%",
    height: "100%"
  },
  addImageButton: {
    width: '100%',
    height: "100%",
    justifyContent: "center",
    alignItems: 'center',
  },
  addImageText: {
    color: '#000',
    marginTop: 8,
  },
  changeImageButton: {
    bottom: 0,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    width: '100%',
    height: 44,
    justifyContent: "center",
    alignItems: 'center',
  },
  changeImageText: {
    color: '#fff',
  },
  thumbnailContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  flatListContent: {
    alignSelf: 'center',
  },
  thumbnailItem: {
    height: 60,
    width: 60,
    marginHorizontal: 5,
    borderRadius: 2,
  },
  selectedThumbnail: {
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  thumbnailImage: {
    height: '100%',
    width: '100%',
    borderRadius: 2,
  },
});