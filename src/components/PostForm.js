import { useRef } from 'react';

export function PostForm({
  content,
  isPosting,
  selectedImage,
  onSubmit,
  onChange,
  onImageSelect,
  onCancel,
  postTo,
  onPostToChange,
  showInstagramOption
}) {
    const fileInputRef = useRef(null);

    return (
        <form className="post-form" onSubmit={onSubmit}>
      <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="What's on your mind?"
          disabled={isPosting}
      />

            <div className="image-upload-section">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => onImageSelect(e.target.files[0])}
                    accept="image/*"
                    style={{ display: 'none' }}
                />

                <button
                    type="button"
                    className="image-upload-button"
          onClick={() => fileInputRef.current.click()}
                    disabled={isPosting}
                >
          Add Image
                </button>

                {selectedImage && (
                    <div className="selected-image-container">
                        <img
                            src={URL.createObjectURL(selectedImage)}
                            alt="Selected"
                            className="selected-image-preview"
                        />
                        <button
                            type="button"
                            className="remove-image-button"
                            onClick={() => onImageSelect(null)}
                            disabled={isPosting}
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>

      <div className="post-options">
        <label>
          <input
            type="checkbox"
            checked={postTo.facebook}
            onChange={(e) => onPostToChange('facebook', e.target.checked)}
                    disabled={isPosting}
          />
          Post to Facebook
        </label>

        {showInstagramOption && (
          <label>
            <input
              type="checkbox"
              checked={postTo.instagram}
              onChange={(e) => onPostToChange('instagram', e.target.checked)}
              disabled={isPosting || !selectedImage}
            />
            Post to Instagram
          </label>
        )}
            </div>

      <div className="post-form-buttons">
        <button
          type="submit"
          className="beautiful-button submit-button"
          disabled={isPosting || (!postTo.facebook && !postTo.instagram)}
        >
          {isPosting ? 'Posting...' : 'Post'}
        </button>
        <button
          type="button"
          className="beautiful-button cancel-button"
          onClick={onCancel}
          disabled={isPosting}
        >
          Cancel
        </button>
      </div>
    </form>
    );
}