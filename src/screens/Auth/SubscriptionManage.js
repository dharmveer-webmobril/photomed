import { getActiveSubscriptions, getAvailablePurchases, requestPurchase, useIAP } from 'react-native-iap';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import Loading from "../../components/Loading";
import { useDispatch, useSelector } from "react-redux";
import { useIAP1 } from "../../configs/IAPContext";
import { goBack } from "../../navigators/NavigationService";

const CustomRadioButton = ({ selected, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.radioOuter}>
    {selected && <View style={styles.radioInner} />}
  </TouchableOpacity>
);
const skus = [
  'com.photomedthreemonth1',
  'com.photomedonemonth1',
  'com.photomedyearlyplan1',
];

export default function SubscriptionManage(params) {
  const [selectedPlan, setSelectedPlan] = useState("");
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const from = params?.page || "asd";
  const token = useSelector((state) => state.auth.user);
  const userId = useSelector((state) => state.auth.userId);
  const [purchaseResult, setPurchaseResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPurchase, setLastPurchase] = useState(null);
  const [storefront, setStorefront] = useState(null);
  const [fetchingStorefront, setFetchingStorefront] = useState(false);



  function getGoogleAuthToken(token) {
    return new Promise((resolve, reject) => {
      // Early validation
      if (!token || typeof token !== 'string') {
        reject(new Error('Valid token is required'));
        return;
      }

      fetch("http://192.168.1.29:10049/api/get-google-auth-token", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        }
      }).then(response => {
        // Check HTTP status
        if (!response.ok) {
          // Try to read error message from body
          return response.text().then(text => {
            throw new Error('API returned failure response');
          });
        }
        return response.json();
      })
        .then(data => {
          if (data && (data?.error || data?.status === 'error')) {
            reject(new Error(data?.error || data?.message || 'API returned failure response'));
            return;
          }
          resolve(data);
        })
        .catch(error => {
          const wrappedError = new Error(
            `Failed to get Google auth token: ${error?.message}`
          );

          reject(wrappedError);
        });
    });
  }

  const {
    connected,
    subscriptions,
    fetchProducts,
    finishTransaction,
    verifyPurchase,
    verifyPurchaseWithProvider,
  } =
    useIAP({
      // ────────────────────────────────────────────────────────────────────────
      // Step 2a: Purchase Success Handler
      // ────────────────────────────────────────────────────────────────────────
      // onPurchaseSuccess: async (purchase) => {
      //   const { purchaseToken: tokenToMask, ...rest } = purchase;

      //   console.log('Purchase successful purchase:', JSON.stringify(purchase, null, 2));
      //   console.log('[PurchaseFlow] purchaseState:', purchase.purchaseState);
      //   setLastPurchase(purchase);
      //   setIsProcessing(false);

      //   setPurchaseResult(
      //     `Purchase completed successfully (state: ${purchase.purchaseState}).`,
      //   );
      //   const productId = purchase.productId ?? '';
      //   // const googleAuthToken = await getGoogleAuthToken(token);
      //   // console.log('googleAuthToken--------', googleAuthToken);
      //   console.log('productId--------', productId);


      //   if (purchase) {
      //     const responseData = await verifyWithBackend(purchase);
      //     console.log('responseData--------', responseData);
      //   }

      //   try {
      //     await finishTransaction({
      //       purchase,
      //       isConsumable: false,
      //     });
      //   } catch (error) {
      //     console.warn('[PurchaseFlow] finishTransaction failed:', error);
      //   }

      //   Alert.alert('Success', 'Purchase completed successfully!');
      // },

      // // ────────────────────────────────────────────────────────────────────────
      // // Step 2b: Purchase Error Handler
      // // ────────────────────────────────────────────────────────────────────────
      // onPurchaseError: (error) => {
      //   console.error('Purchase failed:', error);
      //   console.error('Error code:', error.code);
      //   console.error(
      //     'Is user cancelled:',
      //     error.code === 'UserCancelled',
      //   );

      //   setIsProcessing(false);

      // },
    });


  async function verifyWithBackend(purchase) {
    console.log('purchase--------verifyWithBackend--------', purchase);
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
        receipt: purchase.purchaseToken,
        platform: Platform.OS,
        transactionId: purchase.originalTransactionIdentifierIOS,
        userId,
      });
    }

    console.log("Purchase verification body:", bodyData);
    const response = await fetch(
      "http://192.168.1.29:10049/api/verify-inapp-receipt-new",
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
    return responseData;
  }

  const getActiveSubscriptions1 = async () => {
    const activeSubs = await getAvailablePurchases();
    // const activeSubs = await getActiveSubscriptions();
    console.log('\n===== Active Subscriptions Check =====');
    console.log('Total subscriptions:', activeSubs.length);
    console.log('Full data:', JSON.stringify(activeSubs, null, 2));


    // verify-inapp-receipt-new

    // Verify purchase with backend

    if (activeSubs.length <= 0) return;
    let bodyData = JSON.stringify({
      receipt: activeSubs[0].purchaseToken,
      platform: Platform.OS,
      transactionId: activeSubs[0].transactionId,
      userId,
    });

    console.log('bodyData--------', bodyData);
    const response = await fetch(
      "http://192.168.1.29:10049/api/verify-inapp-receipt-new",
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
  }

  useEffect(() => {
    getActiveSubscriptions1();
  }, []);


  // 🔹 Fetch products once connected
  useEffect(() => {
    if (!connected) return;
    fetchProducts({ skus, type: 'subs' })
      .then(() => {
        console.log('fetchProducts called');
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  // 🔹 React to subscriptions update
  useEffect(() => {
    console.log('UPDATED subscriptions:', JSON.stringify(subscriptions, null, 2));
  }, [subscriptions]);

  const handleSubscription = useCallback(
    (itemId) => {
      setIsProcessing(true);
      setPurchaseResult('Processing subscription...');

      const subscription = subscriptions.find((sub) => sub.id === itemId);

      requestPurchase({
        request: {
          ios: {
            sku: itemId,
            appAccountToken: userId,
          },
          android: {
            skus: [itemId],
            subscriptionOffers:
              subscription &&
                'subscriptionOfferDetailsAndroid' in subscription &&
                (subscription)
                  .subscriptionOfferDetailsAndroid
                ? (
                  subscription
                ).subscriptionOfferDetailsAndroid.map((offer) => ({
                  sku: itemId,
                  offerToken: offer.offerToken,
                }))
                : [],
          },
        },
        type: 'subs',
      }).then(async (purchase) => {
        getActiveSubscriptions1();
      }).catch((err) => {
        console.warn('requestPurchase failed:', err);
        setIsProcessing(false);
        setPurchaseResult(`❌ Subscription failed: ${err.message}`);
        Alert.alert('Subscription Failed', err.message);
      });
      
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subscriptions, userId],
  );

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
  return (
    <SafeAreaView style={{ flex: 1 }}>
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
        {subscriptions?.length > 0 &&
          subscriptions.map((plan) => {
            const isSelected = selectedPlan === plan.id;

            const androidPrice =
              plan.subscriptionOfferDetails?.[0]?.pricingPhases
                ?.pricingPhaseList?.[0]?.formattedPrice || "N/A";

            return (
              <TouchableOpacity
                key={plan.id}
                // onPress={() => setSelectedPlan(plan.id)}
                onPress={() => handleSubscription(plan.id)}
                style={[styles.planCard, isSelected && styles.selectedCard]}
              >
                <View style={styles.cardHeader}>
                  {plan.id === "com.photomedthreemonth1" && (
                    <Text style={styles.planTitle}>3-Month Premium Plan</Text>
                  )}
                  {plan.id === "com.photomedyearlyplan1" && (
                    <Text style={styles.planTitle}>
                      Annual Pro Subscription
                    </Text>
                  )}
                  {plan.id === "com.photomedonemonth1" && (
                    <Text style={styles.planTitle}>Monthly Access Plan</Text>
                  )}
                  <Text style={styles.planPrice}>
                    {Platform.OS === "android"
                      ? androidPrice
                      : plan?.localizedPrice}
                  </Text>
                </View>
                {plan.id === "com.photomedthreemonth1" && (
                  <Text style={styles.planText}>
                    • Enjoy full access to all features for 3 months
                  </Text>
                )}
                {plan.id === "com.photomedyearlyplan1" && (
                  <Text style={styles.planText}>
                    • Full app access for a year at a great value
                  </Text>
                )}
                {plan.id === "com.photomedonemonth1" && (
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
                {currentSubscription?.planId === plan.id && (
                  <Text style={styles.planText}>
                    Active until{" "}
                    {currentSubscription?.expirationDate && new Date(
                      currentSubscription?.expirationDate
                    ).toLocaleDateString()}
                  </Text>
                )}
                <View style={styles.radioWrapper}>
                  <CustomRadioButton
                    selected={isSelected}
                    onPress={() => setSelectedPlan(plan?.id)}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
      </ScrollView>
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