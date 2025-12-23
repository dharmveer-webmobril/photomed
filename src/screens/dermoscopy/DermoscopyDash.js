import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    FlatList,
    Modal,
    TextInput,
} from 'react-native';
import { goBack, navigate } from '../../navigators/NavigationService';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppTextInput from '../../components/AppTextInput';
import CustomBtn from '../../components/CustomBtn';
import COLORS from '../../styles/colors';
import FONTS from '../../styles/fonts';
import CrossIcon from '../../assets/SvgIcons/CrossIcon';
import { imagePath } from '../../configs/imagePath';
import { useAddBodyPartsMutation } from '../../redux/api/common';
import { useCurrentUserProfileQuery } from '../../redux/api/user';
import { useSelector } from 'react-redux';
import { bodyData } from '../../utils';
import Loading from '../../components/Loading';
export default function DermoscopyDash() {
    const [body, setBody] = useState('');
    const [bodyError, setBodyError] = useState('');
    const [isOpenModdal, setIsOpenmodal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [addedBodyPart, setAddedBodyPart] = useState([]);
    const token = useSelector((state) => state.auth?.user);
    const [bodyPart, setBodyPart] = useState([
        { title: "Head" },
        { title: "Forehead" },
        { title: "Eyes" },
        { title: "Eyelids" },
        { title: "Nose" },
        { title: "Cheeks" },
        { title: "Mouth" },
        { title: "Lips" },
        { title: "Neck" },
        { title: "Chest" },
        { title: "Abdomen" },
        { title: "Navel" },
        { title: "Pelvis" },

        { title: "Left Shoulder" },
        { title: "Right Shoulder" },
        { title: "Left Arm" },
        { title: "Right Arm" },
        { title: "Left Elbow" },
        { title: "Right Elbow" },
        { title: "Left Forearm" },
        { title: "Right Forearm" },
        { title: "Left Wrist" },
        { title: "Right Wrist" },
        { title: "Left Hand" },
        { title: "Right Hand" },
        { title: "Left Fingers" },
        { title: "Right Fingers" },

        { title: "Left Thigh" },
        { title: "Right Thigh" },
        { title: "Left Knee" },
        { title: "Right Knee" },
        { title: "Left Leg" },
        { title: "Right Leg" },
        { title: "Left Ankle" },
        { title: "Right Ankle" },
        { title: "Left Foot" },
        { title: "Right Foot" },
        { title: "Left Toes" },
        { title: "Right Toes" },

        { title: "Back" },
        { title: "Upper Back" },
        { title: "Middle Back" },
        { title: "Lower Back" },
        { title: "Left Back" },
        { title: "Right Back" },
        { title: "Back of Neck" },
        { title: "Back of Head" },
        { title: "Left Shoulder Back" },
        { title: "Right Shoulder Back" },
        { title: "Left Arm Back" },
        { title: "Right Arm Back" },
        { title: "Left Elbow Back" },
        { title: "Right Elbow Back" },
        { title: "Left Forearm Back" },
        { title: "Right Forearm Back" },
        { title: "Left Hand Back" },
        { title: "Right Hand Back" },
        { title: "Left Thigh Back" },
        { title: "Right Thigh Back" },
        { title: "Left Knee Back" },
        { title: "Right Knee Back" },
        { title: "Left Leg Back" },
        { title: "Right Leg Back" },
        { title: "Left Ankle Back" },
        { title: "Right Ankle Back" },
        { title: "Left Foot Back" },
        { title: "Right Foot Back" }
    ]);

    // -------- NEW: NORMAL SEARCH (NO DEBOUNCE) -------- //
    const filteredBodyParts = bodyPart.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const onPressPart = (part) => {
        navigate('MarkableImage', { body: part });
    };

    const [submit, { isLoading }] = useAddBodyPartsMutation();
    const { data: userDetail, isLoading: isLoadingUser, error, refetch, } = useCurrentUserProfileQuery({ token });
    useEffect(() => {
        refetch()
    }, [])

    useEffect(() => {
        let incoming = [...addedBodyPart];
        let bodies = [...bodyPart];
        if (incoming.length > 0) {

            const existingSet = new Set(bodies.map(item => item.title.toLowerCase()));

            incoming.forEach(item => {
                const lower = item.toLowerCase();
                if (!existingSet.has(lower)) {
                    bodies.unshift({ title: item });
                    existingSet.add(lower);
                }
            });

            setBodyPart(bodies)
        }
    }, [userDetail, addedBodyPart])

    useEffect(() => {
        if (userDetail?.succeeded && userDetail?.ResponseBody && userDetail?.ResponseBody?.customBodyParts && userDetail?.ResponseBody?.customBodyParts?.length > 0) {
            console.log('userDetailuserDetail', userDetail)
            // customBodyParts
            setAddedBodyPart(userDetail?.ResponseBody?.customBodyParts)
        }
    }, [userDetail,])

    const renderBodyBox = ({ item }) => (
        <TouchableOpacity
            onPress={() => onPressPart(item.title)}
            style={styles.bodyBox}
        >
            <Text style={styles.bodyTitle}>{item.title}</Text>
        </TouchableOpacity>
    );

    const clearInput = () => {
        setSearchTerm("");
    };

    const addBoadyPart = async () => {
        let alreadyHave = bodyPart.findIndex(el => el.title?.toLocaleLowerCase() == body?.toLocaleLowerCase())
        if (!body?.trim()) {
            setBodyError("Enter body part name")
            return
        }

        if (alreadyHave >= 0) {
            setBodyError("Alredy have this body part")
            return
        }

        let data = {
            bodyParts: [...addedBodyPart, body]
        }

        try {
            let res = await submit({ data, token }).unwrap();
            if (res?.succeeded) {
                refetch();
            }
        } catch (error) {
            console.log('error', error);
        } finally {
            setIsOpenmodal(false);
            setBody("")
        }
    }



    return (
        <SafeAreaView style={styles.container}>
            <Loading visible={isLoadingUser} />
            {/* Header */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={goBack} style={styles.headerBackBtn}>
                    <Image
                        style={styles.backIcon}
                        source={require('../../assets/images/icons/backIcon.png')}
                    />
                </TouchableOpacity>

                <Text style={styles.title}>Patient Details</Text>

                <TouchableOpacity style={styles.headerMenuBtn} onPress={() => { setIsOpenmodal(true); setBody("") }}>
                    <Text style={{ color: '#fff', fontSize: 20 }}>+</Text>
                </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.textInputContainerStyle}>
                <Image
                    resizeMode="contain"
                    source={imagePath.search}
                    style={{ marginHorizontal: 9.5 }}
                />
                <TextInput
                    style={styles.textinputStyle}
                    placeholder="Search..."
                    placeholderTextColor={COLORS.textColor}
                    value={searchTerm}
                    onChangeText={(txt) => { setSearchTerm(txt); }}
                    autoCapitalize="none"
                />
                {searchTerm.length > 0 && (
                    <TouchableOpacity
                        onPress={clearInput}
                        style={{ padding: 9.5 }}
                    >
                        <CrossIcon height={25} width={25} />
                    </TouchableOpacity>
                )}
            </View>

            {/* List */}
            <FlatList
                data={filteredBodyParts}   // ← SEARCH APPLIED
                renderItem={renderBodyBox}
                keyExtractor={(item, index) => index.toString()}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {/* Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isOpenModdal}
                onRequestClose={() => { setIsOpenmodal(false); setBodyError(""); setBody('') }}
                statusBarTranslucent
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>

                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => { setIsOpenmodal(false); setBodyError(""); setBody('') }}>
                            <Image
                                source={require('../../assets/images/close.png')}
                                style={styles.closeIcon}
                            />
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>Add Body Part</Text>

                        <AppTextInput
                            inputContainerStyle={{ marginBottom: 10 }}
                            value={body}
                            onChangeText={(txt) => { setBodyError(""); setBody(txt) }}
                            placeholder="Body Part"
                            placeHolderTxtColor={COLORS.placeHolderTxtColor}
                        />
                        <Text style={{ color: 'red', fontSize: 12 }}>{bodyError}</Text>
                        <CustomBtn
                            onPress={() => { addBoadyPart() }}
                            title="Add"

                            btnStyle={styles.modalBtn}
                            isLoadin={isLoading}
                        />
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    textInputContainerStyle: {
        width: '92%',
        alignSelf: 'center',
        borderColor: COLORS.borderColor,
        borderWidth: 1,
        borderRadius: 40,
        height: 43,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
        paddingHorizontal: 5,
    },
    textinputStyle: {
        color: COLORS.textColor,
        fontSize: 12,
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    headerBackBtn: { marginLeft: 10 },
    headerMenuBtn: {
        marginRight: 10,
        height: 30,
        width: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#32327C',
        borderRadius: 8,
    },
    backIcon: { height: 30, width: 30 },
    title: { fontSize: 16, color: '#424242', fontWeight: '600' },

    columnWrapper: { justifyContent: 'space-between' },
    listContent: { paddingHorizontal: 10, paddingBottom: 20 },
    bodyBox: {
        flex: 1,
        backgroundColor: '#F7F8FA',
        borderRadius: 10,
        padding: 12,
        marginVertical: 8,
        marginHorizontal: 4,
        elevation: 2,
    },
    bodyTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#32327C',
        textAlign: 'center',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: '#00000040',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBox: {
        width: '88%',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
    },
    modalCloseBtn: {
        backgroundColor: COLORS.primary,
        padding: 7,
        borderRadius: 100,
        position: 'absolute',
        right: -3,
        top: -3,
    },
    closeIcon: { height: 15, width: 15, tintColor: '#fff' },
    modalTitle: {
        textAlign: 'center',
        color: COLORS.primary,
        fontSize: 14,
        fontFamily: FONTS.medium,
        marginBottom: 20,
    },
    modalBtn: { marginTop: 30 },
});
