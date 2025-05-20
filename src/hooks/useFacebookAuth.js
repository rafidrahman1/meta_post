import { useState, useCallback } from 'react';

export function useFacebookAuth() {
    const [fbState, setFbState] = useState({
        isSDKLoaded: false,
        status: 'idle',
        error: null,
        accessToken: null,
        retryCount: 0,
        loginRetryCount: 0
    });

    const handleSDKLoad = useCallback((response) => {
        if (response.status === 'connected') {
            setFbState(prev => ({
                ...prev,
                status: 'connected',
                accessToken: response.authResponse.accessToken,
                isSDKLoaded: true,
                error: null,
                retryCount: 0,
                loginRetryCount: 0
            }));
        } else {
            setFbState(prev => ({
                ...prev,
                status: 'not_connected',
                isSDKLoaded: true,
                error: null,
                retryCount: 0,
                loginRetryCount: 0
            }));
        }
    }, []);

    const handleSDKError = useCallback((error) => {
        setFbState(prev => ({
            ...prev,
            error,
            isSDKLoaded: false,
            status: 'error',
            retryCount: prev.retryCount + 1
        }));

        // Auto-retry loading the SDK if we haven't tried too many times
        if (fbState.retryCount < 3) {
            setTimeout(() => {
                window.location.reload();
            }, 2000 * (fbState.retryCount + 1)); // Exponential backoff
        }
    }, [fbState.retryCount]);

    const handleFacebookLogin = useCallback(async () => {
        setFbState(prev => ({ 
            ...prev, 
            error: null, 
            status: 'attempting_login',
            loginRetryCount: prev.loginRetryCount + 1
        }));

        if (!fbState.isSDKLoaded || !window.FB) {
            setFbState(prev => ({
                ...prev,
                error: 'Facebook SDK is not loaded yet. Please refresh the page.',
                status: 'error'
            }));
            return;
        }

        // Don't retry more than 3 times
        if (fbState.loginRetryCount > 3) {
            setFbState(prev => ({
                ...prev,
                error: 'Too many failed login attempts. Please refresh the page and try again.',
                status: 'error'
            }));
            return;
        }

        try {
            const response = await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error('Facebook login timed out. Please try again.'));
                }, 15000);

                // Add error handling for network issues
                const handleLoginError = (error) => {
                    clearTimeout(timeoutId);
                    if (error && error.message && error.message.includes('NetworkError')) {
                        reject(new Error('Network error occurred. Please check your internet connection and try again.'));
                    } else {
                        reject(error);
                    }
                };

                try {
                    window.FB.login((loginResponse) => {
                        clearTimeout(timeoutId);
                        if (loginResponse.authResponse) {
                            resolve(loginResponse);
                        } else if (loginResponse.status === 'not_authorized') {
                            reject(new Error('Login was not authorized. Please try again.'));
                        } else {
                            reject(new Error('Login cancelled or permissions not granted'));
                        }
                    }, {
                        scope: 'pages_read_engagement,pages_manage_posts,pages_show_list,instagram_basic,instagram_content_publish',
                        return_scopes: true,
                        enable_profile_selector: true,
                        auth_type: 'rerequest'
                    });
                } catch (err) {
                    handleLoginError(err);
                }
            });

            if (response.authResponse) {
                setFbState(prev => ({
                    ...prev,
                    accessToken: response.authResponse.accessToken,
                    status: 'connected',
                    error: null,
                    retryCount: 0,
                    loginRetryCount: 0
                }));
            }
        } catch (err) {
            console.error('Facebook login error:', err);
            
            // Handle network errors specifically
            if (err.message && err.message.includes('NetworkError')) {
                setFbState(prev => ({
                    ...prev,
                    error: 'Network error occurred. Please check your internet connection and try again.',
                    status: 'error'
                }));
            } else {
                setFbState(prev => ({
                    ...prev,
                    error: err.message,
                    status: 'error'
                }));
            }

            // Auto-retry on network errors if we haven't exceeded retry limit
            if (err.message && err.message.includes('NetworkError') && fbState.loginRetryCount < 3) {
                setTimeout(() => {
                    handleFacebookLogin();
                }, 2000 * fbState.loginRetryCount); // Exponential backoff
            }
        }
    }, [fbState.isSDKLoaded, fbState.loginRetryCount]);

    return {
        fbState,
        setFbState,
        handleSDKLoad,
        handleSDKError,
        handleFacebookLogin
    };
}