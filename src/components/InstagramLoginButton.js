export function InstagramLoginButton({ status, isSDKLoaded, onLogin }) {
  const getButtonText = () => {
    switch (status) {
      case 'attempting_login': return 'Connecting...';
      case 'connected': return 'Connected with Instagram';
      case 'error': return 'Retry Connection';
      default: return isSDKLoaded ? 'Connect Instagram Account' : 'Loading...';
    }
  };

  return (
    <button
      className="beautiful-button instagram-button"
      onClick={onLogin}
      disabled={!isSDKLoaded || status === 'attempting_login'}
    >
      {getButtonText()}
    </button>
  );
}