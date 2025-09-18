import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  getSubscriptions,
  purchaseUpdatedListener,
  purchaseErrorListener,
  flushFailedPurchasesCachedAsPendingAndroid,
  getAvailablePurchases,
  finishTransaction,
} from 'react-native-iap';
import { useSelector } from 'react-redux';
import { debounce } from 'lodash';

const IAPContext = createContext({
  subscriptions: [],
  isConnected: false,
  currentSubscription: null,
  loading: false,
  fetchSubscriptions: () => {},
  checkSubscriptionStatus: () => {},
});

export const IAPProvider = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  const processedTransactionsRef = useRef(new Set());
  const isFetchingRef = useRef(false);
  const isCheckingRef = useRef(false);

  const androidSKUs = ['com.photomedthreemonth', 'com.photomedonemonth', 'com.photomedyearlyplan'];
  const iosSKUs = ['com.photomedthreemonth', 'com.photomedonemonth', 'com.photomedyearlyplan'];

  const token = useSelector((state) => state.auth.user);
  const userId = useSelector((state) => state.auth.userId);

  // Fetch available subscriptions
  const fetchSubscriptions = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const skus = Platform.OS === 'android' ? androidSKUs : iosSKUs;
      const products = await getSubscriptions({ skus });
      console.log('Subscriptions fetched:', products);
      setSubscriptions(products);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Check active subscription
  const checkSubscriptionStatus = useCallback(
    debounce(async () => {
      if (!token || isCheckingRef.current) return;
      isCheckingRef.current = true;
      setLoading(true);
      try {
        // Make sure we flush Android pending purchases first
        if (Platform.OS === 'android') await flushFailedPurchasesCachedAsPendingAndroid();

        const purchases = await getAvailablePurchases();
        console.log('Available purchases:', purchases);

        if (purchases.length === 0) {
          setCurrentSubscription(null);
          return;
        }

        // Take the latest purchase
        const latestPurchase = purchases.sort(
          (a, b) => new Date(b.transactionDate) - new Date(a.transactionDate)
        )[0];

        const { transactionReceipt, productId } = latestPurchase;

        // Verify with backend
        const response = await fetch('http://photomedpro.com/api/check-inapp-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            receipt: transactionReceipt,
            platform: Platform.OS,
            userId,
          }),
        });

        const data = await response.json();
        console.log('Subscription check response:', data);

        setCurrentSubscription({
          productId,
          expirationDate: data.expirationDate,
          isActive: data.isActive,
          isExpired: data.isExpired,
        });

        // Finish transaction to acknowledge purchase
        try {
          await finishTransaction({ purchase: latestPurchase });
        } catch (err) {
          console.error('Error finishing restored transaction:', err);
        }
      } catch (err) {
        console.error('Error checking subscription:', err);
        setCurrentSubscription(null);
      } finally {
        isCheckingRef.current = false;
        setLoading(false);
      }
    }, 500),
    [token, userId]
  );

  // Initialize IAP
  const initializeIAP = useCallback(async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'android') {
        await flushFailedPurchasesCachedAsPendingAndroid();
      }

      const connected = await initConnection();
      console.log('IAP connected:', connected);
      setIsConnected(connected);

      if (connected) {
        await fetchSubscriptions();
        await checkSubscriptionStatus();
      }
    } catch (err) {
      console.error('IAP initialization error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchSubscriptions]);

  // Listen to new purchases
  useEffect(() => {
    initializeIAP();

    const purchaseSub = purchaseUpdatedListener(async (purchase) => {
      const { transactionReceipt, transactionId, productId } = purchase;
      console.log('transactionReceipt--------', productId);

      if (processedTransactionsRef.current.has(transactionId)) return;
      processedTransactionsRef.current.add(transactionId);

      setLoading(true);
      try {
        if (!token) return;

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

        if (response.ok && responseData.success) {
          // Update current subscription
          setCurrentSubscription({
            productId: responseData.productId || productId,
            expirationDate: responseData.expirationDate,
            isActive: responseData.isActive,
            isExpired: responseData.isExpired,
          });

          // Finish transaction
          await finishTransaction({ purchase });
        } else {
          processedTransactionsRef.current.delete(transactionId);
          console.error('Backend verification failed:', responseData);
        }
      } catch (err) {
        processedTransactionsRef.current.delete(transactionId);
        console.error('Error verifying purchase:', err);
      } finally {
        setLoading(false);
      }
    });

    const errorSub = purchaseErrorListener((error) => {
      console.error('Purchase error:', error);
      setLoading(false);
    });

    return () => {
      endConnection();
      purchaseSub.remove();
      errorSub.remove();
    };
  }, [initializeIAP, token, userId]);

  return (
    <IAPContext.Provider
      value={{
        subscriptions,
        isConnected,
        currentSubscription,
        loading,
        fetchSubscriptions,
        checkSubscriptionStatus,
      }}
    >
      {children}
    </IAPContext.Provider>
  );
};

export const useIAP = () => useContext(IAPContext);
