import React, { useEffect, useRef } from 'react';
import { View, Canvas, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { drawQRCode, saveQRCodeImage } from '../../utils/qrcode';

interface QRCodeProps {
  content: string;
  size?: number;
  showLabel?: boolean;
  label?: string;
  showSaveButton?: boolean;
}

const QRCode: React.FC<QRCodeProps> = ({
  content,
  size = 200,
  showLabel = true,
  label = '防伪二维码',
  showSaveButton = true
}) => {
  const canvasId = useRef(`qrcode_${Date.now()}`);

  useEffect(() => {
    const timer = setTimeout(() => {
      drawQRCode(canvasId.current, content, { size });
    }, 300);
    return () => clearTimeout(timer);
  }, [content, size]);

  const handleSave = async () => {
    try {
      await saveQRCodeImage(canvasId.current, 'qrcode.png');
    } catch (error) {
      console.error('[QRCode] 保存失败', error);
      Taro.showToast({ title: '保存失败', icon: 'none' });
    }
  };

  return (
    <View className={styles.qrCodeWrapper}>
      <View className={styles.qrCodeContainer}>
        <Canvas
          type="2d"
          id={canvasId.current}
          style={{ width: `${size}px`, height: `${size}px` }}
          className={styles.canvas}
        />
      </View>
      {showLabel && (
        <Text className={styles.qrLabel}>{label}</Text>
      )}
      {showSaveButton && (
        <Button className={styles.saveButton} onClick={handleSave}>
          保存二维码
        </Button>
      )}
      <Text className={styles.qrHint}>扫码验证合同真伪</Text>
    </View>
  );
};

export default QRCode;
