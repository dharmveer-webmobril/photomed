import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { initConnection, endConnection, getSubscriptions, purchaseUpdatedListener, purchaseErrorListener, flushFailedPurchasesCachedAsPendingAndroid, getAvailablePurchases, finishTransaction } from 'react-native-iap';
import { useSelector } from 'react-redux';
import { debounce } from 'lodash'; // Install lodash: npm install lodash

const IAPContext = createContext({
  subscriptions: [],
  isConnected: false,
  currentSubscription: null,
  fetchSubscriptions: () => { },
  checkSubscriptionStatus: () => { },
});

export const IAPProvider = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const isCheckingRef = useRef(false);
  const processedTransactionsRef = useRef(new Set());

  const androidSKUs = ['com.photomedthreemonth', 'com.photomedonemonth', 'com.photomedyearlyplan'];
  const iosSKUs = ['com.photomedthreemonth', 'com.photomedonemonth', 'com.photomedyearlyplan'];
  const token = useSelector(state => state.auth.user);
  const userId = useSelector(state => state.auth.userId);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const skus = Platform.OS === 'android' ? androidSKUs : iosSKUs;
      const products = await getSubscriptions({ skus });
      console.log('products:-------', products);
      setSubscriptions(products);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      // Alert.alert('Error', 'Failed to load subscriptions. Please try again.');
    }
  }, []);

  const checkSubscriptionStatus = useCallback(
    debounce(async () => {
      if (isCheckingRef.current || !token) {
        if (!token)  console.lof('Error', 'Authentication token missing. Please log in again.'); // Alert.alert('Error', 'Authentication token missing. Please log in again.');
        return;
      }
      isCheckingRef.current = true;

      try {
        const purchases = await getAvailablePurchases();
        if (purchases.length > 0) {
          // Sort by transactionDate to get the latest purchase
          const latestPurchase = purchases.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))[0];
          const { transactionReceipt, productId } = latestPurchase;

          const response = await fetch('http://photomedpro.com/api/check-inapp-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ receipt: transactionReceipt, platform: Platform.OS, userId }),
          });
          const data = await response.json();
          console.log('check-inapp-subscription-', data);

          setCurrentSubscription((prev) => {
            const newSub = { productId, expirationDate: data.expirationDate, isActive: data.isActive, isExpired: data.isExpired };
            if (JSON.stringify(prev) !== JSON.stringify(newSub)) {
              return newSub;
            }
            return prev;
          });
        } else {
          setCurrentSubscription(null);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        // Alert.alert('Error', 'Failed to check subscription status. Please try again.');
        setCurrentSubscription(null);
      } finally {
        isCheckingRef.current = false;
      }
    }, 1000),
    [token, userId]
  );

  const initializeIAP = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        await flushFailedPurchasesCachedAsPendingAndroid();
      }
      const connected = await initConnection();
      setIsConnected(connected);
      if (connected) {
        await fetchSubscriptions();
        await checkSubscriptionStatus();
      }
    } catch (error) {
      console.error('IAP Initialization Error:', error);
      // Alert.alert('Error', 'Failed to initialize in-app purchases. Please try again.');
    }
  }, [fetchSubscriptions, checkSubscriptionStatus]);

  useEffect(() => {
    initializeIAP();

    const purchaseSub = purchaseUpdatedListener(async (purchase) => {
      const { transactionReceipt, productId, transactionId } = purchase;

      if (processedTransactionsRef.current.has(transactionId)) return;
      processedTransactionsRef.current.add(transactionId);

      try {
        if (!token) {
          console.error('Token is undefined, skipping purchase verification');
          // Alert.alert('Error', 'Authentication token missing. Please log in again.');
          return;
        }
        const response = await fetch('http://photomedpro.com/api/verify-inapp-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            receipt: transactionReceipt,
            platform: Platform.OS,
            transactionId,
            userId,
          }),
        });
        const responseData = await response.json();
        console.log('verify-inapp-receipt response:', responseData);

        if (response.ok) {
          await finishTransaction({ purchase });
          await checkSubscriptionStatus();
        } else {
          console.error('Backend verification failed:', responseData);
          processedTransactionsRef.current.delete(transactionId);
          // Alert.alert('Error', 'Purchase verification failed. Please try again.');
        }
      } catch (error) {
        console.error('Error sending receipt:', error);
        processedTransactionsRef.current.delete(transactionId);
        // Alert.alert('Error', 'Failed to verify purchase. Please try again.');
      }
    });

    const errorSub = purchaseErrorListener((error) => {
      console.error('Purchase Error:', error);
      // Alert.alert('Error', 'Purchase failed. Please try again.');
    });

    return () => {
      endConnection();
      purchaseSub.remove();
      errorSub.remove();
    };
  }, [initializeIAP, checkSubscriptionStatus, token, userId]);

  return (
    <IAPContext.Provider value={{ subscriptions, isConnected, currentSubscription, fetchSubscriptions, checkSubscriptionStatus }}>
      {children}
    </IAPContext.Provider>
  );
};

export const useIAP = () => useContext(IAPContext);