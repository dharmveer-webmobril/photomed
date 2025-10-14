import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Platform,
} from 'react-native';
import VersionCheck from 'react-native-version-check';

const UpdateChecker = () => {
  const [showModal, setShowModal] = useState(false);
  const [storeUrl, setStoreUrl] = useState('');
  const [isForce, setIsForce] = useState(false); // true for Android, false for iOS

  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const latestVersion = await VersionCheck.getLatestVersion({
          provider: Platform.OS === 'ios' ? 'appStore' : 'playStore',
        });
        const currentVersion = VersionCheck.getCurrentVersion();

        const needUpdate = await VersionCheck.needUpdate({
          currentVersion,
          latestVersion,
        });

        if (needUpdate?.isNeeded) {
          const url = await VersionCheck.getStoreUrl();
          setStoreUrl(url);

          // Force update for Android, optional for iOS
          if (Platform.OS === 'android') {
            setIsForce(true);
            setShowModal(true);
          } else {
            setIsForce(false);
            setShowModal(true);
          }
        }
      } catch (error) {
        console.log('Error checking for updates:', error);
      }
    };

    checkForUpdate();
  }, []);

  const handleUpdate = () => {
    if (storeUrl) Linking.openURL(storeUrl);
  };

  const handleLater = () => {
    if (!isForce) setShowModal(false); // Only allow close for iOS
  };

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Update Available</Text>
          <Text style={styles.message}>
            A new version of the app is available. Please update to get the latest features and fixes.
          </Text>

          <View style={styles.buttonRow}>
            {!isForce && (
              <TouchableOpacity
                onPress={handleLater}
                style={[styles.button, styles.laterButton]}
              >
                <Text style={styles.laterText}>Later</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleUpdate}
              style={[styles.button, styles.updateButton]}
            >
              <Text style={styles.updateText}>Update Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default UpdateChecker;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    color: '#444',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  laterButton: {
    backgroundColor: '#e0e0e0',
  },
  updateButton: {
    backgroundColor: '#32327C',
  },
  laterText: {
    color: '#333',
    fontWeight: '500',
  },
  updateText: {
    color: '#fff',
    fontWeight: '600',
  },
});
