import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  Linking,
} from "react-native";
import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import { useDispatch, useSelector } from "react-redux";
import { goBack, navigate } from "../../navigators/NavigationService";
import {
  initConnection,
  getSubscriptions,
  requestSubscription,
  getAvailablePurchases,
  acknowledgePurchaseAndroid,
  finishTransaction,
  endConnection,
} from "react-native-iap";
import { getMySubscriptionDetails } from "../../configs/api";
import { updateSubscription } from "../../redux/slices/authSlice";

const SKUS = [
  "com.photomedthreemonth1",
  "com.photomedonemonth1",
  "com.photomedyearlyplan1",
];

const PLAN_PRIORITY = {
  "com.photomedonemonth1": 1,
  "com.photomedthreemonth1": 2,
  "com.photomedyearlyplan1": 3, // highest
};

export default function SubscriptionManage(params) {
  const token = useSelector((state) => state.auth.user);
  const userId = useSelector((state) => state.auth.userId);
  const dispatch = useDispatch();

  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [isGetSubLoading, setIsGetSubLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const from = params?.page || "asd";

  // Initialize IAP connection and fetch subscriptions
  useEffect(() => {
    const initializeIAP = async () => {
      try {
        setIsLoading(true);
        await initConnection();
        setIsConnected(true);
        
        // Fetch available subscriptions
        const products = await getSubscriptions({ skus: SKUS });
        console.log("Subscriptions fetched:", JSON.stringify(products, null, 2));
        setSubscriptions(products);
        
        // Set default selected plan if subscriptions available
        if (products.length > 0 && !selectedPlan) {
          setSelectedPlan(products[0].productId);
        }
      } catch (error) {
        console.error("Error initializing IAP:", error);
        Alert.alert("Error", "Failed to initialize subscription service. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeIAP();

    // Cleanup on unmount
    return () => {
      if (isConnected) {
        endConnection();
      }
    };
  }, []);

  // Fetch current subscription from backend
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!token || !userId) return;
      
      setIsGetSubLoading(true);
      try {
        const data = await getMySubscriptionDetails(token, userId);
        if (data) {
          setCurrentSubscription(data);
          if (data.productId) {
            setSelectedPlan(data.productId);
          }
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setIsGetSubLoading(false);
      }
    };

    fetchSubscription();
  }, [token, userId]);

  // Set selected plan when current subscription changes
  useEffect(() => {
    if (currentSubscription?.productId) {
      setSelectedPlan(currentSubscription.productId);
    }
  }, [currentSubscription]);

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
    console.log('token--', token, 'developerPayload--', developerPayload, 'purchase', purchase);

    try {
      await acknowledgePurchaseAndroid({ token: token, developerPayload });
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
              offerToken: offerDetails?.offerToken || undefined,
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

  const onPress = async () => {
    try {
      const supported = await Linking.canOpenURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
      if (!supported) {
        Alert.alert('Cannot open link', 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
        return;
      }
      await Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
    } catch (err) {
      console.error('Failed to open URL:', err);
      Alert.alert('Error', 'Unable to open link at the moment.');
    }
  };

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
                    {plan.productId === "com.photomedthreemonth1" && (
                      <Text style={styles.planTitle}>3-Month Premium Plan</Text>
                    )}
                    {plan.productId === "com.photomedyearlyplan1" && (
                      <Text style={styles.planTitle}>
                        Annual Pro Subscription
                      </Text>
                    )}
                    {plan.productId === "com.photomedonemonth1" && (
                      <Text style={styles.planTitle}>Monthly Access Plan</Text>
                    )}
                    <Text style={styles.planPrice}>
                      {Platform.OS === "android"
                        ? androidPrice
                        : plan.localizedPrice}
                    </Text>
                  </View>
                  {plan.productId === "com.photomedthreemonth1" && (
                    <Text style={styles.planText}>
                      • Enjoy full access to all features for 3 months
                    </Text>
                  )}
                  {plan.productId === "com.photomedyearlyplan1" && (
                    <Text style={styles.planText}>
                      • Full app access for a year at a great value
                    </Text>
                  )}
                  {plan.productId === "com.photomedonemonth1" && (
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
          {
            !isLoading && !isGetSubLoading && subscriptions?.length <= 0 &&
            <Text
              style={{
                color: "#32327C",
                textAlign: "center",
                fontSize: 14,
                marginVertical: 50
              }}
            >
              Subscriptions not found
            </Text>
          }
          {
            <>
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
                  onPress={() => onPress()}
                  style={{
                    color: "#32327C",
                    marginRight: 10,
                    textDecorationLine: "underline",
                  }}
                >
                  Terms of Use (EULA)
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
            </>
          }

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
