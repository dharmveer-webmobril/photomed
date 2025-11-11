import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';

const MenuData = ({ onSelect }) => {
    return (
        <View style={styles.container}>
            <Menu onSelect={onSelect}>
                <MenuTrigger customStyles={{justifyContent:'center',alignItems:"center"}}>
                    <Text style={[styles.menuText,{color:'#fff',fontSize:20}]}>+</Text>
                </MenuTrigger>

                <MenuOptions customStyles={menuStyles}>
                    <MenuOption value="Right hadƒ">
                        <View style={styles.menuItem}>
                            <Text style={styles.menuText}>Right had</Text>
                        </View>
                        <View style={{ color: '#DEDEDE', height: 2 }} />
                    </MenuOption>

                    <MenuOption value="Left hand">
                        <View style={styles.menuItem}>
                            <Text style={styles.menuText}>Left hand</Text>
                        </View>
                        <View style={{ color: '#DEDEDE', height: 2 }} />
                    </MenuOption>
                    <MenuOption value="Back">
                        <View style={styles.menuItem}>
                            <Text style={styles.menuText}>Back</Text>
                        </View>
                    </MenuOption>
                    <MenuOption value="Head">
                        <View style={styles.menuItem}>
                            <Text style={styles.menuText}>Head</Text>
                        </View>
                    </MenuOption>
                    <MenuOption value="Leg">
                        <View style={styles.menuItem}>
                            <Text style={styles.menuText}>Leg</Text>
                        </View>
                    </MenuOption>
                </MenuOptions>
            </Menu>
        </View>
    );
};

export default MenuData;

const styles = StyleSheet.create({
    container: {
        alignItems: 'flex-end',
        paddingRight: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 5,
    },
    menuText: {
        fontSize: 14, // previously SF(8)
        marginLeft: 8, // previously SF(8)
        color: '#000000',
        fontFamily: 'Chivo-Medium',
        zIndex: 999999999,
    },
    menuIcon: {
        height: 20, // previously SF(10)
        width: 20, // previously SF(10)
        zIndex: 999999999,
        tintColor: '#00788D', // theme color replaced with hardcoded
    },
});

const menuStyles = {
    optionsContainer: {
        borderRadius: 8, // previously SF(6)
        paddingVertical: 6,
        width: 160, // previously SW(120)
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 5,
        marginTop: 30,
    },
};
