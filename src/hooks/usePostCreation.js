import { useState, useCallback } from 'react';

export function usePostCreation(fbState, igState) {
    const [postState, setPostState] = useState({
        showForm: false,
        content: '',
        isPosting: false,
        selectedImage: null,
        postTo: {
            facebook: true,
            instagram: false,
        },
    });

    const handleImageSelect = useCallback((file) => {
        setPostState(prev => ({
            ...prev,
            selectedImage: file,
            // If Instagram is selected and image is removed, uncheck Instagram
            postTo: {
                ...prev.postTo,
                instagram: file ? prev.postTo.instagram : false
            }
        }));
    }, []);

    const handleCreatePost = useCallback(async (e) => {
        e.preventDefault();

        if (!postState.content.trim() && !postState.selectedImage) {
            return { error: 'Please enter some content or select an image for your post' };
        }

        // Validate Instagram requirements
        if (postState.postTo.instagram && !postState.selectedImage) {
            return { error: 'Instagram requires an image for posting' };
        }

        setPostState(prev => ({ ...prev, isPosting: true }));

        try {
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

            // Handle image upload and posting
            if (postState.selectedImage) {
                // Upload to Facebook
                if (postState.postTo.facebook) {
                    const formData = new FormData();
                    formData.append('source', postState.selectedImage);
                    formData.append('message', postState.content);
                    formData.append('access_token', page.access_token);

                    const fbPhotoResponse = await fetch(
                        `https://graph.facebook.com/v18.0/${page.id}/photos`,
                        {
                            method: 'POST',
                            body: formData
                        }
                    );

                    const fbResult = await fbPhotoResponse.json();
                    if (fbResult.error) throw new Error(fbResult.error.message);
                }

                // Upload to Instagram if selected and connected
                if (postState.postTo.instagram && igState.accountId) {
                    // First upload the image to Facebook to get a URL
                    const formData = new FormData();
                    formData.append('source', postState.selectedImage);
                    formData.append('access_token', page.access_token);
                    formData.append('published', 'false'); // Don't publish this to Facebook feed

                    const uploadResponse = await fetch(
                        `https://graph.facebook.com/v18.0/${page.id}/photos`,
                        {
                            method: 'POST',
                            body: formData
                        }
                    );

                    const uploadResult = await uploadResponse.json();
                    if (uploadResult.error) throw new Error(uploadResult.error.message);

                    // Get the image URL from the uploaded photo
                    const photoDetailsResponse = await fetch(
                        `https://graph.facebook.com/v18.0/${uploadResult.id}?fields=images&access_token=${page.access_token}`
                    );

                    const photoDetails = await photoDetailsResponse.json();
                    if (photoDetails.error) throw new Error(photoDetails.error.message);

                    // Use the largest image URL
                    const imageUrl = photoDetails.images[0].source;

                    // Create Instagram container with the image URL
                    const containerResponse = await fetch(
                        `https://graph.facebook.com/v18.0/${igState.accountId}/media`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                image_url: imageUrl,
                                caption: postState.content,
                                access_token: page.access_token,
                            }),
                        }
                    );

                    const containerResult = await containerResponse.json();
                    if (containerResult.error) throw new Error(containerResult.error.message);

                    // Then publish the container
                    const publishResponse = await fetch(
                        `https://graph.facebook.com/v18.0/${igState.accountId}/media_publish`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                creation_id: containerResult.id,
                                access_token: page.access_token,
                            }),
                        }
                    );

                    const publishResult = await publishResponse.json();
                    if (publishResult.error) throw new Error(publishResult.error.message);
                }
            } else {
                // Text-only post (only for Facebook as Instagram requires an image)
                if (postState.postTo.facebook) {
                    await new Promise((resolve, reject) => {
                        window.FB.api(
                            `/${page.id}/feed`,
                            'POST',
                            {
                                message: postState.content,
                                access_token: page.access_token
                            },
                            (response) => {
                                if (response && !response.error) {
                                    resolve(response);
                                } else {
                                    reject(new Error(response?.error?.message || 'Failed to create post'));
                                }
                            }
                        );
                    });
                }
            }

            setPostState({
                showForm: false,
                content: '',
                isPosting: false,
                selectedImage: null,
                postTo: {
                    facebook: true,
                    instagram: false
                }
            });
            alert('Post created successfully!');
            return { success: true };
        } catch (err) {
            console.error('Post creation error:', err);
            setPostState(prev => ({ ...prev, isPosting: false }));
            return { error: `Failed to create post: ${err.message}` };
        }
    }, [postState.content, postState.selectedImage, postState.postTo, igState.accountId]);

    return {
        postState,
        setPostState,
        handleCreatePost,
        handleImageSelect
    };
}