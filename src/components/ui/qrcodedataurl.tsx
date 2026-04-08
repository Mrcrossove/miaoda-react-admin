import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDataUrlProps {
  value: string;
  size?: number;
  className?: string;
}

const QRCodeDataUrl: React.FC<QRCodeDataUrlProps> = ({ value, size = 200, className }) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!value) {
      setError(true);
      return;
    }

    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setDataUrl(url);
        setError(false);
      })
      .catch((err) => {
        console.error('QR Code generation error:', err);
        setError(true);
      });
  }, [value, size]);

  if (error) {
    return (
      <div
        className={className}
        style={{ width: size, height: size }}
      >
        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
          二维码生成失败
        </div>
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        className={className}
        style={{ width: size, height: size }}
      >
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="QR Code"
      className={className}
      style={{ width: size, height: size }}
    />
  );
};

export default QRCodeDataUrl;