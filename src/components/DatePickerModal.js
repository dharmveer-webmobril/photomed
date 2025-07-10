import { View, Text, Modal, StyleSheet, Pressable, Image } from 'react-native'
import React from 'react'
import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker';
import COLORS from "../styles/colors";
import { height, width } from '../styles/responsiveLayoute';
export default function DatePickerModal({ modalVisible, closeModal, doneModal, selected, selcetDate }) {
    const defaultStyles = useDefaultStyles('light');
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => closeModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <DateTimePicker
                        mode="single"
                        calendar={'gregory'}
                        timePicker={false}
                        headerButtonColor={'red'}
                        styles={{
                            ...defaultStyles,
                            today: { borderColor: COLORS.primary, borderWidth: 1 },
                            selected: { backgroundColor: COLORS.primary, borderRadius: 7 }, 
                            selected_label: { color: 'white' },
                            
                        }}
                        date={selected}
                        maxDate={new Date()}
                        onChange={({ date }) => {
                            console.log('date', date)
                            selcetDate(date)
                        }}
                        // IconPrev={<Image  source={require('../assets/images/left_icon.png')} style={{height:30,width:30,       tintColor:"#32327C"}}/>}
                        // IconNext={<Image source={require('../assets/images/right_arrow.png')} style={{height:30,width:30,       tintColor:"#32327C"}}/>}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'center', }}>
                        <Pressable style={styles.closeButton} onPress={() => closeModal()}>
                            <Text style={styles.closeText}>Close</Text>
                        </Pressable>
                        <Pressable style={styles.doneButton} onPress={() => doneModal()}>
                            <Text style={styles.buttonText}>Done</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    )
}
const styles = StyleSheet.create({
    datePickerBox: {
        borderColor: COLORS.borderColor,
        borderWidth: 1,
        width: '100%',
        borderRadius: 5,
        height: 40.5,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 28,
    },
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        backgroundColor: '#f8f8f8',
    },
    label: {
        fontSize: 18,
        marginBottom: 6,
    },
    dateText: {
        fontSize: 20,
        marginBottom: 20,
        fontWeight: '500',
    },
    openButton: {
        backgroundColor: '#4a90e2',
        padding: 12,
        borderRadius: 10,
    },
    closeButton: {
        backgroundColor: '#fff',
        borderWidth:1,
        borderColor: COLORS.primary,
        padding: 10,
        borderRadius: 8,
        alignSelf: 'center',
        marginHorizontal: 7
    },
    doneButton: {
        backgroundColor: COLORS.primary,
        padding: 10,
        borderRadius: 8,
        alignSelf: 'center',
        marginHorizontal: 7
    },
    closeText: {
        color: COLORS.primary,
        textAlign: 'center',
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
    },
})