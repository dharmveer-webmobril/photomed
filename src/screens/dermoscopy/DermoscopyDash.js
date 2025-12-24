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
import Loading from '../../components/Loading';
export default function DermoscopyDash() {
    const [body, setBody] = useState('');
    const [bodyError, setBodyError] = useState('');
    const [isOpenModdal, setIsOpenmodal] = useState(false);
    const [isViewSelectModal, setIsViewSelectModal] = useState(false);
    const [selectedView, setSelectedView] = useState(null); // 'front' or 'back'
    const [searchTerm, setSearchTerm] = useState("");
    const token = useSelector((state) => state.auth?.user);

    // Standard body parts - Front view
    const [frontBodyParts, setFrontBodyParts] = useState([
        { title: "Head" },
        { title: "Neck" },
        { title: "Arm R" },
        { title: "Arm L" },
        { title: "Hand R" },
        { title: "Hand L" },
        { title: "Thorax" },
        { title: "Abdomen" },
        { title: "Leg R" },
        { title: "Leg L" },
        { title: "Foot R" },
        { title: "Foot L" },
    ]);

    // Standard body parts - Back view
    const [backBodyParts, setBackBodyParts] = useState([
        { title: "Head" },
        { title: "Neck" },
        { title: "Arm R" },
        { title: "Arm L" },
        { title: "Hand R" },
        { title: "Hand L" },
        { title: "Thorax" },
        { title: "Abdomen" },
        { title: "Leg R" },
        { title: "Leg L" },
        { title: "Foot R" },
        { title: "Foot L" },
    ]);

    // Filter based on search
    const filteredFrontParts = frontBodyParts.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredBackParts = backBodyParts.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const onPressPart = (part, view) => {
        navigate('MarkableImage', { body: part, view: view }); // 'front' or 'back'
    };

    const [submit, { isLoading }] = useAddBodyPartsMutation();
    const { data: userDetail, isLoading: isLoadingUser, refetch } = useCurrentUserProfileQuery({ token });

    useEffect(() => {
        refetch();
    }, [refetch]);

    useEffect(() => {
        if (userDetail?.succeeded && userDetail?.ResponseBody?.customBodyParts) {
            const customParts = userDetail.ResponseBody.customBodyParts;
            console.log('customBodyParts', customParts);

            // Handle the new structure: { front: [...], back: [...] }
            if (customParts && typeof customParts === 'object' && !Array.isArray(customParts)) {
                // Update front body parts - merge custom parts with standard parts
                if (customParts.front && Array.isArray(customParts.front)) {
                    const frontCustomParts = customParts.front.map(item => ({ title: item }));
                    setFrontBodyParts(prev => {
                        const existingTitles = new Set(prev.map(p => p.title.toLowerCase()));
                        const newParts = frontCustomParts.filter(p => !existingTitles.has(p.title.toLowerCase()));
                        return [...prev, ...newParts];
                    });
                }

                // Update back body parts - merge custom parts with standard parts
                if (customParts.back && Array.isArray(customParts.back)) {
                    const backCustomParts = customParts.back.map(item => ({ title: item }));
                    setBackBodyParts(prev => {
                        const existingTitles = new Set(prev.map(p => p.title.toLowerCase()));
                        const newParts = backCustomParts.filter(p => !existingTitles.has(p.title.toLowerCase()));
                        return [...prev, ...newParts];
                    });
                }
            }
        }
    }, [userDetail]);

    const renderFrontBackRow = ({ item, index }) => {
        const frontItem = filteredFrontParts[index] || null;
        const backItem = filteredBackParts[index] || null;

        return (
            <View style={styles.rowContainer}>
                <View style={styles.columnContainer}>
                    {frontItem ? (
                        <TouchableOpacity
                            onPress={() => onPressPart(frontItem.title, 'front')}
                            style={styles.bodyBox}
                        >
                            <Text style={styles.bodyTitle}>{frontItem.title}</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.bodyBox, styles.emptyBox]} />
                    )}
                </View>
                <View style={styles.columnContainer}>
                    {backItem ? (
                        <TouchableOpacity
                            onPress={() => onPressPart(backItem.title, 'back')}
                            style={styles.bodyBox}
                        >
                            <Text style={styles.bodyTitle}>{backItem.title}</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.bodyBox, styles.emptyBox]} />
                    )}
                </View>
            </View>
        );
    };

    const clearInput = () => {
        setSearchTerm("");
    };

    const handleAddButtonPress = () => {
        setIsViewSelectModal(true);
        setBody("");
        setBodyError("");
    };

    const handleViewSelect = (view) => {
        setSelectedView(view);
        setIsViewSelectModal(false);
        setIsOpenmodal(true);
    };

    const addBoadyPart = async () => {
        if (!selectedView) {
            setBodyError("Please select Front or Back view first");
            return;
        }

        const targetList = selectedView === 'front' ? frontBodyParts : backBodyParts;
        let alreadyHave = targetList.findIndex(el => el.title?.toLocaleLowerCase() === body?.toLocaleLowerCase());

        if (!body?.trim()) {
            setBodyError("Enter body part name");
            return;
        }

        if (alreadyHave >= 0) {
            setBodyError("Already have this body part");
            return;
        }

        // Add to local state
        if (selectedView === 'front') {
            setFrontBodyParts(prev => [{ title: body }, ...prev]);
        } else {
            setBackBodyParts(prev => [{ title: body }, ...prev]);
        }

        // Prepare data in the new format: { front: [...], back: [...] }
        // Get all body parts from display lists (including standard ones)
        const allFrontParts = frontBodyParts.map(p => p.title);
        const allBackParts = backBodyParts.map(p => p.title);

        // Define standard parts that should not be sent to API
        const standardParts = ['Head', 'Neck', 'Arm R', 'Arm L', 'Hand R', 'Hand L', 'Thorax', 'Abdomen', 'Leg R', 'Leg L', 'Foot R', 'Foot L'];

        // Filter out standard parts - only send custom parts to API
        const frontParts = allFrontParts.filter(part =>
            !standardParts.some(std => std.toLowerCase() === part.toLowerCase())
        );
        const backParts = allBackParts.filter(part =>
            !standardParts.some(std => std.toLowerCase() === part.toLowerCase())
        );

        // Save to API in the new format
        let data = {
            bodyParts: {
                front: frontParts,
                back: backParts
            }
        };
        console.log('data------', data);
        try {
            let res = await submit({ data, token }).unwrap();
            console.log('res------', res);
            if (res?.succeeded) {
                refetch();
            }
        } catch (err) {
            console.log('error', err);
        } finally {
            setIsOpenmodal(false);
            setBody("");
            setSelectedView(null);
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

                <TouchableOpacity style={styles.headerMenuBtn} onPress={handleAddButtonPress}>
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.textInputContainerStyle}>
                <Image
                    resizeMode="contain"
                    source={imagePath.search}
                    style={styles.searchIcon}
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
                        style={styles.clearButton}
                    >
                        <CrossIcon height={25} width={25} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Two Column Header */}
            <View style={styles.headerRow}>
                <View style={styles.columnHeader}>
                    <Text style={styles.columnHeaderText}>Front View</Text>
                </View>
                <View style={styles.columnHeader}>
                    <Text style={styles.columnHeaderText}>Back View</Text>
                </View>
            </View>

            {/* Two Column List */}
            <FlatList
                data={Array.from({ length: Math.max(filteredFrontParts.length, filteredBackParts.length) }, (_, i) => i)}
                renderItem={renderFrontBackRow}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {/* View Selection Modal (Front/Back) */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isViewSelectModal}
                onRequestClose={() => { setIsViewSelectModal(false); }}
                statusBarTranslucent
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => { setIsViewSelectModal(false); }}>
                            <Image
                                source={require('../../assets/images/close.png')}
                                style={styles.closeIcon}
                            />
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>Select View</Text>

                        <TouchableOpacity
                            style={[styles.viewOption, styles.viewOptionFront]}
                            onPress={() => handleViewSelect('front')}
                        >
                            <Text style={styles.viewOptionText}>Front View</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.viewOption, styles.viewOptionBack]}
                            onPress={() => handleViewSelect('back')}
                        >
                            <Text style={styles.viewOptionText}>Back View</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add Body Part Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isOpenModdal}
                onRequestClose={() => { setIsOpenmodal(false); setBodyError(""); setBody(''); setSelectedView(null); }}
                statusBarTranslucent
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <TouchableOpacity style={styles.modalCloseBtn} onPress={() => { setIsOpenmodal(false); setBodyError(""); setBody(''); setSelectedView(null); }}>
                            <Image
                                source={require('../../assets/images/close.png')}
                                style={styles.closeIcon}
                            />
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>
                            Add Body Part ({selectedView === 'front' ? 'Front' : 'Back'} View)
                        </Text>

                        <AppTextInput
                            inputContainerStyle={styles.inputContainer}
                            value={body}
                            onChangeText={(txt) => { setBodyError(""); setBody(txt) }}
                            placeholder="Body Part"
                            placeHolderTxtColor={COLORS.placeHolderTxtColor}
                        />
                        <Text style={styles.errorText}>{bodyError}</Text>
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
    addButtonText: {
        color: '#fff',
        fontSize: 20,
    },
    backIcon: { height: 30, width: 30 },
    title: { fontSize: 16, color: '#424242', fontWeight: '600' },
    searchIcon: {
        marginHorizontal: 9.5,
    },
    clearButton: {
        padding: 9.5,
    },
    inputContainer: {
        marginBottom: 10,
    },
    errorText: {
        color: 'red',
        fontSize: 12,
    },

    columnWrapper: { justifyContent: 'space-between' },
    listContent: { paddingHorizontal: 10, paddingBottom: 20 },
    headerRow: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    columnHeader: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
    },
    columnHeaderText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#32327C',
    },
    rowContainer: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    columnContainer: {
        flex: 1,
        marginHorizontal: 4,
    },
    bodyBox: {
        backgroundColor: '#F7F8FA',
        borderRadius: 10,
        padding: 12,
        elevation: 2,
        minHeight: 50,
        justifyContent: 'center',
    },
    emptyBox: {
        backgroundColor: 'transparent',
        elevation: 0,
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
    viewOption: {
        padding: 15,
        borderRadius: 10,
        marginVertical: 8,
        alignItems: 'center',
    },
    viewOptionFront: {
        backgroundColor: '#E3F2FD',
        borderWidth: 2,
        borderColor: '#2196F3',
    },
    viewOptionBack: {
        backgroundColor: '#FFF3E0',
        borderWidth: 2,
        borderColor: '#FF9800',
    },
    viewOptionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#32327C',
    },
});
