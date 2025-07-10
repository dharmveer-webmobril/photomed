import { AppState } from 'react-native';
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { setAccessToken } from '../redux/slices/authSlice'; 
import { getData, storeData, removeData } from './helperFunction'; 
import {checkAndRefreshGoogleAccessToken, configUrl} from './api'

// const TOKEN_LIFESPAN =  1000; // Example: 1 hour in milliseconds
const TOKEN_LIFESPAN = 3600 * 1000; // Example: 1 hour in milliseconds

const useTokenManagement = (provider, accessToken) => {
    const dispatch = useDispatch();
    const appState = useRef(AppState.currentState);
    const isRefreshing = useRef(false); // Guard to prevent multiple refresh calls

    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => {
            subscription.remove(); // Cleanup the listener
        };
    }, [provider, accessToken]);

    const handleAppStateChange = async (nextAppState) => {
        if (
            appState.current.match(/inactive|background/) &&
            nextAppState === 'active'
        ) {
            // App comes to the foreground
            if (provider === 'google') {
                await ensureGoogleToken();
            } else if (provider === 'dropbox') {
                await ensureDropboxToken();
            }
        }
        appState.current = nextAppState;
    };

    const ensureGoogleToken = async () => {
        if (isRefreshing.current) return; // Exit if already refreshing
        isRefreshing.current = true;
        try {
            const validToken = await checkAndRefreshGoogleAccessToken(accessToken);
            // console.log('validTokenvalidToken',validToken);
            dispatch(setAccessToken(validToken)); // Update Redux store
        } catch (error) {
            console.error('Error ensuring Google token:', error);
        } finally {
            isRefreshing.current = false; // Reset refreshing guard
        }
    };

   

    const ensureDropboxToken = async () => {
        console.log('drop called');
        
        if (isRefreshing.current) return; // Exit if already refreshing
        isRefreshing.current = true;

        try {
            const validToken = await checkAndRefreshDropboxToken();
            dispatch(setAccessToken(validToken)); // Update Redux store
        } catch (error) {
            console.error('Error ensuring Dropbox token:', error);
        } finally {
            isRefreshing.current = false; // Reset refreshing guard
        }
    };

    const checkAndRefreshDropboxToken = async () => {
        try {
            const tokenExpiry = await getData('token_expiry');
            const refreshToken = await getData('refresh_token'); // Assuming you store it

            if (!accessToken || !tokenExpiry || Date.now() >= tokenExpiry) {
                console.log('Refreshing Dropbox access token...');
                if (!refreshToken) {
                    throw new Error('No Dropbox refresh token available.');
                }

                const { access_token, expires_in } = await refreshDropboxAccessToken(refreshToken);
                const expiryTime = Date.now() + expires_in * 1000;

                await storeData('token_expiry', expiryTime);
                return access_token; // Return new token
            }
            // console.log('drop called accessToken',accessToken);
            return accessToken; // Return the existing valid token
        } catch (error) {
            console.error('Error checking or refreshing Dropbox token:', error);
            throw error;
        }
    };

    const refreshDropboxAccessToken = async (refreshToken) => {
        if (!refreshToken) {
            throw new Error('No refresh token found');
        }

        const tokenUrl = 'https://api.dropboxapi.com/oauth2/token';
        const params = new URLSearchParams({
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
            client_id: configUrl.DROPBOX_CLIENT_ID,
            client_secret: configUrl.DROPBOX_CLIENT_SECRET,
        });

        try {
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString(),
            });

            const data = await response.json();

            if (response.ok) {
                const { access_token, expires_in } = data;
                return { access_token, expires_in };
            } else {
                console.error('Dropbox token refresh error:', data);
                throw new Error(data.error_description || 'Failed to refresh Dropbox token');
            }
        } catch (error) {
            console.error('Error refreshing Dropbox token:', error);
            throw error;
        }
    };
};

export default useTokenManagement;
