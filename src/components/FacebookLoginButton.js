export function FacebookLoginButton({ status, isSDKLoaded, onLogin }) {
    const getButtonText = () => {
        switch (status) {
            case 'attempting_login': return 'Connecting...';
            case 'connected': return 'Connected with Facebook';
            case 'error': return 'Retry Connection';
            default: return isSDKLoaded ? 'Connect with Facebook' : 'Loading...';
        }
    };

    return (
        <button
            className={`beautiful-button facebook-button ${status === 'connected' ? 'connected' : ''}`}
            onClick={onLogin}
            disabled={!isSDKLoaded || status === 'attempting_login'}
        >
            {getButtonText()}
        </button>
    );
}