import React, { useRef, useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const CameraCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          onCapture(blob);
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 w-full max-w-md">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold">{t('takePhoto')}</h3>
        </div>
        
        {error ? (
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              {t('cancel')}
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg mb-4"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="flex space-x-3">
              <button
                onClick={capturePhoto}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium touch-target"
              >
                {t('capturePhoto')}
              </button>
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-400 text-white py-3 rounded-lg hover:bg-gray-500 font-medium touch-target"
              >
                {t('cancel')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
