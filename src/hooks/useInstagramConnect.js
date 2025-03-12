import { useState, useCallback } from 'react';

export function useInstagramConnect() {
    const [igState, setIgState] = useState({
        status: 'idle',
        error: null,
        accountId: null,
        pageAccessToken: null,
    });

    const handleInstagramConnect = useCallback(async () => {
        setIgState(prev => ({ ...prev, error: null, status: 'attempting_login' }));

        try {
            // First get Facebook pages
            const pagesResponse = await new Promise((resolve, reject) => {
                window.FB.api('/me/accounts', (response) => {
                    if (response && !response.error) {
                        resolve(response);
                    } else {
                        reject(new Error(response?.error?.message || 'Failed to get pages'));
                    }
                });
            });

            if (!pagesResponse.data || pagesResponse.data.length === 0) {
                throw new Error('No Facebook pages found');
            }

            const page = pagesResponse.data[0];

            // Get Instagram account connected to the page
            const igResponse = await new Promise((resolve, reject) => {
                window.FB.api(
                    `/${page.id}?fields=instagram_business_account`,
                    'GET',
                    { access_token: page.access_token },
                    (response) => {
                        if (response && !response.error) {
                            resolve(response);
                        } else {
                            reject(new Error(response?.error?.message || 'Failed to get Instagram account'));
                        }
                    }
                );
            });

            if (!igResponse.instagram_business_account) {
                throw new Error('No Instagram Business account connected to this Facebook page');
            }

            setIgState(prev => ({
                ...prev,
                status: 'connected',
                accountId: igResponse.instagram_business_account.id,
                pageAccessToken: page.access_token,
                error: null
            }));
        } catch (err) {
            console.error('Instagram connection error:', err);
            setIgState(prev => ({
                ...prev,
                error: err.message,
                status: 'error'
            }));
        }
    }, []);

    return {
        igState,
        setIgState,
        handleInstagramConnect
    };
}