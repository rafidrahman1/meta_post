import { useState, useCallback } from 'react';
import { FacebookSDKLoader } from './components/FacebookSDKLoader';
import { FacebookLoginButton } from './components/FacebookLoginButton';
import { InstagramLoginButton } from './components/InstagramLoginButton';
import { PostForm } from './components/PostForm';
import { ErrorMessage } from './components/ErrorMessage';
import './App.css';

function App() {
  const [fbState, setFbState] = useState({
    isSDKLoaded: false,
    status: 'idle',
    error: null,
    accessToken: null,
  });

  const [igState, setIgState] = useState({
    status: 'idle',
    error: null,
    accountId: null,
  });

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
        error: null
      }));

      setPostState(prev => ({
        ...prev,
        postTo: {
          ...prev.postTo,
          instagram: true
        }
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

  const handleCreatePost = useCallback(async (e) => {
    e.preventDefault();

    if (!postState.content.trim() && !postState.selectedImage) {
      setFbState(prev => ({ ...prev, error: 'Please enter some content or select an image for your post' }));
      return;
    }

    setPostState(prev => ({ ...prev, isPosting: true }));
    setFbState(prev => ({ ...prev, error: null }));

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
        // First upload the image
        const formData = new FormData();
        formData.append('source', postState.selectedImage);
        formData.append('access_token', page.access_token);

        // Upload to Facebook
        if (postState.postTo.facebook) {
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
          // First, create a container
          const containerResponse = await fetch(
            `https://graph.facebook.com/v18.0/${igState.accountId}/media`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                image_url: URL.createObjectURL(postState.selectedImage),
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
    } catch (err) {
      console.error('Post creation error:', err);
      setFbState(prev => ({
        ...prev,
        error: `Failed to create post: ${err.message}`
      }));
      setPostState(prev => ({ ...prev, isPosting: false }));
    }
  }, [postState.content, postState.selectedImage, postState.postTo, igState.accountId]);

  const handleImageSelect = useCallback((file) => {
    setPostState(prev => ({
      ...prev,
      selectedImage: file
    }));
  }, []);

  return (
    <div className="App">
      <div className="container">
        <FacebookSDKLoader
          onSDKLoad={handleSDKLoad}
          onError={handleSDKError}
        />

        <ErrorMessage
          message={fbState.error || igState.error}
          onRetry={() => window.location.reload()}
        />

        {fbState.status !== 'connected' ? (
          <FacebookLoginButton
            status={fbState.status}
            isSDKLoaded={fbState.isSDKLoaded}
            onLogin={handleFacebookLogin}
          />
        ) : (
          <>
            <div className="action-buttons">
              <button
                className="beautiful-button create-post-button"
                onClick={() => setPostState(prev => ({ ...prev, showForm: true }))}
                disabled={postState.showForm}
              >
                Create New Post
              </button>
              {igState.status !== 'connected' && (
                <InstagramLoginButton
                  status={igState.status}
                  isSDKLoaded={true}
                  onLogin={handleInstagramConnect}
                />
              )}
            </div>

            {postState.showForm && (
              <PostForm
                content={postState.content}
                isPosting={postState.isPosting}
                selectedImage={postState.selectedImage}
                onSubmit={handleCreatePost}
                onChange={(content) => setPostState(prev => ({ ...prev, content }))}
                onImageSelect={handleImageSelect}
                onCancel={() => setPostState({
                  showForm: false,
                  content: '',
                  isPosting: false,
                  selectedImage: null,
                  postTo: {
                    facebook: true,
                    instagram: false
                  }
                })}
                postTo={postState.postTo}
                onPostToChange={(platform, value) =>
                  setPostState(prev => ({
                    ...prev,
                    postTo: {
                      ...prev.postTo,
                      [platform]: value
                    }
                  }))
                }
                showInstagramOption={igState.status === 'connected'}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;