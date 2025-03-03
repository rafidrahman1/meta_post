export function ErrorMessage({ message, onRetry }) {
    if (!message) return null;

    return (
        <div className="error-message">
            <p>{message}</p>
            <button className="retry-button" onClick={onRetry}>
                Refresh Page
            </button>
        </div>
    );
}