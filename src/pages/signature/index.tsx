import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, Canvas } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useContractStore } from '../../store/contractStore';
import { simpleEncrypt } from '../../utils/encryption';

const SignaturePage: React.FC = () => {
  const router = useRouter();
  const contractId = router.params.id as string;

  const {
    currentContract,
    getContractById,
    signContract,
    setCurrentContract
  } = useContractStore();

  const [activeParty, setActiveParty] = useState<'partyA' | 'partyB'>('partyA');
  const [hasSignature, setHasSignature] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const canvasRef = useRef<any>(null);
  const ctxRef = useRef<any>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (contractId) {
      const contract = getContractById(contractId);
      if (contract) {
        setCurrentContract(contract);
      }
    }
    return () => {
      setCurrentContract(null);
    };
  }, [contractId]);

  useDidShow(() => {
    console.log('[Signature] 页面显示');
    initCanvas();
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      initCanvas();
    }, 300);
    return () => clearTimeout(timer);
  }, [activeParty]);

  const initCanvas = () => {
    const query = Taro.createSelectorQuery();
    query.select('#signCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0]) {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = Taro.getSystemInfoSync().pixelRatio;
          canvas.width = res[0].width * dpr;
          canvas.height = res[0].height * dpr;
          ctx.scale(dpr, dpr);
          
          ctx.strokeStyle = '#1e3a8a';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctxRef.current = ctx;
          canvasRef.current = canvas;
          setHasSignature(false);
        }
      });
  };

  const getCanvasPoint = (e: any) => {
    const touch = e.touches[0] || e.changedTouches[0];
    const query = Taro.createSelectorQuery();
    return new Promise((resolve) => {
      query.select('#signCanvas').boundingClientRect().exec((res) => {
        if (res[0]) {
          resolve({
            x: touch.clientX - res[0].left,
            y: touch.clientY - res[0].top
          });
        }
      });
    });
  };

  const handleTouchStart = async (e: any) => {
    isDrawingRef.current = true;
    const point: any = await getCanvasPoint(e);
    lastPointRef.current = point;
    
    if (ctxRef.current) {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(point.x, point.y);
    }
  };

  const handleTouchMove = async (e: any) => {
    if (!isDrawingRef.current) return;
    
    const point: any = await getCanvasPoint(e);
    const ctx = ctxRef.current;
    
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      lastPointRef.current = point;
      setHasSignature(true);
    }
  };

  const handleTouchEnd = () => {
    isDrawingRef.current = false;
  };

  const handleClear = () => {
    if (ctxRef.current && canvasRef.current) {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  const getSignatureData = (): Promise<string> => {
    return new Promise((resolve) => {
      if (canvasRef.current) {
        Taro.canvasToTempFilePath({
          canvas: canvasRef.current,
          success: (res) => {
            resolve(res.tempFilePath);
          },
          fail: () => {
            resolve('signature_' + Date.now());
          }
        });
      } else {
        resolve('signature_' + Date.now());
      }
    });
  };

  const handleConfirmSign = async () => {
    if (!hasSignature) {
      Taro.showToast({ title: '请先签名', icon: 'none' });
      return;
    }

    setIsSigning(true);
    try {
      Taro.showLoading({ title: '正在生成签名...', mask: true });
      
      const signatureData = await getSignatureData();
      const encryptedSignature = simpleEncrypt(signatureData);
      
      Taro.hideLoading();
      
      signContract(contractId, activeParty, encryptedSignature);
      
      const updatedContract = getContractById(contractId);
      if (updatedContract) {
        setCurrentContract(updatedContract);
      }
      
      handleClear();
      
      const allSigned = updatedContract?.signRecords.length >= 2;
      
      if (allSigned) {
        Taro.showToast({ title: '签署完成', icon: 'success' });
        setTimeout(() => {
          Taro.redirectTo({
            url: `/pages/contract-detail/index?id=${contractId}`
          });
        }, 1500);
      } else {
        if (activeParty === 'partyA') {
          setActiveParty('partyB');
        }
      }
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({ title: '签署失败', icon: 'none' });
      console.error('Sign error:', error);
    } finally {
      setIsSigning(false);
    }
  };

  const handleFinish = () => {
    const allSigned = currentContract?.signRecords.length >= 2;
    
    if (allSigned) {
      Taro.redirectTo({
        url: `/pages/contract-detail/index?id=${contractId}`
      });
    } else {
      Taro.showModal({
        title: '尚未完成签署',
        content: '还有一方未完成签署，确定要返回吗？',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateBack();
          }
        }
      });
    }
  };

  const partyASigned = currentContract?.signRecords.find(
    s => s.partyName === currentContract.partyA?.name
  )?.signedAt;
  const partyBSigned = currentContract?.signRecords.find(
    s => s.partyName === currentContract.partyB?.name
  )?.signedAt;
  const currentPartySigned = activeParty === 'partyA' ? partyASigned : partyBSigned;
  const allSigned = partyASigned && partyBSigned;

  if (!currentContract) {
    return (
      <View className={styles.pageContainer}>
        <View style={{ padding: 100, textAlign: 'center', color: '#999' }}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.pageContainer}>
      <View className={styles.pageHeader}>
        <Text className={styles.headerTitle}>电子签名</Text>
        <Text className={styles.headerDesc}>请在下方签署区域手写签名</Text>
      </View>

      <View className={styles.contractInfo}>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>合同名称</Text>
          <Text className={styles.infoValue}>{currentContract.title}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>合同金额</Text>
          <Text className={styles.infoValue}>¥{currentContract.amount?.toLocaleString() || 0}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>签署日期</Text>
          <Text className={styles.infoValue}>{dayjs().format('YYYY年MM月DD日')}</Text>
        </View>
      </View>

      <View className={styles.signSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>✍️</Text>
          选择签署方
        </Text>
        
        <View className={styles.signParties}>
          <View
            className={classnames(
              styles.signParty,
              partyASigned && styles.signed,
              activeParty === 'partyA' && !partyASigned && styles.active
            )}
            onClick={() => !partyASigned && setActiveParty('partyA')}
          >
            <Text className={styles.partyLabel}>甲方</Text>
            <Text className={styles.partyName}>{currentContract.partyA?.name || '-'}</Text>
            <Text className={classnames(styles.partyStatus, partyASigned ? styles.signed : styles.pending)}>
              {partyASigned ? `已签署 · ${dayjs(partyASigned).format('MM-DD HH:mm')}` : '待签署'}
            </Text>
          </View>
          
          <View
            className={classnames(
              styles.signParty,
              partyBSigned && styles.signed,
              activeParty === 'partyB' && !partyBSigned && styles.active
            )}
            onClick={() => !partyBSigned && setActiveParty('partyB')}
          >
            <Text className={styles.partyLabel}>乙方</Text>
            <Text className={styles.partyName}>{currentContract.partyB?.name || '-'}</Text>
            <Text className={classnames(styles.partyStatus, partyBSigned ? styles.signed : styles.pending)}>
              {partyBSigned ? `已签署 · ${dayjs(partyBSigned).format('MM-DD HH:mm')}` : '待签署'}
            </Text>
          </View>
        </View>
      </View>

      {!currentPartySigned && !allSigned && (
        <View className={styles.signSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📝</Text>
            {activeParty === 'partyA' ? '甲方' : '乙方'}签名
          </Text>
          
          <View className={styles.signArea}>
            <View
              className={classnames(styles.signPadContainer, hasSignature && styles.active)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <Canvas
                id="signCanvas"
                className={styles.signPad}
                type="2d"
              />
              {!hasSignature && (
                <View className={styles.signPlaceholder}>
                  <Text className={styles.placeholderIcon}>✍️</Text>
                  <Text className={styles.placeholderText}>请在此处手写签名</Text>
                </View>
              )}
            </View>
            
            <View className={styles.signActions}>
              <Button className={styles.clearBtn} onClick={handleClear}>
                清除重签
              </Button>
              <Button
                className={styles.confirmBtn}
                onClick={handleConfirmSign}
                disabled={!hasSignature || isSigning}
              >
                {isSigning ? '签署中...' : '确认签名'}
              </Button>
            </View>
          </View>
        </View>
      )}

      <View className={styles.tipSection}>
        <Text className={styles.tipTitle}>
          <Text className={styles.tipIcon}>🔒</Text>
          安全提示
        </Text>
        <Text className={styles.tipText}>
          1. 请确保签名为本人真实笔迹，签名将被加密存储
        </Text>
        <Text className={styles.tipText}>
          2. 签名完成后，合同将生成唯一防伪哈希值
        </Text>
        <Text className={styles.tipText}>
          3. 签署后的合同不可随意修改，如需修改请发起协商
        </Text>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.secondaryBtn} onClick={handleFinish}>
          {allSigned ? '完成' : '返回'}
        </Button>
        <Button
          className={styles.primaryBtn}
          disabled={!allSigned}
          onClick={handleFinish}
        >
          完成签署
        </Button>
      </View>
    </View>
  );
};

export default SignaturePage;
