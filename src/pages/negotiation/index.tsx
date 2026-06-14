import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, Textarea, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useContractStore } from '../../store/contractStore';
import { NegotiationRecord } from '../../types/contract';

const NegotiationPage: React.FC = () => {
  const router = useRouter();
  const contractId = router.params.id as string;

  const {
    currentContract,
    getContractById,
    addNegotiation,
    setCurrentContract,
    updateContract
  } = useContractStore();

  const [message, setMessage] = useState('');
  const [fromParty, setFromParty] = useState<'partyA' | 'partyB'>('partyA');
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<any>(null);

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
    console.log('[Negotiation] 页面显示');
    scrollToBottom();
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          top: 999999,
          duration: 300
        });
      }
    }, 100);
  };

  const handleSend = () => {
    if (!message.trim()) {
      Taro.showToast({ title: '请输入协商内容', icon: 'none' });
      return;
    }

    setIsSending(true);
    try {
      addNegotiation(contractId, message.trim(), []);
      
      const updated = getContractById(contractId);
      if (updated) {
        setCurrentContract(updated);
      }
      
      setMessage('');
      scrollToBottom();
      Taro.showToast({ title: '已发送', icon: 'success' });
    } catch (error) {
      Taro.showToast({ title: '发送失败', icon: 'none' });
    } finally {
      setIsSending(false);
    }
  };

  const handleAccept = (record: NegotiationRecord) => {
    Taro.showModal({
      title: '确认接受',
      content: '确定接受该协商内容吗？接受后合同将进入签署流程。',
      success: (res) => {
        if (res.confirm) {
          updateContract(contractId, { status: 'pending' });
          const updated = getContractById(contractId);
          if (updated) {
            setCurrentContract(updated);
          }
          Taro.showToast({ title: '已接受', icon: 'success' });
        }
      }
    });
  };

  const handleFinalize = () => {
    Taro.showModal({
      title: '结束协商',
      content: '确认所有协商内容已达成一致，结束协商并进入签署流程？',
      success: (res) => {
        if (res.confirm) {
          updateContract(contractId, { status: 'pending' });
          Taro.showToast({ title: '协商完成', icon: 'success' });
          setTimeout(() => {
            Taro.redirectTo({
              url: `/pages/signature/index?id=${contractId}`
            });
          }, 1000);
        }
      }
    });
  };

  const negotiationRecords = currentContract?.negotiationHistory || [];
  const sortedRecords = [...negotiationRecords].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  if (!currentContract) {
    return (
      <View className={styles.pageContainer}>
        <View style={{ padding: 100, textAlign: 'center', color: '#999' }}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  const partyAName = currentContract.partyA?.name || '甲方';
  const partyBName = currentContract.partyB?.name || '乙方';

  return (
    <View className={styles.pageContainer}>
      <View className={styles.pageHeader}>
        <Text className={styles.headerTitle}>合同协商</Text>
        <Text className={styles.headerDesc}>
          与对方协商合同条款，达成一致后可完成签署
        </Text>
      </View>

      <View className={styles.contractInfo}>
        <Text className={styles.infoTitle}>合同信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>合同名称</Text>
          <Text className={styles.infoValue}>{currentContract.title}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>合同金额</Text>
          <Text className={styles.infoValue}>¥{currentContract.amount?.toLocaleString() || 0}</Text>
        </View>
      </View>

      {negotiationRecords.length > 0 && (
        <Button className={styles.finalizeBtn} onClick={handleFinalize}>
          ✅ 协商完成，去签署
        </Button>
      )}

      <ScrollView
        ref={scrollViewRef}
        scrollY
        className={styles.messageList}
        style={{ height: sortedRecords.length > 0 ? 'calc(100vh - 650rpx)' : 'auto' }}
      >
        {sortedRecords.length > 0 ? (
          <View>
            {sortedRecords.map((record, index) => {
              const isPartyA = record.author === partyAName;
              const isMine = isPartyA ? fromParty === 'partyA' : fromParty === 'partyB';
              return (
                <View key={record.id} className={classnames(styles.messageItem, isMine && styles.isMine)}>
                  <View className={styles.messageAvatar}>
                    <Text>{isPartyA ? '甲' : '乙'}</Text>
                  </View>
                  <View className={styles.messageContent}>
                    <View className={styles.messageBubble}>
                      <Text className={styles.messageText}>{record.content}</Text>
                      <View className={styles.messageMeta}>
                        <Text className={styles.messageParty}>
                          {isPartyA ? '甲方' : '乙方'}
                        </Text>
                        <Text className={styles.messageTime}>
                          {dayjs(record.createdAt).format('MM-DD HH:mm')}
                        </Text>
                      </View>
                    </View>
                    
                    {index === sortedRecords.length - 1 && !isMine && currentContract.status === 'negotiating' && (
                      <View className={styles.negotiationActions}>
                        <Button
                          className={classnames(styles.actionBtn, styles.acceptBtn)}
                          onClick={() => handleAccept(record)}
                        >
                          ✓ 接受
                        </Button>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>💬</Text>
            <Text className={styles.emptyText}>暂无协商记录</Text>
            <Text className={styles.emptySubtext}>有任何修改意见，可以在下方输入发送给对方</Text>
          </View>
        )}
      </ScrollView>

      <View className={styles.inputSection}>
        <View className={styles.partySelector}>
          <View
            className={classnames(styles.partyOption, fromParty === 'partyA' && styles.active)}
            onClick={() => setFromParty('partyA')}
          >
            <Text className={styles.partyOptionText}>
              甲方 · {partyAName}
            </Text>
          </View>
          <View
            className={classnames(styles.partyOption, fromParty === 'partyB' && styles.active)}
            onClick={() => setFromParty('partyB')}
          >
            <Text className={styles.partyOptionText}>
              乙方 · {partyBName}
            </Text>
          </View>
        </View>
        
        <View className={styles.inputRow}>
          <View className={styles.textareaWrapper}>
            <Textarea
              className={styles.messageInput}
              placeholder="请输入协商内容..."
              value={message}
              onInput={(e) => setMessage(e.detail.value)}
              autoHeight
              maxlength={500}
              confirmType="send"
              onConfirm={handleSend}
            />
          </View>
          <Button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={!message.trim() || isSending}
          >
            {isSending ? '发送中' : '发送'}
          </Button>
        </View>
      </View>
    </View>
  );
};

export default NegotiationPage;
