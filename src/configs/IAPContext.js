import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { Platform } from "react-native";
import {
  initConnection,
  endConnection,
  getSubscriptions,
  flushFailedPurchasesCachedAsPendingAndroid,
  getAvailablePurchases,
  finishTransaction,
} from "react-native-iap";
import { useDispatch, useSelector } from "react-redux";
import { debounce } from "lodash";
import { updateSubscription } from "../redux/slices/authSlice";

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
  const dispatch = useDispatch();

  const isFetchingRef = useRef(false);
  const isCheckingRef = useRef(false);

  const androidSKUs = [
    "com.photomedthreemonth1",
    "com.photomedonemonth1",
    "com.photomedyearlyplan1",
  ];
  const iosSKUs = [
    "com.photomedthreemonth1",
    "com.photomedonemonth1",
    "com.photomedyearlyplan1",
  ];

  const token = useSelector((state) => state.auth.user);
  const userId = useSelector((state) => state.auth.userId);

  // Fetch available subscriptions
  const fetchSubscriptions = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const skus = Platform.OS === "android" ? androidSKUs : iosSKUs;
      const products = await getSubscriptions({ skus });
  console.log("Subscriptions fetched:\n", JSON.stringify(products, null, 2));
      setSubscriptions(products);
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
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
        if (Platform.OS === "android") {
          await flushFailedPurchasesCachedAsPendingAndroid();
        }

        const purchases = await getAvailablePurchases();
        console.log("Available purchases:", purchases);

        if (purchases.length === 0) {
          setCurrentSubscription(null);
          return;
        }

        const latestPurchase = purchases.sort(
          (a, b) => new Date(b.transactionDate) - new Date(a.transactionDate)
        )[0];

        const { transactionReceipt, productId } = latestPurchase;

        const response = await fetch(
          "https://photomedpro.com:10049/api/check-inapp-subscription",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              receipt: transactionReceipt,
              platform: Platform.OS,
              userId,
            }),
          }
        );

        const data = await response.json();
        console.log("Subscription check response:", data);

        const expData = {
          productId,
          expirationDate: data.expirationDate,
          isActive: data.isActive,
          isExpired: data.isExpired,
          hasSubscription: !!data.expirationDate,
          success: data.success,
          transactionId: data.transactionId,
        };

        setCurrentSubscription(expData);
        dispatch(updateSubscription(expData));

        try {
          await finishTransaction({ purchase: latestPurchase });
        } catch (err) {
          console.error("Error finishing restored transaction:", err);
        }
      } catch (err) {
        console.error("Error checking subscription:", err);
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
      if (Platform.OS === "android") {
        await flushFailedPurchasesCachedAsPendingAndroid();
      }

      const connected = await initConnection();
      console.log("IAP connected:", connected);
      setIsConnected(connected);

      if (connected) {
        await fetchSubscriptions();
      }
    } catch (err) {
      console.error("IAP initialization error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchSubscriptions]);

  useEffect(() => {
    initializeIAP();
    return () => {
      endConnection();
    };
  }, [initializeIAP]);

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
