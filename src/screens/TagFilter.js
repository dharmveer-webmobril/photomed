import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Button,
  useWindowDimensions,
  Alert
} from "react-native";
import React, { useEffect, useState } from 'react'
import { useGetMixedCategoriesQuery, useGetAllImageUrlsForFilterMutation } from "../redux/api/common";

import WrapperContainer from "../components/WrapperContainer";
import { useSelector } from 'react-redux';
import Loading from "../components/Loading";
import COLORS from "../styles/colors";
import FONTS from "../styles/fonts";
import CrossIcon from "../assets/SvgIcons/CrossIcon";
import { goBack } from "../navigators/NavigationService";
import {
  checkAndRefreshGoogleAccessToken,
  getFolderId,
  listFolderImages,
  setFilePublic,
} from "../configs/api";
import ImageWithLoader from "../components/ImageWithLoader";
import { Dropdown } from 'react-native-element-dropdown';


const TagFilter = () => {
  const provider = useSelector((state) => state?.auth?.cloudType);
  const token = useSelector((state) => state.auth?.user);
  const patientId = useSelector((state) => state.auth.patientId.patientId);
  const accessToken = useSelector((state) => state?.auth?.accessToken);
  const patientName = useSelector(
    (state) => state.auth.patientName.patientName
  );
  const { data: mixedCatData, error: mixedCatError, isLoading: mixedCatLoading, refetch: catSubcatRefetch } = useGetMixedCategoriesQuery({ token });


  const [selectedCat, setSelectedCat] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubcat, setSelectedSubcat] = useState("");
  const [error, setError] = useState("");
  const [dropdownData, setDropDownData] = useState([]);
  const [subCatData, setSubCatData] = useState([]);
  const [imageData, setImageData] = useState([]);

  useEffect(() => {
    if (mixedCatData?.ResponseBody) {
      let imageCategories = mixedCatData?.ResponseBody?.imageCategories || [];
      let categoriesDr = mixedCatData?.ResponseBody?.categories || [];
      let imageSubCategories = mixedCatData?.ResponseBody?.commenCategories || [];
      let subcategoriesDr = mixedCatData?.ResponseBody?.subcategories || [];
      const commonCat = [...imageCategories, ...categoriesDr];
      const commonsubCat = [...imageSubCategories, ...subcategoriesDr];

      const formattedSubcatData = commonsubCat.map((item) => ({
        ...item,
        name: item.categoryname || item.subcategoryname, value: item.categoryname || item.subcategoryname, label: item.categoryname || item.subcategoryname,
      }));
      const formatedCatData = commonCat.map((item) => ({
        ...item,
        name: item.categoryname, value: item.categoryname, label: item.categoryname
      }));

      setSubCatData(formattedSubcatData);
      setDropDownData(formatedCatData);
    }
  }, [mixedCatData]);


  const fetchGoogleDriveImages = async () => {
    try {
      setIsLoading(true)
      let vailidToken = await checkAndRefreshGoogleAccessToken(accessToken);
      // Step 1: Locate the "PhotoMed" folder
      const photoMedFolderId = await getFolderId("PhotoMed", accessToken);
      // console.log('abscd folder', photoMedFolderId);

      if (!photoMedFolderId) {
        setIsLoading(false)
        setError('Data not found')
        return;
      }

      console.log('photoMedFolderId', photoMedFolderId);

      // Step 2: Locate the patient folder inside "PhotoMed"
      const patientFolderId = await getFolderId(
        patientName + patientId,
        accessToken,
        photoMedFolderId
      );

      console.log('adsda----', patientId, patientName, photoMedFolderId, accessToken, patientFolderId);

      if (!patientFolderId) {
        setIsLoading(false)
        setError('Data not found')
        console.error("Patient folder not found");
        return;
      }

      // Step 3: Locate the "All Images" folder inside the patient folder
      const selectedCatFolderId = await getFolderId(
        `${patientName}_${selectedCat}`,
        accessToken,
        patientFolderId
      );
      if (!selectedCatFolderId) {
        setIsLoading(false)
        setError('Data not found')
        console.error("Cat Folder not found");
        return;
      }


      // Step 3: Locate the "All Images" folder inside the patient folder
      const selectedSubCatFolderId = await getFolderId(
        `${selectedSubcat}`,
        accessToken,
        selectedCatFolderId
      );
      if (!selectedSubCatFolderId) {
        setIsLoading(false)
        setError('Data not found')
        console.error("Subcat Folder not found");
        return;
      }

      // Step 4: Fetch images from the "All Images" folder
      const uploadedImages = await listFolderImages(
        selectedSubCatFolderId,
        accessToken
      );

      const publicImages = await Promise.all(
        uploadedImages.map(async (image) => {
          const publicUrl = await setFilePublic(image.id, accessToken);
          return { ...image, publicUrl };
        })
      );
      console.log('publicImages---', publicImages);
      if (publicImages && publicImages?.length) {
        setImageData(publicImages)
      } else {
        setImageData([])
      }
      setIsLoading(false)
    } catch (error) {
      setImageData([])
      setIsLoading(false)
      setError('Data not found')
      console.error("Error fetching Google Drive images:", error);
    }
  };

  const [getDropBoxImages] = useGetAllImageUrlsForFilterMutation();
  const fetchDropBox = async () => {
    let path = `/PhotoMed/${patientName}${patientId}/${patientName}_${selectedCat}/${selectedSubcat}`
    console.log('pathpathpath', path);
    try {
      setIsLoading(true)
      let responce = await getDropBoxImages({
        userId: `${patientName}${patientId}` || "",
        accessToken,
        folderPath: path
      }).unwrap();
      if (responce && responce?.length > 0) { setImageData(responce) } else { setImageData([]); setError('Data not found') }
      console.log('responceresponce', responce);
      setIsLoading(false)
    } catch (error) {
      setImageData([])
      setIsLoading(false)
      setError('Data not found')
      console.log('errorerrorerrorerror', error);
    }
  }

  const { width } = useWindowDimensions();

  const btnSelectCat = (val) => {
    if (selectedCat == val) setSelectedCat("");
    else setSelectedCat(val)
  }
  const btnSelectSubCat = (val) => {
    if (selectedSubcat == val) setSelectedSubcat("");
    else setSelectedSubcat(val)
  }
  const renderItem = item => {
    return (
      <View style={styles.item}>
        <Text style={styles.textItem}>{item.label}</Text>
      </View>
    );
  };
  return (
    <WrapperContainer wrapperStyle={styles.wrapperStyle}>
      <Loading visible={isLoading} />
      <View style={styles.headerContainer}>
        <CrossIcon onPress={() => goBack()} />
        <Button onPress={() => { setError('Data not found'); provider === "google" ? fetchGoogleDriveImages() : fetchDropBox() }} title="Apply Filter" disabled={(selectedCat && selectedSubcat) ? false : true} color={COLORS.primary} />
      </View>

      <View style={styles.innerContainer}>
        <Text style={styles.lableStyle}>{"Select a tag"}</Text>

        {dropdownData?.length > 0 &&
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            inputSearchStyle={styles.inputSearchStyle}
            selectedTextStyle={{ fontSize: 16, }}
            iconStyle={styles.iconStyle}
            data={dropdownData}
            maxHeight={300}
            labelField="label"
            search={false}
            containerStyle={{ marginTop: 8, backgroundColor:"#fff" }}
            valueField="value"
            placeholder="Select item"
            searchPlaceholder="Search..."
            value={selectedCat}
            onChange={item => {
              setSelectedCat(item.value)
            }}
            renderItem={renderItem}
          />
        }

        <Text style={styles.subLabel}>{"Select a sub tag"}</Text>
        {subCatData?.length > 0 && (
         <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            inputSearchStyle={styles.inputSearchStyle}
            selectedTextStyle={{ fontSize: 16, }}
            iconStyle={styles.iconStyle}
            data={subCatData}
            maxHeight={300}
            labelField="label"
            search={false}
            containerStyle={{ marginTop: 8, backgroundColor:"#fff" }}
            valueField="value"
            placeholder="Select item"
            searchPlaceholder="Search..."
            value={selectedCat}
            onChange={item => {
              setSelectedSubcat(item.value)
            }}
            renderItem={renderItem}
          />
        )}
        <View style={{ height: 20 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {
            imageData?.length > 0 && imageData?.map((item, index) => {
              return <ImageWithLoader
                uri={
                  provider === "google"
                    ? item.webContentLink
                    : item.publicUrl
                }
                style={{
                  height: width * 0.29,
                  width: width * 0.29,
                  borderRadius: 10
                }}
              />
            })
          }
        </View>
      </View>

    </WrapperContainer>
  );
};

export default TagFilter;

const styles = StyleSheet.create({
  wrapperStyle: {
    paddingBottom: 25,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: "space-between",
    padding: 9,
    paddingHorizontal: 20,
    marginBottom: 25,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  innerContainer: {
    paddingHorizontal: 15,
  },
  tagContainer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  tagItem: {
    paddingHorizontal: 5,
    margin: 2.5,
  },
  selectedListItem: {
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unSelectedListItem: {
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    fontSize: 12,
    color: COLORS.whiteColor,
    fontFamily: FONTS.regular,
  },
  unSelectedText: {
    fontSize: 12,
    color: COLORS.textColor,
    fontFamily: FONTS.regular,
  },
  lableStyle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textColor,
    marginLeft: 2,
  },
  subLabel: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textColor,
    marginTop: 20,
    marginLeft: 2,
  },
  dropdown: {
    marginVertical: 10,
    height: 50,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  icon: {
    marginRight: 5,
  },
  item: {
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textItem: {
    flex: 1,
    fontSize: 16,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});