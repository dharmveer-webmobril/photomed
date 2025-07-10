import React, { useEffect, useRef } from 'react';
import { Text, Animated, StyleSheet } from 'react-native';

const CustToast = ({ message,height=0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (message) {
      if (timerRef.current) clearTimeout(timerRef.current);
      
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      timerRef.current = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 2000);
    }
  }, [message]);

  return message ? (
    <Animated.View style={[styles.toastContainer, { opacity: fadeAnim , bottom: height ? height/2:50,}]}> 
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  ) : null;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#000000',
    padding: 10,
    borderRadius: 18,
    zIndex:999,
    paddingHorizontal:20
  },
  toastText: {
    color: '#ffffff',
  },
});

export default CustToast;
