import { useCallback } from 'react';
import { FacebookSDKLoader } from './components/FacebookSDKLoader';
import { FacebookLoginButton } from './components/FacebookLoginButton';
import { InstagramLoginButton } from './components/InstagramLoginButton';
import { PostForm } from './components/PostForm';
import { ErrorMessage } from './components/ErrorMessage';
import { useFacebookAuth } from './hooks/useFacebookAuth';
import { useInstagramConnect } from './hooks/useInstagramConnect';
import { usePostCreation } from './hooks/usePostCreation';
import './App.css';

function App() {
  const {
    fbState,
    handleSDKLoad,
    handleSDKError,
    handleFacebookLogin
  } = useFacebookAuth();

  const {
    igState,
    handleInstagramConnect
  } = useInstagramConnect();

  const {
    postState,
    setPostState,
    handleCreatePost,
    handleImageSelect
  } = usePostCreation(fbState, igState);

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
              <AuthenticatedView
                  igState={igState}
                  postState={postState}
                  setPostState={setPostState}
                  handleInstagramConnect={handleInstagramConnect}
                  handleCreatePost={handleCreatePost}
                  handleImageSelect={handleImageSelect}
              />
          )}
        </div>
      </div>
  );
}

function AuthenticatedView({
                             igState,
                             postState,
                             setPostState,
                             handleInstagramConnect,
                             handleCreatePost,
                             handleImageSelect
                           }) {
  const handlePostToChange = useCallback((platform, value) => {
    setPostState(prev => ({
      ...prev,
      postTo: {
        ...prev.postTo,
        [platform]: value
      }
    }));
  }, [setPostState]);

  const handleCancel = useCallback(() => {
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
  }, [setPostState]);

  const handleContentChange = useCallback((content) => {
    setPostState(prev => ({ ...prev, content }));
  }, [setPostState]);

  return (
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
                onChange={handleContentChange}
                onImageSelect={handleImageSelect}
                onCancel={handleCancel}
                postTo={postState.postTo}
                onPostToChange={handlePostToChange}
                showInstagramOption={igState.status === 'connected'}
            />
        )}
      </>
  );
}

export default App;