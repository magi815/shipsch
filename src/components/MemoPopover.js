import React, { useState, useEffect, useRef } from 'react';
import { saveMemo, getMemoImages, deleteMemoImage } from '../api/shipApi';
import API_BASE_URL from '../api/config';

function MemoPopover({ isOpen, onClose, circuit, memo, memodate, shipNum, onSave }) {
  const [memoText, setMemoText] = useState(memo || '');
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const fileInputRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const result = await getMemoImages(shipNum, circuit);
        setImages(result.images || []);
      } catch (err) {
        console.error('이미지 로드 실패:', err);
      }
    };

    if (isOpen) {
      setMemoText(memo || '');
      setNewImages([]);
      loadImages();
    }
  }, [isOpen, circuit, memo, shipNum]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveMemo(shipNum, circuit, memoText, newImages);
      onSave(circuit, memoText);
      onClose();
    } catch (err) {
      console.error('메모 저장 실패:', err);
      alert('메모 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setNewImages(prev => [...prev, ...files]);
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('이미지를 삭제하시겠습니까?')) return;
    try {
      await deleteMemoImage(shipNum, imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err) {
      console.error('이미지 삭제 실패:', err);
    }
  };

  const handleRemoveNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000
        }}
        onClick={onClose}
      />
      <div
        ref={popoverRef}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          zIndex: 1001,
          width: '90%',
          maxWidth: '500px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>{circuit}</div>
            {memodate && <div style={{ fontSize: '12px', color: '#9ca3af' }}>{memodate}</div>}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#9ca3af'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '16px', flex: 1, overflow: 'auto' }}>
          <textarea
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            placeholder="메모를 입력하세요..."
            style={{
              width: '100%',
              minHeight: '120px',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical',
              outline: 'none'
            }}
          />

          {(images.length > 0 || newImages.length > 0) && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>첨부 이미지</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {images.map((img) => (
                  <div key={img.id} style={{ position: 'relative' }}>
                    <img
                      src={`${API_BASE_URL}${img.url}`}
                      alt=""
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setViewingImage(`${API_BASE_URL}${img.url}`)}
                    />
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {newImages.map((file, idx) => (
                  <div key={`new-${idx}`} style={{ position: 'relative' }}>
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '2px solid #22c55e'
                      }}
                    />
                    <button
                      onClick={() => handleRemoveNewImage(idx)}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{
          padding: '16px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '8px',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📷 이미지 추가
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>

      {viewingImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setViewingImage(null)}
        >
          <img
            src={viewingImage}
            alt=""
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
          />
        </div>
      )}
    </>
  );
}

export default MemoPopover;
