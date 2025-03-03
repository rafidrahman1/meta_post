import { useRef } from 'react';

export function PostForm({
  content,
  isPosting,
  selectedImage,
  onSubmit,
  onChange,
  onImageSelect,
  onCancel
}) {
    const fileInputRef = useRef(null);

    const handleImageClick = () => {
        fileInputRef.current.click();
    };

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
                    onClick={handleImageClick}
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

            <div className="post-form-buttons">
                <button
                    type="submit"
                    className="beautiful-button submit-button"
                    disabled={isPosting}
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