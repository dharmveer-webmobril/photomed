import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { Platform } from "react-native";
import { useIAP } from "react-native-iap"; // ← this is the key change
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
  const dispatch = useDispatch();

  const token = useSelector((state) => state.auth.user);
  const userId = useSelector((state) => state.auth.userId);

  const {
    connected,                   // replaces isConnected
    subscriptions,               // already fetched list
    getSubscriptions,            // function to fetch
    getAvailablePurchases,
    finishTransaction,
  } = useIAP();

  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  const isFetchingRef = useRef(false);
  const isCheckingRef = useRef(false);

  const skus = [
    "com.photomedthreemonth1",
    "com.photomedonemonth1",
    "com.photomedyearlyplan1",
  ];

  // Fetch available subscriptions
  const fetchSubscriptions = useCallback(async () => {
    if (isFetchingRef.current || !connected) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const products = await getSubscriptions({ skus });
      console.log("Subscriptions fetched:\n", JSON.stringify(products, null, 2));
      // Note: subscriptions state from useIAP() is already updated automatically
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [connected, getSubscriptions]);

  // Check active subscription (restore / validate)
  const checkSubscriptionStatus = useCallback(
    debounce(async () => {
      if (!token || isCheckingRef.current || !connected) return;

      isCheckingRef.current = true;
      setLoading(true);

      try {
        const purchases = await getAvailablePurchases();
        console.log("Available purchases:", purchases);

        if (purchases.length === 0) {
          setCurrentSubscription(null);
          dispatch(updateSubscription(null));
          return;
        }

        // Most recent first
        const latestPurchase = purchases.sort((a, b) => {
          return new Date(b.transactionDate) - new Date(a.transactionDate);
        })[0];

        const { transactionReceipt, productId } = latestPurchase;

        const response = await fetch(
          "http://169.254.43.190:10049/api/check-inapp-subscription",
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
          expirationDate: data.expirationDate || null,
          isActive: !!data.isActive,
          isExpired: !!data.isExpired,
          hasSubscription: !!data.expirationDate,
          success: !!data.success,
          transactionId: data.transactionId,
        };

        setCurrentSubscription(expData);
        dispatch(updateSubscription(expData));

        // Finish (safe to call – ignored if not needed)
        try {
          await finishTransaction({ purchase: latestPurchase });
        } catch (finishErr) {
          console.warn("finishTransaction warning:", finishErr);
        }
      } catch (err) {
        console.error("Error checking subscription:", err);
        setCurrentSubscription(null);
        dispatch(updateSubscription(null));
      } finally {
        isCheckingRef.current = false;
        setLoading(false);
      }
    }, 600),
    [token, userId, connected, dispatch, getAvailablePurchases, finishTransaction]
  );

  useEffect(() => {
    if (connected) {
      fetchSubscriptions();
      // Optional: check status on connect / app start
      checkSubscriptionStatus();
    }
  }, [connected, fetchSubscriptions, checkSubscriptionStatus]);

  return (
    <IAPContext.Provider
      value={{
        subscriptions,           // ← from useIAP()
        isConnected: connected,  // ← from useIAP()
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

export const useIAP1 = () => useContext(IAPContext);