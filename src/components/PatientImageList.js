import {
  View,
  Text,
  FlatList,
  Alert,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import React, { memo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import ImageWithLoader from "./ImageWithLoader";
import {
  moderateScale,
  verticalScale,
  width,
} from "../styles/responsiveLayoute";
import FONTS from "../styles/fonts";
import COLORS from "../styles/colors";
import Tick from "../assets/SvgIcons/Tick";
import moment from "moment"
const PatientImageList = memo(
  ({ data, selectedImages, toggleImageSelection, handleImagePress }) => {
    const [imageArr, setImageArr] = useState([]);
    const provider = useSelector((state) => state?.auth?.cloudType);

    useEffect(() => {
      if (data && data.length > 0) {
        let gData = groupByDate(data);
        setImageArr(gData);
      }
    }, [data]);

    const groupByDate = (data) => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      // Group items by date
      const groupedData = data.reduce((acc, item) => {
        const date =
          provider == "google"
            ? item.createdTime.split("T")[0]
            : item.server_modified.split("T")[0];
        const itemDate = new Date(date);

        // Format title
        let title = date; // Default to YYYY-MM-DD
        if (itemDate.toDateString() === today.toDateString()) {
          title = "Today";
        } else if (itemDate.toDateString() === yesterday.toDateString()) {
          title = "Yesterday";
        }

        // Find existing group
        const existingGroup = acc.find((group) => group.title === title);

        if (existingGroup) {
          existingGroup.data.push(item);
        } else {
          acc.push({ title, data: [item] });
        }

        return acc;
      }, []);

      // Sort groups in descending order (latest date first)
      groupedData.sort((a, b) => {
        if (a.title === "Today") return -1;
        if (b.title === "Today") return 1;
        if (a.title === "Yesterday") return -1;
        if (b.title === "Yesterday") return 1;
        return moment(b.title).valueOf() - moment(a.title).valueOf();
      });

      //   Sort items within each group in descending order
      groupedData.forEach((group) => {
        group.data.sort((a, b) => {
          if (provider === "google") {
            return moment(b.createdTime).valueOf() - moment(a.createdTime).valueOf(); // Descending
          } else {
            return moment(b.server_modified).valueOf() - moment(a.server_modified).valueOf(); // Descending
          }
        });
      });

      return groupedData;
    };

    const onPresTitle = (item) => {
      let isIdIncluded = checkAllIdsIncluded(item?.data, selectedImages)
      if (isIdIncluded) {
        item?.data && item?.data?.length > 0 && toggleImageSelection(item.data, 'removeall')
      } else {
        item?.data && item?.data?.length > 0 && toggleImageSelection(item.data, 'addall')
      }
    }

    // function checkAnyIdIncluded(data, validIds) {
    //   const dataIds = data.map(item => item.id);
    //   const anyIncluded = dataIds.some(id => validIds.includes(id));
    //   return anyIncluded;
    // }
    function checkAllIdsIncluded(data, validIds) {
      // Extract all ids from the data array
      const dataIds = data.map(item => provider == "google" ? item.id : item.path_display);
      // Check if all ids from data are in the validIds array
      const allIncluded = dataIds.every(id => validIds.includes(id));
      return allIncluded
    }

    const formatData = (data, numColumns) => {
      const fullRows = Math.floor(data.length / numColumns);
      let remaining = data.length - fullRows * numColumns;

      const newData = [...data];
      while (remaining !== 0 && remaining < numColumns) {
        newData.push({ empty: true });
        remaining++;
      }

      return newData;
    };

    const { width, height } = useWindowDimensions();
    return (
      <FlatList
        data={imageArr}
        keyExtractor={(item, index) => item + index}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: section }) => {

          let isAllIdsIncluded = checkAllIdsIncluded(section?.data, selectedImages)
          console.log('isAllIdsIncludedisAllIdsIncluded', isAllIdsIncluded)
          return (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: 'space-between', width: "100%", }}>
                <Text
                  style={{
                    color: "#000000",
                    fontWeight: "700",
                    marginVertical: 15,
                  }}
                >
                  {section.title}
                </Text>


                <TouchableOpacity
                  onPress={() => { onPresTitle(section) }}
                  style={[
                    styles.check,
                  ]}
                >
                  {isAllIdsIncluded && <Tick height={10} width={10} />}
                </TouchableOpacity>

              </View>
              <View style={{ width: "100%", flexDirection: "row", flexWrap: "wrap", justifyContent: 'space-between' }}>
                {
                  section?.data && formatData(section?.data, 3)?.map((item, index) => {
                    console.log('formatData formatData formatData', formatData(section?.data, 3))

                    const selected = !item?.empty && selectedImages.includes(
                      provider == "google" ? item.id : item.path_display
                    );
                    return item?.empty
                      ?
                      <View style={{
                        height: width * 0.29,
                        width: width * 0.29,
                      }}></View>
                      :
                      (
                        <TouchableOpacity
                          onPress={() => handleImagePress([item], index, section?.data)} // Adjusted to pass the item
                          onLongPress={() => toggleImageSelection([item])} // Pass item for selection
                          style={{
                            borderRadius: 22,
                            overflow: "hidden",
                            alignItems: "center",
                            marginVertical: width * 0.009,
                          }}
                        >
                          <ImageWithLoader
                            uri={
                              provider === "google"
                                ? item.webContentLink
                                : item.publicUrl
                            }
                            // resizeMode={Fas}
                            style={{
                              height: width * 0.29,
                              width: width * 0.29,
                            }}
                          />
                          {selected && (
                            <View
                              style={[
                                styles.check,
                                { position: "absolute", left: 10, top: 10 },
                              ]}
                            >
                              <Tick height={10} width={10} />
                            </View>
                          )}
                        </TouchableOpacity>

                      )
                  })
                }
              </View>
            </>
          );
        }}
      />
    );
  }
);
export default PatientImageList;

const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(15),
    width: "100%",
  },
  imgStyle: {
    height: 75,
    width: 75,
    borderRadius: 75,
    marginRight: 10,
  },
  title: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textColor,
  },
  info: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.textColor,
  },
  galStyle: {
    height: 25,
    width: 25,
    marginRight: moderateScale(10),
  },
  subContainer: {
    width: "100%",
    justifyContent: "space-between",
    padding: moderateScale(10),
    marginVertical: verticalScale(15),
  },
  subTitle: {
    color: COLORS.placeHolderTxtColor,
    marginTop: verticalScale(60),
    marginBottom: 10,
    fontSize: 12,
  },
  commonContainer: {
    backgroundColor: COLORS.primary,
    height: 40,
    width: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(5),
  },
  check: {
    height: 18,
    width: 18,
    borderRadius: 5,
    borderColor: COLORS.primary,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(10),
    backgroundColor: "white",
  },
  bottomButtonsContainer: {
    width: "auto",
    height: 30,
    width: width * 0.25,
    marginHorizontal: width * 0.01,
    marginTop: 9,
  },
  bottomBottonsWrapper: {
    alignItems: "center",
    alignSelf: "center",
    position: "absolute",
    bottom: 0,
    width: "100%",
    alignSelf: "center",
  },
});
