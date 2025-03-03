import { useEffect } from 'react';

const FB_CONFIG = {
    appId: '601346582722405',
    version: 'v18.0',
    scope: 'pages_read_engagement,pages_manage_posts,pages_show_list',
};

export function FacebookSDKLoader({ onSDKLoad, onError }) {
    useEffect(() => {
        const loadFacebookSDK = () => {
            if (window.FB) delete window.FB;

            window.fbAsyncInit = function() {
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
                    onSDKLoad(response);
                });
            };

            try {
                const script = document.createElement('script');
                script.src = 'https://connect.facebook.net/en_US/sdk.js';
                script.async = true;
                script.defer = true;
                script.crossOrigin = 'anonymous';
                script.id = 'facebook-jssdk';
                script.onerror = () => onError('Failed to load Facebook SDK. Please check your internet connection.');

                const firstScript = document.getElementsByTagName('script')[0];
                firstScript.parentNode.insertBefore(script, firstScript);
            } catch (err) {
                onError(`Failed to initialize Facebook SDK: ${err.message}`);
            }
        };

        loadFacebookSDK();

        return () => {
            const facebookScript = document.getElementById('facebook-jssdk');
            if (facebookScript) facebookScript.remove();
            delete window.FB;
        };
    }, [onSDKLoad, onError]);

    return null;
}