import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Linking, Alert, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import Loading from '../../components/Loading';
import { useSelector } from 'react-redux';
import { useIAP } from '../../configs/IAPContext';
import { goBack } from '../../navigators/NavigationService';
import { getAvailablePurchases, requestSubscription } from 'react-native-iap';

export default function SubscriptionManage() {
  const token = useSelector(state => state.auth.user);
  const userId = useSelector(state => state.auth.userId);
  const { subscriptions, currentSubscription, fetchSubscriptions, checkSubscriptionStatus } = useIAP();
  const [selectedPlan, setSelectedPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  console.log('currentSubscription:-------', currentSubscription);

  useEffect(() => {
    currentSubscription?.productId && setSelectedPlan(currentSubscription.productId);
  }, [currentSubscription]);

  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!token) {
        Alert.alert('Error', 'Authentication token missing. Please log in again.');
        return;
      }
      setIsLoading(true);
      try {
        await fetchSubscriptions();
        await checkSubscriptionStatus();
      } catch (error) {
        console.error('Error loading subscriptions:', error);
        Alert.alert('Error', 'Failed to load subscriptions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    loadSubscriptions();
  }, [token, userId, fetchSubscriptions, checkSubscriptionStatus]);

  const handlePurchase = async () => {
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a plan.');
      return;
    }
    if (!token) {
      Alert.alert('Error', 'Authentication token missing. Please log in again.');
      return;
    }
    setIsLoading(true);
    try {
      await requestSubscription({ sku: selectedPlan });
      Alert.alert('Success', 'Purchase initiated. Awaiting verification.');
    } catch (error) {
      console.error('Purchase failed:', error);
      Alert.alert('Error', 'Failed to initiate purchase. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async () => {
    if (!token) {
      Alert.alert('Error', 'Authentication token missing. Please log in again.');
      return;
    }
    setIsLoading(true);
    try {
      const purchases = await getAvailablePurchases();
      if (purchases.length > 0) {
        const latest = purchases.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))[0];
        const response = await fetch('http://photomedpro.com/api/verify-inapp-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            receipt: latest.transactionReceipt,
            platform: Platform.OS,
            userId,
          }),
        });
        const responseData = await response.json();
        console.log('restorePurchases response:', responseData);
        if (response.ok) {
          await checkSubscriptionStatus();
          Alert.alert('Success', 'Purchases restored successfully.');
        } else {
          console.error('Restore failed:', responseData);
          Alert.alert('Error', 'Failed to restore purchases.');
        }
      } else {
        Alert.alert('Info', 'No purchases found to restore.');
      }
    } catch (error) {
      console.error('Restore failed:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPlan = async () => {
    try {
      const url = Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions';
      await Linking.openURL(url);
      Alert.alert('Info', 'You have been redirected to manage your subscriptions.');
    } catch (error) {
      console.error('Failed to open subscription management:', error);
      Alert.alert('Error', 'Failed to open subscription management.');
    }
  };

  const CustomRadioButton = ({ selected, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.radioOuter}>
      {selected && <View style={styles.radioInner} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Loading visible={isLoading} />
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
            subscriptions.map((plan) => {
              const isSelected = selectedPlan === plan.productId;
              return (
                <TouchableOpacity
                  key={plan.productId}
                  onPress={() => setSelectedPlan(plan.productId)}
                  style={[styles.planCard, isSelected && styles.selectedCard]}
                >
                  <View style={styles.cardHeader}>
                    {plan.productId === 'com.photomedthreemonth' && <Text style={styles.planTitle}>3-Month Premium Plan</Text>}
                    {plan.productId === 'com.photomedyearlyplan' && <Text style={styles.planTitle}>Annual Pro Subscription</Text>}
                    {plan.productId === 'com.photomedonemonth' && <Text style={styles.planTitle}>Monthly Access Plan</Text>}
                    <Text style={styles.planPrice}>{plan.localizedPrice}</Text>
                  </View>
                  {plan.productId === 'com.photomedthreemonth' && <Text style={styles.planText}>• Enjoy full access to all features for 3 months</Text>}
                  {plan.productId === 'com.photomedyearlyplan' && <Text style={styles.planText}>• Full app access for a year at a great value</Text>}
                  {plan.productId === 'com.photomedonemonth' && <Text style={styles.planText}>• Access to all features for 1 month</Text>}
                  <Text style={styles.planText}>• Everything in Standard Plan</Text>
                  <Text style={styles.planText}>• Exclusive Content & Tips</Text>
                  {currentSubscription?.productId === plan.productId && (
                    <Text style={styles.planText}>
                      Active until {new Date(currentSubscription.expirationDate).toLocaleDateString()}
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
              <TouchableOpacity style={styles.restoreBtn} onPress={handlePurchase}>
                <Text style={styles.restoreText}>
                  {selectedPlan === currentSubscription?.productId ? 'Update Plan' : 'Subscribe'}
                </Text>
              </TouchableOpacity>
              {selectedPlan === currentSubscription?.productId && currentSubscription?.isExpired === false && (
                <TouchableOpacity style={styles.restoreBtn} onPress={handleCancelPlan}>
                  <Text style={styles.restoreText}>Cancel Plan</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.restoreBtn} onPress={restorePurchases}>
                <Text style={styles.restoreText}>Restore Purchases</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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