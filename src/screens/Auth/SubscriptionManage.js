import React, { Component } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { connect } from 'react-redux';
import { getUserPlans, addSubscriptions, validateReceiptData, validateSubscription1, validateSubscription } from '../../configs/api';
import Loading from '../../components/Loading';
import { goBack, navigate } from '../../navigators/NavigationService';

import {
  initConnection,
  endConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  flushFailedPurchasesCachedAsPendingAndroid,
  acknowledgePurchaseAndroid,
  finishTransaction,
  requestSubscription,
  getSubscriptions,
} from 'react-native-iap';
import ScreenName from '../../configs/screenName';
const itemSkus = Platform.select({
  ios: ['quarterlysubscription_20', 'yearly_subscription_photomed', 'monthly_plan_photomed'],
  android: ['com.photomedPro.com'],
});

class SubscriptionManage extends Component {

  constructor(props) {
    super(props)
    this.state = {
      subscriptions: [],
      selectedPlan: null,
      userSubscription: null,
      loading: false,
      loadingUserSub: false,
      apiStatus: false,
      processedTransactions: new Set(),
    };
  }



  async componentDidMount() {


    this.props.navigation.addListener('focus', () => {
      this.fetchUserSubscription();
      this.initializeIap();
    })

    await initConnection()
      .then(() => {
        if (Platform.OS == 'android') {
          flushFailedPurchasesCachedAsPendingAndroid();
        } else {
          /**
           * WARNING This line should not be included in production code
           * This call will call finishTransaction in all pending purchases
           * on every launch, effectively consuming purchases that you might
           * not have verified the receipt or given the consumer their product
           *
           * TL;DR you will no longer receive any updates from Apple on
           * every launch for pending purchases
           */
          //  clearTransactionIOS()
          //  .catch(()=>{
          //      console.log('75dfddf')
          //  })
        }
      }).then(() => {
        this.purchaseUpdateSubscription = purchaseUpdatedListener(
          async (purchase) => {
            try {
              console.log('Processing purchase:', purchase);
              console.log('apistatus:', this.state.apiStatus);

              const receipt = purchase.transactionReceipt
                ? purchase.transactionReceipt
                : JSON.stringify({
                  purchaseToken: purchase.purchaseToken,
                  productId: purchase.productId,
                  packageName: 'com.photoMedPro.com',
                });

              if (this.state.apiStatus) {
                  await this.addSubscriptionToBackend(purchase);
                  this.setState({ apiStatus: false })
              }

              if (Platform.OS === 'ios') {
                await this.finishTransaction(purchase);
              } else {
                await this.acknowledgePurchaseAndroid(purchase.purchaseToken, purchase.developerPayloadAndroid, purchase);
              }
              this.setState({ loading: false });
            } catch (err) {
              this.setState({ loading: false, apiStatus: false });
              console.warn('Purchase processing error:', err);
              Alert.alert('Error', 'Failed to process purchase.');
            }
          },
        );

        this.purchaseErrorSubscription = purchaseErrorListener(
          (error) => {
            this.setState({ loading: false });
            console.log('purchaseErrorListener', error);
          },
        );
      });
  }


  componentWillUnmount() {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }

    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }
    // ...
    endConnection();
  }


  initializeIap = async () => {
    try {
      this.setState({ loading: true });
      await initConnection();
      const subs = await getSubscriptions({ skus: itemSkus });
      // console.log('Available subscriptions:', subs);

      this.setState({ subscriptions: subs, loading: false });
    } catch (err) {
      Alert.alert('Error', 'Failed to initialize in-app purchases.');
    } finally {
      this.setState({ loading: false });
    }
  };

  finishTransaction = async (purchase) => {
    try {
      await finishTransaction({ purchase, isConsumable: false });
    } catch (err) {
      console.warn('Finish transaction error:', err);
    }
  };

  acknowledgePurchaseAndroid = async (token, developerPayload, purchase) => {
    try {
      await acknowledgePurchaseAndroid({ token, developerPayload });
      await this.finishTransaction(purchase);
    } catch (err) {
      console.warn('Acknowledge purchase error:', err);
    }
  };

  fetchUserSubscription = async () => {
    try {
      this.setState({ loadingUserSub: true });
      let userSub = await validateSubscription(this.props.route.params.token);
      if (userSub?.ResponseBody?.receiptData) {
        if (userSub && userSub?.succeeded) {
          this.setState({
            userSubscription: userSub?.ResponseBody,
            selectedPlan: userSub?.ResponseBody?.productId,
          });
        }
      }
    } catch (err) {
      console.log('Error', 'Failed to fetch subscription details.', err);
      Alert.alert('Error', 'Failed to fetch subscription details.');
    } finally {
      this.setState({ loadingUserSub: false });
    }


    //   const { token } = this.props;
    //   try {
    //     this.setState({ loadingUserSub: true });
    //     const userSub = await getUserPlans(token);



    //     const responseBody = userSub?.ResponseBody;
    //     if (responseBody?.receiptData) {
    //       const validReceipt1 = await validateSubscription1(this.props.route.params.token, responseBody.receiptData, responseBody.platform);
    //       console.log('validReceipt1validReceipt1-', validReceipt1);
    //       if (validReceipt1 && validReceipt1?.succeeded) {
    //          this.setState({
    //           userSubscription: validReceipt1?.ResponseBody,
    //           selectedPlan: validReceipt1?.ResponseBody?.productId,
    //         });
    //       }
    //       // const validReceipt = await validateReceiptData(responseBody.receiptData, responseBody.platform);
    //       // if (validReceipt) {
    //       //   this.setState({
    //       //     userSubscription: validReceipt,
    //       //     selectedPlan: validReceipt.productId,
    //       //   });
    //       // }
    //     }
    //   } catch (err) {
    //     console.log('Error', 'Failed to fetch subscription details.', err);
    //     Alert.alert('Error', 'Failed to fetch subscription details.');
    //   } finally {
    //     this.setState({ loadingUserSub: false });
    //   }
    // };


  };


  handleSubscription = async () => {
    const { selectedPlan } = this.state;
    const { userId } = this.props;
    if (!selectedPlan) return Alert.alert('Error', 'Select a plan before proceeding.');
    if (!userId) return Alert.alert('Error', 'Please log in to continue.');

    try {
      this.setState({ loading: true });
      await requestSubscription({ sku: selectedPlan });
    } catch (err) {
      Alert.alert('Purchase Error', err.message);
      this.setState({ apiStatus: false });
    }
  }


  handleCancelSubscription = async () => {
    const { selectedPlan } = this.state;
    const url =
      Platform.OS === 'android'
        ? `https://play.google.com/store/account/subscriptions?sku=${selectedPlan}&package=com.photomedPro.com`
        : 'https://apps.apple.com/account/subscriptions';

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
      else Alert.alert('Error', 'Unable to open subscription settings.');
    } catch (err) {
      Alert.alert('Error', 'Failed to open subscription settings.');
    }
  };


  addSubscriptionToBackend = async (purchase) => {
    const { token } = this.props;
    try {
      const data = {
        transactionId: purchase.transactionId,
        planeType: purchase.productId,
        transactionDate: purchase.transactionDate,
        startDate: purchase.transactionDate,
        endDate:  purchase.transactionDate,
        platform: Platform.OS,
        receiptData: Platform.OS === 'ios' ? purchase.transactionReceipt : purchase.purchaseToken,
        status: 1,
      };
      this.setState({ loading: true })
      await addSubscriptions(token, data);
      await this.fetchUserSubscription();
      this.setState({ apiStatus: false, loading: false });
      Alert.alert('Success', 'Subscription added successfully.');
      navigate(ScreenName.HOME)
    } catch (err) {
      Alert.alert('Error', 'Failed to save subscription to backend.');
    } finally {
      this.setState({ apiStatus: false, loading: false });
    }
  };



  CustomRadioButton = ({ selected, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.radioOuter}>
      {selected && <View style={styles.radioInner} />}
    </TouchableOpacity>
  );

  render() {
    const {
      subscriptions,
      selectedPlan,
      userSubscription,
      loading,
      loadingUserSub,
    } = this.state;

    return (
      <SafeAreaView style={styles.safeArea}>
        <Loading visible={loading || loadingUserSub} />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => goBack()}>
              <Text style={styles.iconText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Manage Subscription Plan</Text>
            <View />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {subscriptions?.length > 0 &&
              subscriptions.map((plan, index) => {
                const isSelected = selectedPlan === plan.productId;
                return (
                  <TouchableOpacity
                    key={plan.productId}
                    onPress={() => this.setState({ selectedPlan: plan.productId })}
                    style={[styles.planCard, isSelected && styles.selectedCard]}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={styles.planTitle}>{plan.title}</Text>
                      <Text style={styles.planPrice}>{plan.localizedPrice}</Text>
                    </View>
                    <Text style={styles.planText}>• {plan.description}</Text>
                    <Text style={styles.planText}>• Everything in Standard Plan</Text>
                    <Text style={styles.planText}>• Exclusive Content & Tips</Text>
                    <View style={styles.radioWrapper}>
                      <this.CustomRadioButton
                        selected={isSelected}
                        onPress={() => this.setState({ selectedPlan: plan.productId })}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}

            {subscriptions?.length > 0 && (
              <>
                {userSubscription?.productId &&
                  userSubscription?.productId === selectedPlan &&
                  userSubscription?.isExpired === 'no' && (
                    <TouchableOpacity onPress={() => { this.setState({ apiStatus: true }, () => { this.handleCancelSubscription() }) }} style={styles.restoreBtn}>
                      <Text style={styles.restoreText}>Cancel Plan</Text>
                    </TouchableOpacity>
                  )}

                {(userSubscription?.productId !== selectedPlan ||
                  userSubscription?.isExpired === 'yes' ||
                  !userSubscription?.productId) && (
                    <TouchableOpacity onPress={() => { this.setState({ apiStatus: true }, () => { this.handleSubscription() }) }} style={styles.restoreBtn}>
                      <Text style={styles.restoreText}>
                        {userSubscription?.productId ? 'Upgrade Plan' : 'Buy Plan'}
                      </Text>
                    </TouchableOpacity>
                  )}
              </>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }
}

const mapStateToProps = (state) => ({
  userId: state.auth?.userId,
  token: state.auth?.user,
});

export default connect(mapStateToProps)(SubscriptionManage);

const styles = StyleSheet.create({
  // [Same styles from your original functional component]
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  iconText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  planCard: {
    backgroundColor: '#fff',
    width: '96%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    position: 'relative',
  },
  selectedCard: {
    backgroundColor: '#e0e0f3',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  planText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  radioWrapper: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#32327C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#32327C',
  },
  restoreBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#32327C',
    borderRadius: 10,
    width: '96%',
  },
  restoreText: {
    color: '#32327C',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
});
