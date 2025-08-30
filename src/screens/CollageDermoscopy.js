import { View, Text, Dimensions, FlatList, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import Gestures from "react-native-easy-gestures";
import ImageWithLoader from '../components/ImageWithLoader';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import COLORS from '../styles/colors';
import FONTS from '../styles/fonts';

const { width, height } = Dimensions.get("window");
export default function CollageDermoscopy() {
  const route = useRoute();
  const provider = useSelector((state) => state.auth.cloudType);
  const [imageArr, setImageArr] = useState([])
  const [secondBoxImage, setSecondBoxImage] = useState(null)
  const image = route?.params?.image;
  const images = route?.params?.images;
  console.log('images?.lengthimages?.length', images);
  useEffect(() => {
    if (images?.length > 0) {
      console.log('images?.lengthimages?.length', images);
      setImageArr(images)
      let img = provider === "google" ? images[0] : images[0]
      setSecondBoxImage(img)
    }
  }, [images])
  console.log('imageimageimage--', image);

  return (
    <View style={{ flex: 1, }}>
      <View style={{ flexDirection: "row", justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 50 }}>
        <View style={{ justifyContent: 'space-between', alignItems: 'center', width: '50%', height: height * 0.6, borderWidth: 1, overflow: "hidden", }}>
          <Gestures
            scalable={{ min: 1, max: 5 }}
            style={{ height: "100%", width: "100%" }}
          >
            <ImageWithLoader
              uri={
                provider === "google" ? image.webContentLink : image.publicUrl
              }
              style={[
                { width: "100%", height: "100%" }, // Default styles
                // Add border if 'Border' is selected
              ]}
              resizeMode="contain"
            />
          </Gestures>
        </View>
        <View style={{ justifyContent: 'space-between', alignItems: 'center', width: '50%', height: height * 0.6, borderWidth: 1, overflow: "hidden", }}>
          <Gestures
            scalable={{ min: 1, max: 5 }}
            style={{ height: "100%", width: "100%" }}
          >
            <ImageWithLoader
              uri={provider === "google" ? secondBoxImage?.webContentLink : secondBoxImage?.publicUrl}
              style={[
                { width: "100%", height: "100%" }, // Default styles
                // Add border if 'Border' is selected
              ]}
              resizeMode="contain"
            />

          </Gestures>
        </View>
      </View>
      <View style={{ width: "100%", justifyContent: "center", alignItems: "center",marginTop:20 }}>
        {
          imageArr?.length > 0 ?
            <>
              <FlatList
                horizontal
                data={imageArr}
                contentContainerStyle={{ alignSelf: 'center' }}
                renderItem={({ item }) => {
                  return <TouchableOpacity

                    style={[
                      {
                        height: 60,
                        width: 60,
                        marginHorizontal: 5,
                        borderRadius: 2,
                      },
                      secondBoxImage === item && { borderWidth: 3, borderColor: COLORS.primary, }
                    ]}
                    onPress={() => {
                      setSecondBoxImage(item);
                    }}
                  >
                    <ImageWithLoader
                      uri={
                        provider === "google"
                          ? item.webContentLink
                          : item.publicUrl
                      }
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
            :
            <Text
              style={{
                marginVertical: 20,
                fontFamily: FONTS.bold,
                fontSize: 14,
                color: COLORS.primary,
                textAlign: "center"
              }}
            >
              No Photo Available.
            </Text>
        }
      </View>
    </View>
  )
}