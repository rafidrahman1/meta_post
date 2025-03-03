import { useState, useCallback } from 'react';
import { FacebookSDKLoader } from './components/FacebookSDKLoader';
import { FacebookLoginButton } from './components/FacebookLoginButton';
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

  const [postState, setPostState] = useState({
    showForm: false,
    content: '',
    isPosting: false,
    selectedImage: null,
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
          scope: 'pages_read_engagement,pages_manage_posts,pages_show_list',
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

  const handleImageSelect = useCallback((file) => {
    setPostState(prev => ({
      ...prev,
      selectedImage: file
    }));
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
      window.FB.api('/me/accounts', async (pagesResponse) => {
        if (pagesResponse?.data?.length > 0) {
          const page = pagesResponse.data[0];
          const pageAccessToken = page.access_token;
          const pageId = page.id;

          const createPost = async () => {
            if (postState.selectedImage) {
              // Create FormData for image upload
              const formData = new FormData();
              formData.append('source', postState.selectedImage);
              formData.append('message', postState.content); // Add caption to the photo
              formData.append('access_token', pageAccessToken);

              try {
                // Upload photo with caption directly
                const response = await fetch(
                    `https://graph.facebook.com/v18.0/${pageId}/photos`,
                    {
                      method: 'POST',
                      body: formData
                    }
                );

                const result = await response.json();

                if (result.error) {
                  throw new Error(result.error.message);
                }

                // Success handling
                setPostState({
                  showForm: false,
                  content: '',
                  isPosting: false,
                  selectedImage: null
                });
                alert('Post created successfully!');
              } catch (error) {
                throw new Error(`Failed to create post: ${error.message}`);
              }
            } else {
              // Text-only post
              window.FB.api(
                  `/${pageId}/feed`,
                  'POST',
                  {
                    message: postState.content,
                    access_token: pageAccessToken
                  },
                  (response) => {
                    if (response && !response.error) {
                      setPostState({
                        showForm: false,
                        content: '',
                        isPosting: false,
                        selectedImage: null
                      });
                      alert('Post created successfully!');
                    } else {
                      throw new Error(response.error.message);
                    }
                  }
              );
            }
          };

          await createPost();
        } else {
          throw new Error('No Facebook pages found or no access to pages');
        }
      });
    } catch (err) {
      console.error('Post creation error:', err);
      setFbState(prev => ({
        ...prev,
        error: `Failed to create post: ${err.message}`
      }));
      setPostState(prev => ({ ...prev, isPosting: false }));
    }
  }, [postState.content, postState.selectedImage]);


  return (
      <div className="App">
        <div className="container">
          <FacebookSDKLoader
              onSDKLoad={handleSDKLoad}
              onError={handleSDKError}
          />

          <ErrorMessage
              message={fbState.error}
              onRetry={() => window.location.reload()}
          />

          <FacebookLoginButton
              status={fbState.status}
              isSDKLoaded={fbState.isSDKLoaded}
              onLogin={handleFacebookLogin}
          />

          {fbState.status === 'connected' && !postState.showForm && (
              <button
                  className="beautiful-button create-post-button"
                  onClick={() => setPostState(prev => ({ ...prev, showForm: true }))}
              >
                Create New Post
              </button>
          )}

          {postState.showForm && (
              <PostForm
                  content={postState.content}
                  isPosting={postState.isPosting}
                  onSubmit={handleCreatePost}
                  selectedImage={postState.selectedImage}
                  onChange={(content) => setPostState(prev => ({ ...prev, content }))}
                  onCancel={() => setPostState({ showForm: false, content: '', isPosting: false })}
                  onImageSelect={handleImageSelect}
                  onCancel={() => setPostState({
                    showForm: false,
                    content: '',
                    isPosting: false,
                    selectedImage: null
                  })}
              />
          )}
        </div>
      </div>
  );
}

export default App;