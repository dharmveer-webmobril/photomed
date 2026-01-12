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
import { SafeAreaView } from 'react-native-safe-area-context';
import { goBack, navigate } from '../../navigators/NavigationService';
import { useSelector } from 'react-redux';
import AppTextInput from '../../components/AppTextInput';
import CustomBtn from '../../components/CustomBtn';
import Loading from '../../components/Loading';
import COLORS from '../../styles/colors';
import CrossIcon from '../../assets/SvgIcons/CrossIcon';
import { imagePath } from '../../configs/imagePath';
import { useAddBodyPartsMutation } from '../../redux/api/common';
import { useCurrentUserProfileQuery } from '../../redux/api/user';

export default function DermoscopyDash() {
    const token = useSelector(state => state.auth?.user);

    const [body, setBody] = useState('');
    const [bodyError, setBodyError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedView, setSelectedView] = useState(null);

    const [isOpenModal, setIsOpenModal] = useState(false);
    const [isViewSelectModal, setIsViewSelectModal] = useState(false);

    const [frontBodyParts, setFrontBodyParts] = useState([
        { title: 'Head' }, { title: 'Neck' }, { title: 'Arm R' }, { title: 'Arm L' },
        { title: 'Hand R' }, { title: 'Hand L' }, { title: 'Thorax' },
        { title: 'Abdomen' }, { title: 'Leg R' }, { title: 'Leg L' },
        { title: 'Foot R' }, { title: 'Foot L' },
    ]);

    const [backBodyParts, setBackBodyParts] = useState([
        { title: 'Head' }, { title: 'Neck' }, { title: 'Arm R' }, { title: 'Arm L' },
        { title: 'Hand R' }, { title: 'Hand L' }, { title: 'Thorax' },
        { title: 'Abdomen' }, { title: 'Leg R' }, { title: 'Leg L' },
        { title: 'Foot R' }, { title: 'Foot L' },
    ]);

    const [submit, { isLoading }] = useAddBodyPartsMutation();
    const { data: userDetail, isFetching: isLoadingUser, refetch } =
        useCurrentUserProfileQuery({ token });

    useEffect(() => { refetch(); }, [refetch]);

    useEffect(() => {
        if (userDetail?.ResponseBody?.customBodyParts) {
            const { front = [], back = [] } = userDetail.ResponseBody.customBodyParts;

            setFrontBodyParts(prev => [
                ...front.map(t => ({ title: t }))
                    .filter(n => !prev.some(p => p.title.toLowerCase() === n.title.toLowerCase())),
                ...prev,
            ]);

            setBackBodyParts(prev => [
                ...back.map(t => ({ title: t }))
                    .filter(n => !prev.some(p => p.title.toLowerCase() === n.title.toLowerCase())),
                ...prev,
            ]);
        }
    }, [userDetail]);

    const filteredFront = frontBodyParts.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredBack = backBodyParts.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const onPressPart = (part, view) => {
        navigate('MarkableImage', { body: part, view });
    };

    // ✅ FIXED LOGIC
    const addBoadyPart = async () => {
        if (!selectedView) {
            setBodyError('Select Front or Back view');
            return;
        }

        if (!body.trim()) {
            setBodyError('Enter body part name');
            return;
        }

        const standardParts = [
            'Head', 'Neck', 'Arm R', 'Arm L', 'Hand R', 'Hand L',
            'Thorax', 'Abdomen', 'Leg R', 'Leg L', 'Foot R', 'Foot L'
        ];

        const newItem = { title: body.trim() };

        let updatedFront = [...frontBodyParts];
        let updatedBack = [...backBodyParts];

        if (selectedView === 'front') {
            if (updatedFront.some(p => p.title.toLowerCase() === newItem.title.toLowerCase())) {
                setBodyError('Already exists');
                return;
            }
            updatedFront.unshift(newItem);
            setFrontBodyParts(updatedFront);
        } else {
            if (updatedBack.some(p => p.title.toLowerCase() === newItem.title.toLowerCase())) {
                setBodyError('Already exists');
                return;
            }
            updatedBack.unshift(newItem);
            setBackBodyParts(updatedBack);
        }

        const data = {
            bodyParts: {
                front: updatedFront
                    .map(p => p.title)
                    .filter(p => !standardParts.some(s => s.toLowerCase() === p.toLowerCase())),
                back: updatedBack
                    .map(p => p.title)
                    .filter(p => !standardParts.some(s => s.toLowerCase() === p.toLowerCase())),
            }
        };

        try {
            const res = await submit({ data, token }).unwrap();
            if (res?.succeeded) refetch();
        } catch (e) {
            console.log(e);
        } finally {
            setIsOpenModal(false);
            setBody('');
            setSelectedView(null);
            setBodyError('');
        }
    };

    const renderRow = ({ index }) => (
        <View style={styles.rowContainer}>
            {[filteredFront[index], filteredBack[index]].map((item, i) => (
                <View key={i} style={styles.columnContainer}>
                    {item ? (
                        <TouchableOpacity
                            style={styles.bodyBox}
                            onPress={() => onPressPart(item.title, i === 0 ? 'front' : 'back')}
                        >
                            <Text style={styles.bodyTitle}>{item.title}</Text>
                        </TouchableOpacity>
                    ) : <View style={styles.emptyBox} />}
                </View>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Loading visible={isLoadingUser} />

            {/* Header */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={goBack}>
                    <Image style={styles.backIcon} source={require('../../assets/images/icons/backIcon.png')} />
                </TouchableOpacity>
                <Text style={styles.title}>Patient Details</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setIsViewSelectModal(true)}>
                    <Text style={{ color: '#fff', fontSize: 20, textAlign: "center" }}>+</Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchBox}>
                <Image source={imagePath.search} />
                <TextInput
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    placeholder="Search..."
                    style={{ flex: 1 }}
                />
                {searchTerm.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchTerm('')}>
                        <CrossIcon height={20} width={20} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Headers */}
            <View style={styles.headerRow}>
                <Text style={styles.columnHeader}>Front View</Text>
                <Text style={styles.columnHeader}>Back View</Text>
            </View>

            <FlatList
                data={Array.from({ length: Math.max(filteredFront.length, filteredBack.length) })}
                renderItem={renderRow}
                keyExtractor={(_, i) => i.toString()}
            />

            {/* View Select Modal */}
            <Modal transparent visible={isViewSelectModal}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>

                        {/* Close Icon */}
                        <TouchableOpacity
                            style={styles.closeIcon}
                            onPress={() => setIsViewSelectModal(false)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.closeText}>✕</Text>
                            {/* Or use an icon library */}
                            {/* <Ionicons name="close" size={22} color="#000" /> */}
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>Select View</Text>

                        <CustomBtn
                            title="Front View"
                            onPress={() => {
                                setSelectedView('front');
                                setIsViewSelectModal(false);
                                setIsOpenModal(true);
                            }}
                        />

                        <CustomBtn
                            btnStyle={{ marginTop: 10 }}
                            title="Back View"
                            onPress={() => {
                                setSelectedView('back');
                                setIsViewSelectModal(false);
                                setIsOpenModal(true);
                            }}
                        />
                    </View>
                </View>
            </Modal>

            {/* <Modal transparent visible={isViewSelectModal}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Select View</Text>
                        <CustomBtn title="Front View" onPress={() => { setSelectedView('front'); setIsViewSelectModal(false); setIsOpenModal(true); }} />
                        <CustomBtn title="Back View" onPress={() => { setSelectedView('back'); setIsViewSelectModal(false); setIsOpenModal(true); }} />
                    </View>
                </View>
            </Modal> */}

            {/* Add Modal */}
            <Modal transparent visible={isOpenModal}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>

                        {/* Close Icon */}
                        <TouchableOpacity
                            style={styles.closeIcon1}
                            onPress={() => setIsOpenModal(false)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.closeText1}>✕</Text>
                        </TouchableOpacity>

                        <AppTextInput
                            value={body}
                            onChangeText={t => {
                                setBody(t);
                                setBodyError('');
                            }}
                            placeholder="Body Part"
                        />

                        {bodyError ? (
                            <Text style={{ color: 'red', marginTop: 4 }}>{bodyError}</Text>
                        ) : null}

                        <CustomBtn
                            title="Add"
                            onPress={addBoadyPart}
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
    headerContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 10 },
    backIcon: { height: 30, width: 30 },
    addBtn: { backgroundColor: '#32327C', borderRadius: 8, width: 30, height: 30, alignItems: "center" },
    title: { fontSize: 16, fontWeight: '600' },
    searchBox: { flexDirection: 'row', alignItems: 'center', margin: 10, borderWidth: 1, borderRadius: 20, paddingHorizontal: 8 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
    columnHeader: { fontWeight: '700', color: '#32327C' },
    rowContainer: { flexDirection: 'row', marginBottom: 8 },
    columnContainer: { flex: 1, marginHorizontal: 4 },
    bodyBox: { padding: 12, backgroundColor: '#F7F8FA', borderRadius: 10 },
    bodyTitle: { textAlign: 'center', fontWeight: '600' },
    emptyBox: { height: 50 },
    modalOverlay: { flex: 1, backgroundColor: '#00000040', justifyContent: 'center', alignItems: 'center' },
    modalBox: { width: '85%', backgroundColor: '#fff', padding: 20, borderRadius: 10 },
    modalTitle: { textAlign: 'center', marginBottom: 20, fontWeight: '600' },
    closeIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        padding: 5,
    },

    closeText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },

    closeIcon1: {
        position: 'absolute',
        top: -10,
        right: -10,
        zIndex: 10,
        backgroundColor:COLORS.primary,
        width:25,
        height:25,
        borderRadius:6,
        justifyContent:"center",
        alignItems:"center"
    },

    closeText1: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },

});
