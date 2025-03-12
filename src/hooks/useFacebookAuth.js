import { useState, useCallback } from 'react';

export function useFacebookAuth() {
    const [fbState, setFbState] = useState({
        isSDKLoaded: false,
        status: 'idle',
        error: null,
        accessToken: null,
    });

    const handleSDKLoad = useCallback((response) => {
        if (response.status === 'connected') {
            setFbState(prev => ({
                ...prev,
                status: 'connected',
                accessToken: response.authResponse.accessToken,
                isSDKLoaded: true
            }));
        } else {
            setFbState(prev => ({
                ...prev,
                status: 'not_connected',
                isSDKLoaded: true
            }));
        }
    }, []);

    const handleSDKError = useCallback((error) => {
        setFbState(prev => ({
            ...prev,
            error,
            isSDKLoaded: false
        }));
    }, []);

    const handleFacebookLogin = useCallback(async () => {
        setFbState(prev => ({ ...prev, error: null, status: 'attempting_login' }));

        if (!fbState.isSDKLoaded || !window.FB) {
            setFbState(prev => ({
                ...prev,
                error: 'Facebook SDK is not loaded yet. Please refresh the page.',
                status: 'error'
            }));
            return;
        }

        try {
            const response = await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error('Facebook login timed out. Please try again.'));
                }, 15000);

                window.FB.login((loginResponse) => {
                    clearTimeout(timeoutId);
                    if (loginResponse.authResponse) {
                        resolve(loginResponse);
                    } else {
                        reject(new Error('Login cancelled or permissions not granted'));
                    }
                }, {
                    scope: 'pages_read_engagement,pages_manage_posts,pages_show_list,instagram_basic,instagram_content_publish',
                    return_scopes: true,
                    enable_profile_selector: true,
                    auth_type: 'rerequest'
                });
            });

            if (response.authResponse) {
                setFbState(prev => ({
                    ...prev,
                    accessToken: response.authResponse.accessToken,
                    status: 'connected',
                    error: null
                }));
            }
        } catch (err) {
            console.error('Facebook login error:', err);
            setFbState(prev => ({
                ...prev,
                error: err.message,
                status: 'error'
            }));
        }
    }, [fbState.isSDKLoaded]);

    return {
        fbState,
        setFbState,
        handleSDKLoad,
        handleSDKError,
        handleFacebookLogin
    };
}