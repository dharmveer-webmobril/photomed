import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from "react-native";
import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import { useDispatch, useSelector } from "react-redux";
import { useIAP } from "../../configs/IAPContext";
import { goBack } from "../../navigators/NavigationService";
import {
  getAvailablePurchases,
  requestSubscription,
  acknowledgePurchaseAndroid,
  finishTransaction,
} from "react-native-iap";
import { getMySubscriptionDetails } from "../../configs/api";
import { updateSubscription } from "../../redux/slices/authSlice";

const PLAN_PRIORITY = {
  "com.photomedonemonth": 1, // lowest
  "com.photomedthreemonth": 2,
  "com.photomedyearlyplan": 3, // highest
};

export default function SubscriptionManage(params) {
  const token = useSelector((state) => state.auth.user);
  const userId = useSelector((state) => state.auth.userId);
  const dispatch = useDispatch();

  const { subscriptions, fetchSubscriptions } = useIAP();
  const [selectedPlan, setSelectedPlan] = useState("");
  const [isGetSubLoading, setIsGetSubLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  const from = params?.page || "asd";

  useEffect(() => {
    currentSubscription?.productId &&
      setSelectedPlan(currentSubscription.productId);
  }, [currentSubscription]);

  useEffect(() => {
    const fetchSubscription = async () => {
      setIsGetSubLoading(true);
      const data =
        token && userId && (await getMySubscriptionDetails(token, userId));
      if (data) {
        setCurrentSubscription(data);
      }
      setIsGetSubLoading(false);
    };

    fetchSubscription();
  }, [token, userId]);

  useEffect(() => {
    getMySubscriptionDetails();
  }, []);

  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!token) {
        Alert.alert(
          "Error",
          "Authentication token missing. Please log in again."
        );
        return;
      }
      setIsLoading(true);
      try {
        await fetchSubscriptions();
        console.log("Subscriptions fetched:", JSON.stringify(subscriptions, null, 2));
      } catch (error) {
        console.error("Error loading subscriptions:", error.message, error);
        Alert.alert("Error", "Failed to load subscriptions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    loadSubscriptions();
  }, [token, userId, fetchSubscriptions]);

  const finishTransaction1 = async (purchase) => {
    try {
      await finishTransaction({ purchase, isConsumable: false });
      console.log("Transaction finished:", purchase.transactionId);
    } catch (err) {
      console.warn("Finish transaction error:", err.message, err);
    }
  };

  const acknowledgePurchaseAndroid1 = async (
    token,
    developerPayload,
    purchase
  ) => {
    try {
      await acknowledgePurchaseAndroid({ purchaseToken: token, developerPayload });
      await finishTransaction1(purchase);
    } catch (err) {
      console.warn("Acknowledge purchase error:", err.message, err);
    }
  };

  const handlePurchase = async () => {
    try {
      setIsLoading(true);

      // Verify user authentication
      if (!token) {
        Alert.alert("Error", "Authentication token missing. Please log in again.");
        return;
      }

      // Verify selected plan
      if (!selectedPlan) {
        Alert.alert("Error", "Please select a plan.");
        return;
      }

      // Check current subscription status
      let res = await getMySubscriptionDetails(token, userId);
      console.log("getMySubscriptionDetails res:", JSON.stringify(res, null, 2));

      if (res && res?.productId && res?.isExpired === false) {
        const currentPlanPriority = PLAN_PRIORITY[res.productId];
        const selectedPlanPriority = PLAN_PRIORITY[selectedPlan];

        // Block if selected plan is lower than current active plan
        if (selectedPlanPriority < currentPlanPriority) {
          Alert.alert(
            "Alert",
            "You already have a higher plan. You can only purchase a lower plan after your current subscription expires or is cancelled.\n\n👉 To manage your subscription, please go to your Google Play account."
          );
          return;
        }
      }

      let purchaseParams;
      if (Platform.OS === "android") {
        // Android: Handle base plan purchase
        const subscription = subscriptions.find(s => s.productId === selectedPlan);
        if (!subscription) {
          console.error("Subscription not found for productId:", selectedPlan);
          Alert.alert("Error", "Selected subscription plan not found.");
          return;
        }

        console.log("Selected subscription:", JSON.stringify(subscription, null, 2));

        const offerDetails = subscription.subscriptionOfferDetails?.[0];
        if (!offerDetails || !offerDetails.basePlanId) {
          console.error("No base plan found for subscription:", selectedPlan);
          Alert.alert("Error", "No valid base plan found for this subscription.");
          return;
        }

        purchaseParams = {
          sku: selectedPlan,
          subscriptionOffers: [
            {
              sku: selectedPlan,
              basePlanId: offerDetails.basePlanId,
              offerToken: offerDetails?.offerToken || undefined, // Include offerToken if available
            },
          ],
        };
      } else {
        // iOS: Use the existing SKU-based approach
        purchaseParams = { sku: selectedPlan };
      }

      console.log("Purchase request params:", JSON.stringify(purchaseParams, null, 2));

      // Initiate subscription purchase
      const purchase = await requestSubscription(purchaseParams);
      console.log("Purchase response:", JSON.stringify(purchase, null, 2));

      if (purchase) {
        let bodyData;
        if (Platform.OS === "android") {
          const purchaseData = Array.isArray(purchase) ? purchase[0] : purchase;
          bodyData = JSON.stringify({
            receipt: {
              purchaseToken: purchaseData.purchaseToken || "",
              subscriptionId: purchaseData.productId || "",
              packageName: "com.photomedPro.com",
            },
            platform: "android",
            userId,
          });
        } else {
          bodyData = JSON.stringify({
            receipt: purchase.transactionReceipt,
            platform: Platform.OS,
            transactionId: purchase.transactionId,
            userId,
          });
        }

        console.log("Purchase verification body:", bodyData);

        // Verify purchase with backend
        const response = await fetch(
          "https://photomedpro.com:10049/api/verify-inapp-receipt",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: bodyData,
          }
        );

        const responseData = await response.json();
        console.log("verify-inapp-receipt response:", JSON.stringify(responseData, null, 2));

        if (response.ok && responseData.success) {
          // Acknowledge purchase
          if (Platform.OS === "ios") {
            await finishTransaction1(purchase);
          } else {
            const purchaseData = Array.isArray(purchase) ? purchase[0] : purchase;
            await acknowledgePurchaseAndroid1(
              purchaseData.purchaseToken,
              purchaseData.developerPayloadAndroid,
              purchaseData
            );
          }

          // Prepare subscription data
          let expData = {
            expirationDate: responseData?.expirationDate,
            hasSubscription: true,
            isActive: responseData?.isActive,
            isExpired: responseData?.isExpired,
            productId: responseData?.productId || (Array.isArray(purchase) ? purchase[0].productId : purchase.productId),
            success: responseData?.success,
            transactionId: responseData?.transactionId || (Array.isArray(purchase) ? purchase[0].transactionId : purchase.transactionId),
          };

          console.log("expData:", JSON.stringify(expData, null, 2));

          // Update local state and redux
          setCurrentSubscription(expData);
          dispatch(updateSubscription(expData));

          if (from === "profile") {
            goBack();
          }
          Alert.alert("Success", "Purchase verified and activated!");
        } else {
          console.error("Purchase verification failed:", responseData);
          Alert.alert("Error", "Purchase verification failed.");
        }
      } else {
        Alert.alert("Error", "Purchase failed. No receipt received.");
      }
    } catch (error) {
      console.error("Purchase failed:", error.message, error.code, error);
      Alert.alert("Error", `Failed to complete purchase: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async () => {
    if (!token) {
      Alert.alert("Error", "Authentication token missing. Please log in again.");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Starting restore purchases for platform:", Platform.OS);

      // Fetch available purchases
      const purchases = await getAvailablePurchases();
      console.log("Available purchases:", JSON.stringify(purchases, null, 2));

      if (purchases.length > 0) {
        // Sort by most recent purchase
        const latestPurchase = purchases.sort(
          (a, b) => new Date(b.transactionDate) - new Date(a.transactionDate)
        )[0];
        console.log("Latest purchase:", JSON.stringify(latestPurchase, null, 2));

        // Prepare body data for backend verification
        let bodyData;
        if (Platform.OS === "android") {
          bodyData = JSON.stringify({
            receipt: {
              purchaseToken: latestPurchase.purchaseToken || "",
              subscriptionId: latestPurchase.productId || "",
              packageName: "com.photomedPro.com",
            },
            platform: "android",
            userId,
          });
        } else {
          bodyData = JSON.stringify({
            receipt: latestPurchase.transactionReceipt,
            platform: Platform.OS,
            transactionId: latestPurchase.transactionId,
            userId,
          });
        }

        console.log("Restore verification body:", bodyData);

        // Verify purchase with backend
        const response = await fetch(
          "https://photomedpro.com:10049/api/verify-inapp-receipt",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: bodyData,
          }
        );

        const responseData = await response.json();
        console.log("Backend verification response:", JSON.stringify(responseData, null, 2));

        if (response.ok && responseData.success) {
          // Acknowledge purchase on Android if not already acknowledged
          if (Platform.OS === "android" && !latestPurchase.isAcknowledgedAndroid) {
            try {
              await acknowledgePurchaseAndroid({
                purchaseToken: latestPurchase.purchaseToken,
                developerPayload: latestPurchase.developerPayloadAndroid,
              });
              console.log("Purchase acknowledged successfully for:", latestPurchase.transactionId);
              await finishTransaction({ purchase: latestPurchase, isConsumable: false });
              console.log("Transaction finished for:", latestPurchase.transactionId);
            } catch (ackError) {
              console.warn("Acknowledge or finish transaction error:", ackError.message, ackError);
            }
          } else if (Platform.OS === "ios") {
            await finishTransaction({ purchase: latestPurchase, isConsumable: false });
            console.log("Transaction finished for iOS:", latestPurchase.transactionId);
          }

          // Prepare subscription data
          const expData = {
            expirationDate: responseData?.expirationDate,
            hasSubscription: true,
            isActive: responseData?.isActive,
            isExpired: responseData?.isExpired,
            productId: responseData?.productId || latestPurchase.productId,
            success: responseData?.success,
            transactionId: responseData?.transactionId || latestPurchase.transactionId,
          };

          console.log("Restored subscription data:", JSON.stringify(expData, null, 2));

          // Update local state and redux
          setCurrentSubscription(expData);
          dispatch(updateSubscription(expData));

          Alert.alert("Success", "Purchases restored successfully.");
        } else {
          console.error("Backend verification failed:", responseData);
          Alert.alert("Error", "Failed to verify restored purchase with server.");
        }
      } else {
        Alert.alert("Info", "No purchases found to restore.");
      }
    } catch (error) {
      console.error("Restore failed:", error.message, error.code, error);
      Alert.alert("Error", `Failed to restore purchases: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPlan = async () => {
    try {
      Alert.alert(
        "Cancel Subscription",
        Platform.OS === "ios"
          ? "To cancel your subscription, please open the Settings app on your iPhone, go to your Apple ID → Subscriptions, and manage it there."
          : "To cancel your subscription, please open the Google Play Store app, tap on your profile → Payments & subscriptions → Subscriptions, and manage it there.",
        [{ text: "OK", style: "default" }]
      );
    } catch (error) {
      console.error("Failed to open subscription management:", error);
      Alert.alert("Error", "Failed to open subscription management.");
    }
  };

  const CustomRadioButton = ({ selected, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.radioOuter}>
      {selected && <View style={styles.radioInner} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Loading visible={isLoading || isGetSubLoading} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              from === "profile" && goBack();
            }}
          >
            {from === "profile" && <Text style={styles.iconText}>←</Text>}
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Subscription Plan</Text>
          <View />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {currentSubscription?.hasSubscription &&
            currentSubscription?.isActive === false && (
              <Text style={{ color: "red", marginBottom: 10 }}>
                Your current subscription has expired. Please renew to continue
                enjoying premium features.
              </Text>
            )}

          {subscriptions?.length > 0 &&
            subscriptions.map((plan) => {
              const isSelected = selectedPlan === plan.productId;

              const androidPrice =
                plan.subscriptionOfferDetails?.[0]?.pricingPhases
                  ?.pricingPhaseList?.[0]?.formattedPrice || "N/A";

              return (
                <TouchableOpacity
                  key={plan.productId}
                  onPress={() => setSelectedPlan(plan.productId)}
                  style={[styles.planCard, isSelected && styles.selectedCard]}
                >
                  <View style={styles.cardHeader}>
                    {plan.productId === "com.photomedthreemonth" && (
                      <Text style={styles.planTitle}>3-Month Premium Plan</Text>
                    )}
                    {plan.productId === "com.photomedyearlyplan" && (
                      <Text style={styles.planTitle}>
                        Annual Pro Subscription
                      </Text>
                    )}
                    {plan.productId === "com.photomedonemonth" && (
                      <Text style={styles.planTitle}>Monthly Access Plan</Text>
                    )}
                    <Text style={styles.planPrice}>
                      {Platform.OS === "android"
                        ? androidPrice
                        : plan.localizedPrice}
                    </Text>
                  </View>
                  {plan.productId === "com.photomedthreemonth" && (
                    <Text style={styles.planText}>
                      • Enjoy full access to all features for 3 months
                    </Text>
                  )}
                  {plan.productId === "com.photomedyearlyplan" && (
                    <Text style={styles.planText}>
                      • Full app access for a year at a great value
                    </Text>
                  )}
                  {plan.productId === "com.photomedonemonth" && (
                    <Text style={styles.planText}>
                      • Access to all features for 1 month
                    </Text>
                  )}
                  <Text style={styles.planText}>
                    • Everything in Standard Plan
                  </Text>
                  <Text style={styles.planText}>
                    • Exclusive Content & Tips
                  </Text>
                  {currentSubscription?.productId === plan.productId && (
                    <Text style={styles.planText}>
                      Active until{" "}
                      {new Date(
                        currentSubscription.expirationDate
                      ).toLocaleDateString()}
                    </Text>
                  )}
                  <View style={styles.radioWrapper}>
                    <CustomRadioButton
                      selected={isSelected}
                      onPress={() => setSelectedPlan(plan.productId)}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}

          {subscriptions?.length > 0 && (
            <>
              <TouchableOpacity
                style={styles.restoreBtn}
                onPress={handlePurchase}
              >
                <Text style={styles.restoreText}>
                  {selectedPlan === currentSubscription?.productId
                    ? "Upgrade Plan"
                    : "Subscribe"}
                </Text>
              </TouchableOpacity>
              {selectedPlan === currentSubscription?.productId &&
                currentSubscription?.isExpired === false && (
                  <TouchableOpacity
                    style={styles.restoreBtn}
                    onPress={handleCancelPlan}
                  >
                    <Text style={styles.restoreText}>Cancel Plan</Text>
                  </TouchableOpacity>
                )}
              <TouchableOpacity
                style={styles.restoreBtn}
                onPress={restorePurchases}
              >
                <Text style={styles.restoreText}>Restore Purchases</Text>
              </TouchableOpacity>
            </>
          )}
          <Text style={{ color: "#000", marginTop: 10 }}>
            Note:- If your payment was deducted but the plan was not activated,
            click the Restore Button to restore your plan.
          </Text>

          <Text
            style={{
              textAlign: "center",
              marginHorizontal: 20,
              color: "#000",
              marginTop: 30,
            }}
          >
            Payment will be charged to iTunes Account at confirmation of
            purchase. Subscription automatically renews unless auto-renew is
            turned off at least 24-hours before the end of the current period.
            Account will be charged for renewal within 24-hours prior to the end
            of the current period, and identify the cost of the renewal.
            Subscriptions may be managed by the user and auto-renewal may be
            turned off by going to the user's Account Settings after purchase.
            No cancellation of the current subscription is allowed during active
            subscription period. Any unused portion of a free trial period, if
            offered, will be forfeited when the user purchases a subscription to
            that publication, where applicable
          </Text>

          <View
            style={{
              flexDirection: "row",
              marginHorizontal: 20,
              marginTop: 20,
              marginBottom: 30,
              justifyContent: "center",
            }}
          >
            <Text
              onPress={() =>
                navigate("Terms and Condition", {
                  slug: "terms-and-conditions",
                  screenName: "Terms and Conditions",
                })
              }
              style={{
                color: "#32327C",
                marginRight: 10,
                textDecorationLine: "underline",
              }}
            >
              Terms of Service
            </Text>
            <Text
              onPress={() =>
                navigate("Terms and Condition", {
                  slug: "privacy-policy",
                  screenName: "Privacy Policy",
                })
              }
              style={{
                color: "#32327C",
                marginLeft: 10,
                textDecorationLine: "underline",
              }}
            >
              Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  iconText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContent: {
    paddingVertical: 10,
    alignItems: "center",
  },
  planCard: {
    backgroundColor: "#fff",
    width: "96%",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    position: "relative",
  },
  selectedCard: {
    backgroundColor: "#e0e0f3",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000"
  },
  planPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000"
  },
  planText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  radioWrapper: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#32327C",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#32327C",
  },
  restoreBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: "#32327C",
    borderRadius: 10,
    width: "96%",
  },
  restoreText: {
    color: "#32327C",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "600",
  },
});

// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   SafeAreaView,
//   Linking,
//   Alert,
//   Platform,
// } from "react-native";
// import React, { useEffect, useState, useRef } from "react";
// import Loading from "../../components/Loading";
// import { useDispatch, useSelector } from "react-redux";
// import { goBack, navigate } from "../../navigators/NavigationService";
// import {
//   initConnection,
//   getSubscriptions,
//   requestSubscription,
//   getAvailablePurchases,
//   purchaseUpdatedListener,
//   purchaseErrorListener,
//   finishTransaction,
//   acknowledgePurchaseAndroid,
//   endConnection,
// } from "react-native-iap";
// import { getMySubscriptionDetails } from "../../configs/api";
// import { updateSubscription } from "../../redux/slices/authSlice";
// import { useIAP } from "../../configs/IAPContext";
// import AccountPopUp from "../../components/AccountPopUp";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// const SUBSCRIPTION_SKUS = Platform.select({
//   ios: [
//     "com.photomedyearlyplan",
//     "com.photomedthreemonth",
//     "com.photomedonemonth",
//   ],
//   android: [
//     "com.photomedthreemonth",
//     "com.photomedyearlyplan",
//     "com.photomedonemonth",
//   ],
// });
// const PLAN_PRIORITY = {
//   "com.photomedonemonth": 1,
//   "com.photomedthreemonth": 2,
//   "com.photomedyearlyplan": 3,
// };

// export default function SubscriptionManage(params) {
//   const token = useSelector((state) => state.auth.user);
//   const userId = useSelector((state) => state.auth.userId);
//   const dispatch = useDispatch();
//   const { subscriptions, fetchSubscriptions } = useIAP();
//   const [selectedPlan, setSelectedPlan] = useState("");
//   const [isGetSubLoading, setIsGetSubLoading] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [currentSubscription, setCurrentSubscription] = useState(null);
//   const [logoutVisible, setLogoutVisible] = useState(false);
//   const [actionInProgress, setActionInProgress] = useState(null);
//   const actionRef = useRef(null);
//   const processedTransactions = useRef(new Set());

//   const from = params?.page || "asd";

//   // Load processed transactions from AsyncStorage
//   useEffect(() => {
//     const loadProcessedTransactions = async () => {
//       try {
//         const stored = await AsyncStorage.getItem("processedTransactions");
//         if (stored) {
//           processedTransactions.current = new Set(JSON.parse(stored));
//           console.log(`[${new Date().toISOString()}] Loaded processed transactions:`, processedTransactions.current.size);
//         }
//       } catch (error) {
//         console.error(`[${new Date().toISOString()}] Error loading processed transactions:`, error);
//       }
//     };
//     loadProcessedTransactions();
//   }, []);

//   // Save processed transaction to AsyncStorage
//   const saveProcessedTransaction = async (transactionId) => {
//     try {
//       processedTransactions.current.add(transactionId);
//       await AsyncStorage.setItem(
//         "processedTransactions",
//         JSON.stringify([...processedTransactions.current])
//       );
//       console.log(`[${new Date().toISOString()}] Saved processed transaction:`, transactionId);
//     } catch (error) {
//       console.error(`[${new Date().toISOString()}] Error saving processed transaction:`, error);
//     }
//   };

//   // Verify receipt with enhanced error handling
//   const verifyReceipt = async (purchase, actionType = "purchase", retries = 3) => {
//     if (!purchase?.transactionReceipt && Platform.OS !== "android") {
//       console.log(`[${new Date().toISOString()}] No transaction receipt for ${actionType}, skipping...`);
//       throw new Error("No transaction receipt provided.");
//     }

//     if (processedTransactions.current.has(purchase.transactionId)) {
//       console.log(`[${new Date().toISOString()}] Skipping already processed ${actionType} transaction:`, purchase.transactionId);
//       return null;
//     }

//     if (!SUBSCRIPTION_SKUS.includes(purchase.productId)) {
//       console.error(`[${new Date().toISOString()}] Invalid product ID:`, purchase.productId);
//       throw new Error(`Invalid product ID: ${purchase.productId}`);
//     }

//     for (let i = 0; i < retries; i++) {
//       try {
//         setIsLoading(true);
//         console.log(`[${new Date().toISOString()}] Processing ${actionType} (Attempt ${i + 1}):`, purchase);
//         const response = await fetch(
//           "https://photomedpro.com:10049/api/verify-inapp-receipt",
//           {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${token}`,
//             },
//             body: JSON.stringify({
//               receipt: purchase.transactionReceipt || purchase.purchaseToken,
//               platform: Platform.OS,
//               transactionId: purchase.transactionId,
//               userId,
//               productId: purchase.productId, // Explicitly include productId
//             }),
//           }
//         );

//         const data = await response.json();
//         console.log(`[${new Date().toISOString()}] ${actionType} response:`, data);

//         if (response.ok && data.success) {
//           const expData = {
//             expirationDate: data?.expirationDate,
//             hasSubscription: true,
//             isActive: data?.isActive ?? true,
//             isExpired: data?.isExpired ?? false,
//             productId: data?.productId || purchase.productId,
//             success: data?.success,
//             transactionId: data?.transactionId || purchase.transactionId,
//           };

//           setCurrentSubscription(expData);
//           dispatch(updateSubscription(expData));

//           if (Platform.OS === "android" && purchase.purchaseToken && !purchase.isAcknowledged) {
//             console.log(`[${new Date().toISOString()}] Acknowledging Android purchase:`, purchase.purchaseToken);
//             await acknowledgePurchaseAndroid({ purchaseToken: purchase.purchaseToken });
//           }

//           console.log(`[${new Date().toISOString()}] Finishing transaction for ${actionType}:`, purchase.transactionId);
//           await finishTransaction({ purchase, isConsumable: false });

//           await saveProcessedTransaction(purchase.transactionId);

//           Alert.alert("Success", "Subscription activated successfully!");
//           return expData;
//         } else {
//           throw new Error(data.message || "Verification failed.");
//         }
//       } catch (error) {
//         console.error(`[${new Date().toISOString()}] ${actionType} error (Attempt ${i + 1}):`, error);
//         if (error.message.includes("Invalid product ID")) {
//           Alert.alert("Error", `Invalid product ID: ${purchase.productId}. Please contact support.`);
//           throw error;
//         }
//         if (i === retries - 1) {
//           throw new Error(`Failed to verify ${actionType.toLowerCase()}: ${error.message}`);
//         }
//         await new Promise((resolve) => setTimeout(resolve, 1000));
//       } finally {
//         setIsLoading(false);
//       }
//     }
//   };

//   // Fetch current subscription from backend
//   useEffect(() => {
//     const fetchSubscription = async () => {
//       if (!token || !userId) {
//         Alert.alert("Error", "Authentication token or user ID missing. Please log in again.");
//         return;
//       }
//       try {
//         setIsGetSubLoading(true);
//         console.log(`[${new Date().toISOString()}] Fetching subscription details`);
//         const data = await getMySubscriptionDetails(token, userId);
//         setCurrentSubscription(data);
//         if (data?.productId && SUBSCRIPTION_SKUS.includes(data.productId)) {
//           setSelectedPlan(data.productId);
//         } else {
//           setSelectedPlan(SUBSCRIPTION_SKUS[0] || "");
//         }
//         console.log(`[${new Date().toISOString()}] Current subscription data:`, data);
//       } catch (e) {
//         console.error(`[${new Date().toISOString()}] fetchSubscription error:`, e);
//         Alert.alert("Error", "Failed to fetch subscription details.");
//       } finally {
//         setIsGetSubLoading(false);
//       }
//     };
//     fetchSubscription();
//   }, [token, userId]);

//   // Load subscriptions from IAP
//   useEffect(() => {
//     const loadSubscriptions = async () => {
//       if (!token || !userId) {
//         Alert.alert("Error", "Authentication token or user ID missing. Please log in again.");
//         return;
//       }
//       try {
//         setIsLoading(true);
//         console.log(`[${new Date().toISOString()}] Fetching subscriptions...`);
//         await fetchSubscriptions();
//         console.log(`[${new Date().toISOString()}] Subscriptions fetched:`, subscriptions);
//         if (subscriptions?.length > 0 && !selectedPlan) {
//           setSelectedPlan(subscriptions[0].productId);
//           console.log(`[${new Date().toISOString()}] Set default selectedPlan:`, subscriptions[0].productId);
//         }
//       } catch (error) {
//         console.error(`[${new Date().toISOString()}] Error loading subscriptions:`, error);
//         Alert.alert("Error", "Failed to load subscriptions. Please try again.");
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     loadSubscriptions();
//   }, [token, userId, fetchSubscriptions]);

//   // Check pending purchases on screen load
//   useEffect(() => {
//     const checkPendingPurchases = async () => {
//       let purchaseUpdateSubscription;
//       try {
//         console.log(`[${new Date().toISOString()}] Checking pending purchases on screen load`);
//         await initConnection();
//         purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
//           if (!SUBSCRIPTION_SKUS.includes(purchase.productId)) {
//             console.log(`[${new Date().toISOString()}] Ignoring invalid SKU on screen load:`, purchase.productId);
//             return;
//           }
//           if (processedTransactions.current.has(purchase.transactionId)) {
//             console.log(`[${new Date().toISOString()}] Skipping already processed transaction on screen load:`, purchase.transactionId);
//             return;
//           }
//           console.log(`[${new Date().toISOString()}] Processing pending purchase on screen load:`, purchase);
//           await verifyReceipt(purchase, "Pending");
//         });
//         const purchases = await getAvailablePurchases();
//         console.log(`[${new Date().toISOString()}] Pending purchases on screen load:`, purchases);
//         for (const purchase of purchases) {
//           if (SUBSCRIPTION_SKUS.includes(purchase.productId) && !processedTransactions.current.has(purchase.transactionId)) {
//             await verifyReceipt(purchase, "Pending");
//           }
//         }
//       } catch (error) {
//         console.error(`[${new Date().toISOString()}] Pending purchase check error:`, error);
//       } finally {
//         if (purchaseUpdateSubscription) {
//           purchaseUpdateSubscription.remove();
//           console.log(`[${new Date().toISOString()}] Removed pending purchaseUpdateSubscription`);
//         }
//         await endConnection();
//         console.log(`[${new Date().toISOString()}] IAP connection ended for pending check`);
//       }
//     };
//     checkPendingPurchases();
//   }, []);

//   // Start purchase
//   const handlePurchase = async () => {
//     if (!selectedPlan) {
//       Alert.alert("Error", "Please select a plan.");
//       return;
//     }
//     if (!SUBSCRIPTION_SKUS.includes(selectedPlan)) {
//       Alert.alert("Error", `Invalid product ID: ${selectedPlan}. Please select a valid plan.`);
//       return;
//     }
//     if (!token) {
//       Alert.alert("Error", "Authentication token missing. Please log in again.");
//       return;
//     }

//     let purchaseUpdateSubscription, purchaseErrorSubscription;
//     actionRef.current = "purchase";

//     try {
//       setIsLoading(true);
//       setActionInProgress("purchase");
//       console.log(`[${new Date().toISOString()}] Initializing IAP connection for purchase`);
//       await initConnection();
//       console.log(`[${new Date().toISOString()}] IAP connection initialized`);

//       purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
//         if (actionRef.current !== "purchase") {
//           console.log(`[${new Date().toISOString()}] Ignoring unexpected purchase event:`, purchase);
//           return;
//         }
//         if (!SUBSCRIPTION_SKUS.includes(purchase.productId)) {
//           console.log(`[${new Date().toISOString()}] Ignoring purchase with invalid SKU:`, purchase.productId);
//           return;
//         }
//         if (purchase.productId !== selectedPlan) {
//           console.log(`[${new Date().toISOString()}] Ignoring purchase for non-selected plan:`, purchase.productId);
//           return;
//         }
//         console.log(`[${new Date().toISOString()}] Purchase listener triggered:`, purchase);
//         try {
//           await verifyReceipt(purchase, "Purchase");
//           // Navigate back to PatientDetails after successful purchase
//           if (from === "patientDetails") {
//             goBack();
//           }
//         } catch (error) {
//           Alert.alert("Error", error.message || "Purchase verification failed.");
//         }
//       });

//       purchaseErrorSubscription = purchaseErrorListener((error) => {
//         if (actionRef.current !== "purchase") {
//           console.log(`[${new Date().toISOString()}] Ignoring unexpected purchase error:`, error);
//           return;
//         }
//         console.error(`[${new Date().toISOString()}] Purchase error:`, error);
//         Alert.alert("Error", `Purchase failed: ${error.message || "Unknown error"}`);
//         setIsLoading(false);
//       });

//       const res = await getMySubscriptionDetails(token, userId);
//       console.log(`[${new Date().toISOString()}] getMySubscriptionDetails res:`, res);

//       if (res && res?.productId && res?.isExpired === false) {
//         const currentPlanPriority = PLAN_PRIORITY[res.productId];
//         const selectedPlanPriority = PLAN_PRIORITY[selectedPlan];

//         if (selectedPlanPriority < currentPlanPriority) {
//           Alert.alert(
//             "Alert",
//             "You already have a higher plan. You can only purchase a lower plan after your current subscription expires or is cancelled.\n\n👉 To manage your subscription, please go to your App Store/Google Play account."
//           );
//           return;
//         }
//       }

//       console.log(`[${new Date().toISOString()}] Starting purchase for SKU:`, selectedPlan);
//       await requestSubscription({ sku: selectedPlan });
//     } catch (error) {
//       console.error(`[${new Date().toISOString()}] Purchase start error:`, error);
//       Alert.alert("Error", `Failed to start purchase: ${error.message || "Unknown error"}`);
//       setIsLoading(false);
//     } finally {
//       actionRef.current = null;
//       setActionInProgress(null);
//       if (purchaseUpdateSubscription) {
//         purchaseUpdateSubscription.remove();
//         console.log(`[${new Date().toISOString()}] Removed purchaseUpdateSubscription`);
//       }
//       if (purchaseErrorSubscription) {
//         purchaseErrorSubscription.remove();
//         console.log(`[${new Date().toISOString()}] Removed purchaseErrorSubscription`);
//       }
//       await endConnection();
//       console.log(`[${new Date().toISOString()}] IAP connection ended`);
//     }
//   };

//   // Restore purchases
//   const restorePurchases = async () => {
//     if (!token) {
//       Alert.alert("Error", "Authentication token missing. Please log in again.");
//       return;
//     }

//     let purchaseUpdateSubscription, purchaseErrorSubscription;
//     actionRef.current = "restore";

//     try {
//       setIsLoading(true);
//       setActionInProgress("restore");
//       console.log(`[${new Date().toISOString()}] Initializing IAP connection for restore`);
//       await initConnection();
//       console.log(`[${new Date().toISOString()}] IAP connection initialized`);

//       purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
//         if (actionRef.current !== "restore") {
//           console.log(`[${new Date().toISOString()}] Ignoring unexpected restore event:`, purchase);
//           return;
//         }
//         if (!SUBSCRIPTION_SKUS.includes(purchase.productId)) {
//           console.log(`[${new Date().toISOString()}] Ignoring restore with invalid SKU:`, purchase.productId);
//           return;
//         }
//         console.log(`[${new Date().toISOString()}] Restore listener triggered:`, purchase);
//         try {
//           await verifyReceipt(purchase, "Restore");
//           // Navigate back to PatientDetails after successful restore
//           if (from === "patientDetails") {
//             goBack();
//           }
//         } catch (error) {
//           Alert.alert("Error", error.message || "Restore verification failed.");
//         }
//       });

//       purchaseErrorSubscription = purchaseErrorListener((error) => {
//         if (actionRef.current !== "restore") {
//           console.log(`[${new Date().toISOString()}] Ignoring unexpected restore error:`, error);
//           return;
//         }
//         console.error(`[${new Date().toISOString()}] Restore error:`, error);
//         Alert.alert("Error", `Restore failed: ${error.message || "Unknown error"}`);
//         setIsLoading(false);
//       });

//       console.log(`[${new Date().toISOString()}] Fetching available purchases`);
//       const purchases = await getAvailablePurchases();
//       console.log(`[${new Date().toISOString()}] Available purchases:`, purchases);

//       if (purchases.length > 0) {
//         const validPurchases = purchases.filter(
//           (purchase) =>
//             SUBSCRIPTION_SKUS.includes(purchase.productId) &&
//             !processedTransactions.current.has(purchase.transactionId)
//         );
//         console.log(`[${new Date().toISOString()}] Valid purchases:`, validPurchases);

//         if (validPurchases.length > 0) {
//           for (const purchase of validPurchases) {
//             console.log(`[${new Date().toISOString()}] Processing restore purchase:`, purchase);
//             await verifyReceipt(purchase, "Restore");
//           }
//         } else {
//           console.log(`[${new Date().toISOString()}] No valid unprocessed purchases found for SKUs:`, SUBSCRIPTION_SKUS);
//           Alert.alert("Info", "No valid purchases found to restore.");
//         }
//       } else {
//         console.log(`[${new Date().toISOString()}] No purchases found to restore`);
//         Alert.alert("Info", "No purchases found to restore.");
//       }
//     } catch (error) {
//       console.error(`[${new Date().toISOString()}] Restore failed:`, error);
//       Alert.alert("Error", error.message || "Failed to restore purchases.");
//     } finally {
//       actionRef.current = null;
//       setActionInProgress(null);
//       setIsLoading(false);
//       if (purchaseUpdateSubscription) {
//         purchaseUpdateSubscription.remove();
//         console.log(`[${new Date().toISOString()}] Removed purchaseUpdateSubscription`);
//       }
//       if (purchaseErrorSubscription) {
//         purchaseErrorSubscription.remove();
//         console.log(`[${new Date().toISOString()}] Removed purchaseErrorSubscription`);
//       }
//       await endConnection();
//       console.log(`[${new Date().toISOString()}] IAP connection ended`);
//     }
//   };

//   // Cancel plan
//   const handleCancelPlan = async () => {
//     try {
//       const url =
//         Platform.OS === "ios"
//           ? "itms-apps://apps.apple.com/account/subscriptions"
//           : "https://play.google.com/store/account/subscriptions?package=com.photomedPro.com";
//       console.log(`[${new Date().toISOString()}] Opening subscription management URL:`, url);
//       await Linking.openURL(url);
//       Alert.alert("Info", "You have been redirected to manage your subscriptions.");
//     } catch (error) {
//       console.error(`[${new Date().toISOString()}] Failed to open subscription management:`, error);
//       Alert.alert("Error", "Failed to open subscription management.");
//     }
//   };

//   // UI helpers
//   const CustomRadioButton = ({ selected, onPress }) => (
//     <TouchableOpacity onPress={onPress} style={styles.radioOuter}>
//       {selected && <View style={styles.radioInner} />}
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <AccountPopUp
//         title={"Logout"}
//         onPressCancel={() => setLogoutVisible(false)}
//         onPressSuccess={() => dispatch(logout())}
//         subTitle={
//           "Are you sure you want to logout from Photomed Pro? This will end your current session."
//         }
//         visible={logoutVisible}
//       />
//       <Loading
//         visible={isLoading || isGetSubLoading}
//         message={
//           isLoading
//             ? actionInProgress === "purchase"
//               ? "Processing purchase..."
//               : actionInProgress === "restore"
//               ? "Restoring purchases..."
//               : "Processing..."
//             : "Fetching subscription..."
//         }
//       />
//       <View style={styles.container}>
//         <View style={styles.header}>
//           <TouchableOpacity
//             onPress={() => {
//               if (from === "profile") goBack();
//             }}
//           >
//             {from === "profile" && <Text style={styles.iconText}>←</Text>}
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Manage Subscription Plan</Text>
//           <TouchableOpacity
//             onPress={() => {
//               if (from !== "profile") setLogoutVisible(true);
//             }}
//           >
//             {from !== "profile" && (
//               <Text style={styles.iconTextRight}>Logout</Text>
//             )}
//           </TouchableOpacity>
//         </View>

//         <ScrollView contentContainerStyle={styles.scrollContent}>
//           {currentSubscription?.hasSubscription &&
//             currentSubscription?.isActive === false && (
//               <Text style={{ color: "red", marginBottom: 10 }}>
//                 Your current subscription has expired. Please renew to continue
//                 enjoying premium features.
//               </Text>
//             )}

//           {subscriptions?.length > 0 &&
//             subscriptions.map((plan) => {
//               const isSelected = selectedPlan === plan.productId;
//               return (
//                 <TouchableOpacity
//                   key={plan.productId}
//                   onPress={() => setSelectedPlan(plan.productId)}
//                   style={[styles.planCard, isSelected && styles.selectedCard]}
//                 >
//                   <View style={styles.cardHeader}>
//                     {plan.productId === "com.photomedthreemonth" && (
//                       <Text style={styles.planTitle}>3-Month Premium Plan</Text>
//                     )}
//                     {plan.productId === "com.photomedyearlyplan" && (
//                       <Text style={styles.planTitle}>
//                         Annual Pro Subscription
//                       </Text>
//                     )}
//                     {plan.productId === "com.photomedonemonth" && (
//                       <Text style={styles.planTitle}>Monthly Access Plan</Text>
//                     )}
//                     <Text style={styles.planPrice}>{plan.localizedPrice}</Text>
//                   </View>
//                   {plan.productId === "com.photomedthreemonth" && (
//                     <Text style={styles.planText}>
//                       • Enjoy full access to all features for 3 months
//                     </Text>
//                   )}
//                   {plan.productId === "com.photomedyearlyplan" && (
//                     <Text style={styles.planText}>
//                       • Full app access for a year at a great value
//                     </Text>
//                   )}
//                   {plan.productId === "com.photomedonemonth" && (
//                     <Text style={styles.planText}>
//                       • Access to all features for 1 month
//                     </Text>
//                   )}
//                   <Text style={styles.planText}>
//                     • Everything in Standard Plan
//                   </Text>
//                   <Text style={styles.planText}>
//                     • Exclusive Content & Tips
//                   </Text>
//                   {currentSubscription?.productId === plan.productId && (
//                     <Text style={styles.planText}>
//                       Active until{" "}
//                       {new Date(
//                         currentSubscription.expirationDate
//                       ).toLocaleDateString()}
//                     </Text>
//                   )}
//                   <View style={styles.radioWrapper}>
//                     <CustomRadioButton
//                       selected={isSelected}
//                       onPress={() => setSelectedPlan(plan.productId)}
//                     />
//                   </View>
//                 </TouchableOpacity>
//               );
//             })}

//           {subscriptions?.length > 0 && (
//             <>
//               <TouchableOpacity
//                 style={[styles.restoreBtn, isLoading && { opacity: 0.5 }]}
//                 onPress={handlePurchase}
//                 disabled={isLoading}
//               >
//                 <Text style={styles.restoreText}>
//                   {selectedPlan === currentSubscription?.productId &&
//                   currentSubscription?.isExpired === false
//                     ? "Update Plan"
//                     : "Subscribe"}
//                 </Text>
//               </TouchableOpacity>
//               {selectedPlan === currentSubscription?.productId &&
//                 currentSubscription?.isExpired === false && (
//                   <TouchableOpacity
//                     style={[styles.restoreBtn, isLoading && { opacity: 0.5 }]}
//                     onPress={handleCancelPlan}
//                     disabled={isLoading}
//                   >
//                     <Text style={styles.restoreText}>Cancel Plan</Text>
//                   </TouchableOpacity>
//                 )}
//               <TouchableOpacity
//                 style={[styles.restoreBtn, isLoading && { opacity: 0.5 }]}
//                 onPress={restorePurchases}
//                 disabled={isLoading}
//               >
//                 <Text style={styles.restoreText}>Restore Purchases</Text>
//               </TouchableOpacity>
//             </>
//           )}
//           <Text style={{ color: "#000", marginTop: 10 }}>
//             Note: If your payment was deducted but the plan was not activated,
//             click the Restore Button to restore your plan.
//           </Text>

//           <Text
//             style={{
//               textAlign: "center",
//               marginHorizontal: 20,
//               color: "#000",
//               marginTop: 30,
//             }}
//           >
//             Payment will be charged to iTunes Account at confirmation of
//             purchase. Subscription automatically renews unless auto-renew is
//             turned off at least 24-hours before the end of the current period.
//             Account will be charged for renewal within 24-hours prior to the end
//             of the current period, and identify the cost of the renewal.
//             Subscriptions may be managed by the user and auto-renewal may be
//             turned off by going to the user's Account Settings after purchase.
//             No cancellation of the current subscription is allowed during active
//             subscription period. Any unused portion of a free trial period, if
//             offered, will be forfeited when the user purchases a subscription to
//             that publication, where applicable.
//           </Text>

//           <View
//             style={{
//               flexDirection: "row",
//               marginHorizontal: 20,
//               marginTop: 20,
//               marginBottom: 30,
//               justifyContent: "center",
//             }}
//           >
//             <Text
//               onPress={() =>
//                 navigate("Terms and Condition", {
//                   slug: "terms-and-conditions",
//                   screenName: "Terms and Conditions",
//                 })
//               }
//               style={{
//                 color: "#32327C",
//                 marginRight: 10,
//                 textDecorationLine: "underline",
//               }}
//             >
//               Terms of Service
//             </Text>
//             <Text
//               onPress={() =>
//                 navigate("Terms and Condition", {
//                   slug: "privacy-policy",
//                   screenName: "Privacy Policy",
//                 })
//               }
//               style={{
//                 color: "#32327C",
//                 marginLeft: 10,
//                 textDecorationLine: "underline",
//               }}
//             >
//               Privacy Policy
//             </Text>
//           </View>
//         </ScrollView>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   container: {
//     flex: 1,
//     paddingHorizontal: 16,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingVertical: 15,
//   },
//   iconText: {
//     fontSize: 20,
//     fontWeight: "600",
//     color: "#000",
//   },
//   iconTextRight: {
//     fontSize: 20,
//     marginRight: 20,
//     fontWeight: "600",
//     color: "#000",
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//   },
//   scrollContent: {
//     paddingVertical: 10,
//     alignItems: "center",
//   },
//   planCard: {
//     backgroundColor: "#fff",
//     width: "96%",
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 20,
//     marginHorizontal: 10,
//     elevation: 3,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     shadowOffset: { width: 0, height: 2 },
//     position: "relative",
//   },
//   selectedCard: {
//     backgroundColor: "#e0e0f3",
//   },
//   cardHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 12,
//   },
//   planTitle: {
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   planPrice: {
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   planText: {
//     fontSize: 14,
//     color: "#555",
//     marginBottom: 4,
//   },
//   radioWrapper: {
//     position: "absolute",
//     right: 16,
//     bottom: 16,
//   },
//   radioOuter: {
//     height: 20,
//     width: 20,
//     borderRadius: 10,
//     borderWidth: 2,
//     borderColor: "#32327C",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   radioInner: {
//     height: 10,
//     width: 10,
//     borderRadius: 5,
//     backgroundColor: "#32327C",
//   },
//   restoreBtn: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     marginTop: 14,
//     paddingVertical: 12,
//     borderWidth: 1.5,
//     borderColor: "#32327C",
//     borderRadius: 10,
//     width: "96%",
//   },
//   restoreText: {
//     color: "#32327C",
//     fontSize: 16,
//     marginLeft: 8,
//     fontWeight: "600",
//   },
// });
