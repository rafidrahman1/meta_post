import { useEffect } from 'react';

const FB_CONFIG = {
    appId: '601346582722405',
    version: 'v18.0',
    scope: 'pages_read_engagement,pages_manage_posts,pages_show_list',
};

export function FacebookSDKLoader({ onSDKLoad, onError }) {
    useEffect(() => {
        const loadFacebookSDK = () => {
            // Clear any existing FB instance
            if (window.FB) {
                delete window.FB;
            }

            // Clear any existing fbAsyncInit
            if (window.fbAsyncInit) {
                delete window.fbAsyncInit;
            }

            window.fbAsyncInit = function() {
                try {
                    window.FB.init({
                        appId: FB_CONFIG.appId,
                        cookie: true,
                        xfbml: true,
                        version: FB_CONFIG.version,
                        status: true
                    });

                    if (!window.FB) {
                        onError('Facebook SDK failed to initialize properly');
                        return;
                    }

                    window.FB.getLoginStatus(function(response) {
                        if (response) {
                            onSDKLoad(response);
                        } else {
                            onError('Failed to get login status');
                        }
                    });
                } catch (err) {
                    onError(`Facebook SDK initialization error: ${err.message}`);
                }
            };

            // Add error handling for script loading
            const handleScriptError = () => {
                onError('Failed to load Facebook SDK. Please check your internet connection and try again.');
            };

            try {
                // Remove any existing Facebook SDK script
                const existingScript = document.getElementById('facebook-jssdk');
                if (existingScript) {
                    existingScript.remove();
                }

                const script = document.createElement('script');
                script.src = 'https://connect.facebook.net/en_US/sdk.js';
                script.async = true;
                script.defer = true;
                script.crossOrigin = 'anonymous';
                script.id = 'facebook-jssdk';
                script.onerror = handleScriptError;

                // Add timeout to detect if script fails to load
                const timeoutId = setTimeout(() => {
                    if (!window.FB) {
                        handleScriptError();
                    }
                }, 10000); // 10 second timeout

                script.onload = () => {
                    clearTimeout(timeoutId);
                };

                const firstScript = document.getElementsByTagName('script')[0];
                firstScript.parentNode.insertBefore(script, firstScript);
            } catch (err) {
                onError(`Failed to initialize Facebook SDK: ${err.message}`);
            }
        };

        loadFacebookSDK();

        return () => {
            const facebookScript = document.getElementById('facebook-jssdk');
            if (facebookScript) {
                facebookScript.remove();
            }
            delete window.FB;
            delete window.fbAsyncInit;
        };
    }, [onSDKLoad, onError]);

    return null;
}