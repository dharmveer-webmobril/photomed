import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';

const { width } = Dimensions.get('window');

const SubscriptionExpiredModal = ({ visible, onViewPlans, }) => {
  const dispatch = useDispatch()

  const token = useSelector((state) => state.auth?.user);
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Your subscription has expired</Text>
          <Text style={styles.description}>
            To continue enjoying full access, please renew or choose a new plan.
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: "space-between", }}>
            <TouchableOpacity style={styles.buttonborder} onPress={() => dispatch(logout())}>
              <Text style={styles.buttonTextborder}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={onViewPlans}>
              <Text style={styles.buttonText}>VIEW PLANS</Text>
            </TouchableOpacity>

          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SubscriptionExpiredModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#32327C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginLeft: 20
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  buttonborder: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#32327C',
    marginRight: 20
  },
  buttonTextborder: {
    color: '#32327C',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});
