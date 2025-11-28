import { View, Text, Dimensions, FlatList, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import Gestures from "react-native-easy-gestures";
import ImageWithLoader from '../components/ImageWithLoader';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import COLORS from '../styles/colors';
import FONTS from '../styles/fonts';
import ImageCropPicker from 'react-native-image-crop-picker';

const { width, height } = Dimensions.get("window");
export default function CollageDermoscopy() {
  const route = useRoute();
  const provider = useSelector((state) => state.auth.cloudType);
  const [imageArr, setImageArr] = useState([])
  const [secondBoxImage, setSecondBoxImage] = useState(null);
  const [firstBoximage, setFirstBoximage] = useState(null);
  const images = route?.params?.images;

  console.log('images?.lengthimages?.length', images.length);

  useEffect(() => {
    setImageArr(images)
    if (images?.length > 0) {
      setFirstBoximage(images[0])
    }
  }, [images])

  console.log('imageimageimage--', images);
  console.log('imageArrimageArrimageArr--', imageArr);

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
    <View style={{ flex: 1, }}>
      <View style={{ flexDirection: "row", justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 50 }}>
        <View style={{ justifyContent: 'space-between', alignItems: 'center', width: '50%', height: height * 0.6, borderWidth: 1, overflow: "hidden", }}>
          <Gestures
            scalable={{ min: 1, max: 5 }}
            style={{ height: "100%", width: "100%" }}
          >
            {firstBoximage && <ImageWithLoader
              uri={firstBoximage?.path}
              style={[{ width: "100%", height: "100%" }]}
              resizeMode="contain"
            />}
          </Gestures>
        </View>
        <View style={{ justifyContent: 'center', alignItems: 'center', width: '50%', height: height * 0.6, borderWidth: 1, overflow: "hidden", }}>

          {secondBoxImage ? <Gestures
            scalable={{ min: 1, max: 5 }}
            style={{ height: "100%", width: "100%" }}
          >
            <ImageWithLoader
              uri={secondBoxImage.path}
              style={[
                { width: "100%", height: "100%" },
              ]}
              resizeMode="contain"
            />

          </Gestures>
            :
            <TouchableOpacity onPress={() => { openCamera() }} style={{ width: '100%', height: "100%", justifyContent: "center", alignItems: 'center' }}>
              <Text style={{ color: '#000' }}>Add Image</Text>
            </TouchableOpacity>
          }
          {secondBoxImage && <TouchableOpacity onPress={() => { openCamera() }} style={{ bottom: 0, backgroundColor: COLORS.primary, position: 'absolute', width: '100%', height: 44, justifyContent: "center", alignItems: 'center' }}>
            <Text style={{ color: '#fff' }}>Change Image</Text>
          </TouchableOpacity>}
        </View>
      </View>
      <View style={{ width: "100%", justifyContent: "center", alignItems: "center", marginTop: 20 }}>
        {
          imageArr?.length > 1 &&
          <>
            <FlatList
              horizontal
              data={imageArr}
              contentContainerStyle={{ alignSelf: 'center' }}
              renderItem={({ item }) => {
                return <TouchableOpacity
                  style={[{
                    height: 60,
                    width: 60,
                    marginHorizontal: 5,
                    borderRadius: 2,
                  },
                  secondBoxImage === item && { borderWidth: 3, borderColor: COLORS.primary, }
                  ]}
                  onPress={() => {
                    setFirstBoximage(item);
                  }}
                >
                  <ImageWithLoader
                    uri={item.path}
                    style={[
                      {
                        height: '100%',
                        width: '100%',
                        borderRadius: 2,
                      },

                    ]}
                  />
                </TouchableOpacity>
              }}
            />
          </>
        }
      </View>
    </View>
  )
}