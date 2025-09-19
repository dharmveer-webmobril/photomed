import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
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
// import { useRoute } from "@react-navigation/native";

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
        // await checkSubscriptionStatus();
      } catch (error) {
        console.error("Error loading subscriptions:", error);
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
    } catch (err) {
      console.warn("Finish transaction error:", err);
    }
  };

  const acknowledgePurchaseAndroid1 = async (
    token,
    developerPayload,
    purchase
  ) => {
    try {
      await acknowledgePurchaseAndroid({ token, developerPayload });
      await finishTransaction(purchase);
    } catch (err) {
      console.warn("Acknowledge purchase error:", err);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlan) {
      Alert.alert("Error", "Please select a plan.");
      return;
    }
    if (!token) {
      Alert.alert(
        "Error",
        "Authentication token missing. Please log in again."
      );
      return;
    }

    setIsLoading(true);
    try {
      // Start purchase
      const purchase = await requestSubscription({ sku: selectedPlan });

      if (purchase?.transactionReceipt) {
        // Verify with backend
        const response = await fetch(
          "https://photomedpro.com:10049/api/verify-inapp-receipt",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              receipt: purchase.transactionReceipt,
              platform: Platform.OS,
              transactionId: purchase.transactionId,
              userId,
            }),
          }
        );

        const responseData = await response.json();
        console.log("verify-inapp-receipt response:", responseData);

        if (response.ok && responseData.success) {
          let expData = {
            expirationDate: responseData?.expirationDate,
            hasSubscription: true,
            isActive: responseData?.isActive,
            isExpired: responseData?.isExpired,
            productId: responseData?.productId || purchase.productId,
            success: responseData?.success,
            transactionId:
              responseData?.transactionId || purchase.transactionId,
          };

          console.log("expData--------", expData);

          // update local state
          setCurrentSubscription(expData);

          // update redux
          dispatch(updateSubscription(expData));

          // Acknowledge purchase

          if (Platform.OS === "ios") {
            await finishTransaction1(purchase);
          } else {
            await acknowledgePurchaseAndroid1(
              purchase.purchaseToken,
              purchase.developerPayloadAndroid,
              purchase
            );
          }
          Alert.alert("Success", "Purchase verified and activated!");
        } else {
          Alert.alert("Error", "Purchase verification failed.");
        }
      } else {
        Alert.alert("Error", "Purchase failed. No receipt received.");
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      Alert.alert("Error", "Failed to complete purchase. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async () => {
    if (!token) {
      Alert.alert(
        "Error",
        "Authentication token missing. Please log in again."
      );
      return;
    }
    setIsLoading(true);
    try {
      const purchases = await getAvailablePurchases();
      if (purchases.length > 0) {
        const latest = purchases.sort(
          (a, b) => new Date(b.transactionDate) - new Date(a.transactionDate)
        )[0];
        const response = await fetch(
          "https://photomedpro.com:10049/api/verify-inapp-receipt",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              receipt: latest.transactionReceipt,
              platform: Platform.OS,
              userId,
            }),
          }
        );
        const responseData = await response.json();
        console.log("restorePurchases response:", responseData);
        if (response.ok) {
          await checkSubscriptionStatus();
          Alert.alert("Success", "Purchases restored successfully.");
        } else {
          console.error("Restore failed:", responseData);
          Alert.alert("Error", "Failed to restore purchases.");
        }
      } else {
        Alert.alert("Info", "No purchases found to restore.");
      }
    } catch (error) {
      console.error("Restore failed:", error);
      Alert.alert("Error", "Failed to restore purchases. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

 const handleCancelPlan = async () => {
  try {
    const url =
      Platform.OS === "ios"
        ? "itms-apps://apps.apple.com/account/subscriptions"
        : "https://play.google.com/store/account/subscriptions?package=com.photomedPro.com";
        
    await Linking.openURL(url);
    Alert.alert(
      "Info",
      "You have been redirected to manage your subscriptions."
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
              from == "profile" && goBack();
            }}
          >
            {from == "profile" && <Text style={styles.iconText}>←</Text>}
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
                    <Text style={styles.planPrice}>{plan.localizedPrice}</Text>
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
                    ? "Update Plan"
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
  },
  planPrice: {
    fontSize: 16,
    fontWeight: "600",
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
