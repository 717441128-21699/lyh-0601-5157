import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useContractStore } from '../../store/contractStore';
import StatusTag from '../../components/StatusTag';
import QRCode from '../../components/QRCode';
import { generateContractPDF } from '../../utils/pdf';
import { Contract, SignRecord } from '../../types/contract';

type TabType = 'info' | 'terms' | 'sign' | 'history';

const ContractDetailPage: React.FC = () => {
  const router = useRouter();
  const contractId = router.params.id as string;

  const {
    currentContract,
    getContractById,
    setCurrentContract,
    deleteContract,
    updateContract,
    checkAndSendReminders
  } = useContractStore();

  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (contractId) {
      const contract = getContractById(contractId);
      if (contract) {
        setCurrentContract(contract);
      }
      checkAndSendReminders();
    }
    return () => {
      setCurrentContract(null);
    };
  }, [contractId]);

  useDidShow(() => {
    console.log('[ContractDetail] 页面显示');
    if (contractId) {
      const contract = getContractById(contractId);
      if (contract) {
        setCurrentContract(contract);
      }
    }
  });

  const handleSign = () => {
    Taro.navigateTo({
      url: `/pages/signature/index?id=${contractId}`
    });
  };

  const handleNegotiate = () => {
    Taro.navigateTo({
      url: `/pages/negotiation/index?id=${contractId}`
    });
  };

  const handleExport = async () => {
    if (!currentContract) return;
    
    setIsExporting(true);
    try {
      Taro.showLoading({ title: '正在生成...', mask: true });
      await generateContractPDF(currentContract, currentContract.signRecords);
      Taro.showToast({ title: '已保存到相册', icon: 'success' });
    } catch (error) {
      Taro.showToast({ title: '导出失败', icon: 'none' });
      console.error('Export error:', error);
    } finally {
      Taro.hideLoading();
      setIsExporting(false);
    }
  };

  const handleShare = () => {
    Taro.showToast({ title: '分享功能开发中', icon: 'none' });
  };

  const handleDelete = () => {
    Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这份合同吗？',
      confirmColor: '#dc2626',
      success: (res) => {
        if (res.confirm) {
          try {
            deleteContract(contractId);
            Taro.showToast({ title: '已删除', icon: 'success' });
            setTimeout(() => Taro.navigateBack(), 1000);
          } catch (error) {
            Taro.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  };

  const handleRenew = () => {
    Taro.showModal({
      title: '续签合同',
      content: '将基于当前合同创建一份新的续签合同，是否继续？',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '功能开发中', icon: 'none' });
        }
      }
    });
  };

  const handleTerminate = () => {
    Taro.showModal({
      title: '终止合同',
      content: '确定要提前终止这份合同吗？此操作将更新合同状态。',
      confirmColor: '#dc2626',
      success: (res) => {
        if (res.confirm) {
          try {
            updateContract(contractId, { status: 'terminated' });
            const updated = getContractById(contractId);
            if (updated) {
              setCurrentContract(updated);
            }
            Taro.showToast({ title: '已终止', icon: 'success' });
          } catch (error) {
            Taro.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  };

  const risks = currentContract?.risks || [];
  const riskStats = {
    high: risks.filter(r => r.level === 'high').length,
    medium: risks.filter(r => r.level === 'medium').length,
    low: risks.filter(r => r.level === 'low').length
  };

  const signRecords = currentContract?.signRecords || [];
  const negotiationHistory = currentContract?.negotiationHistory || [];

  const partyASigned = signRecords.find(
    s => s.partyName === currentContract?.partyA?.name
  )?.signedAt;
  const partyBSigned = signRecords.find(
    s => s.partyName === currentContract?.partyB?.name
  )?.signedAt;

  const timeline = [
    { title: '合同创建', desc: '合同信息已填写完成', time: currentContract?.createdAt, status: 'success' },
    { title: '合规校验', desc: `发现${risks.length}个风险项`, time: currentContract?.updatedAt, status: 'success' },
    ...signRecords.map(s => ({
      title: `${s.partyName}已签署`,
      desc: '已完成电子签名',
      time: s.signedAt,
      status: s.signedAt ? 'success' : 'pending'
    })),
    ...negotiationHistory.slice(0, 2).map(n => ({
      title: `${n.author}提出修改`,
      desc: n.content.substring(0, 30) + '...',
      time: n.createdAt,
      status: 'success'
    }))
  ].filter(t => t.time).sort((a, b) => new Date(a.time!).getTime() - new Date(b.time!).getTime());

  if (!currentContract) {
    return (
      <View className={styles.pageContainer}>
        <View style={{ padding: 100, textAlign: 'center', color: '#999' }}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  const typeLabels: Record<string, string> = {
    lease: '租赁合同',
    loan: '借款合同',
    labor: '劳动合同',
    other: '其他合同'
  };

  const canSign = currentContract.status === 'pending' || currentContract.status === 'negotiating';
  const isSigned = currentContract.status === 'signed';
  const canRenew = isSigned && currentContract.endDate && 
    dayjs(currentContract.endDate).diff(dayjs(), 'day') <= 30;

  return (
    <View className={styles.pageContainer}>
      <View className={styles.statusBanner}>
        <View className={styles.statusRow}>
          <View className={styles.statusLeft}>
            <View className={styles.statusIcon}>
              <Text>{isSigned ? '✅' : canSign ? '✍️' : '📋'}</Text>
            </View>
            <View className={styles.statusInfo}>
              <View style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                <StatusTag status={currentContract.status} level={currentContract.reminderLevel} />
              </View>
              <Text className={styles.statusDesc}>{currentContract.title}</Text>
            </View>
          </View>
          <View className={styles.shareBtn} onClick={handleShare}>
            <Text>📤</Text>
          </View>
        </View>
        <Text className={styles.contractCode}>
          合同编号：{currentContract.contractNo || '未生成'}
        </Text>
      </View>

      <View className={styles.tabs}>
        {[
          { key: 'info' as TabType, label: '基本信息' },
          { key: 'terms' as TabType, label: '合同条款' },
          { key: 'sign' as TabType, label: '签署状态' },
          { key: 'history' as TabType, label: '历史记录' }
        ].map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tab, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text className={styles.tabText}>{tab.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 400rpx)' }}>
        <View className={styles.contentSection}>
          {activeTab === 'info' && (
            <View>
              <View className={styles.infoCard}>
                <Text className={styles.cardTitle}>
                  <Text className={styles.cardIcon}>📋</Text>
                  合同信息
                </Text>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>合同类型</Text>
                  <Text className={styles.infoValue}>
                    {typeLabels[currentContract.type] || '其他合同'}
                  </Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>合同金额</Text>
                  <Text className={styles.infoValue}>¥{currentContract.amount?.toLocaleString() || 0}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>开始日期</Text>
                  <Text className={styles.infoValue}>{currentContract.startDate || '-'}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>结束日期</Text>
                  <Text className={styles.infoValue}>{currentContract.endDate || '-'}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>签订日期</Text>
                  <Text className={styles.infoValue}>{currentContract.signedAt || '-'}</Text>
                </View>
              </View>

              <View className={styles.infoCard}>
                <Text className={styles.cardTitle}>
                  <Text className={styles.cardIcon}>👥</Text>
                  双方信息
                </Text>
                
                <View className={styles.partySection}>
                  <Text className={styles.partyTitle}>甲方</Text>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>姓名</Text>
                    <Text className={styles.infoValue}>{currentContract.partyA?.name || '-'}</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>身份证</Text>
                    <Text className={styles.infoValue}>{currentContract.partyA?.idNumber || '-'}</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>电话</Text>
                    <Text className={styles.infoValue}>{currentContract.partyA?.phone || '-'}</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>地址</Text>
                    <Text className={styles.infoValue}>{currentContract.partyA?.address || '-'}</Text>
                  </View>
                </View>

                <View className={styles.partySection}>
                  <Text className={styles.partyTitle}>乙方</Text>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>姓名</Text>
                    <Text className={styles.infoValue}>{currentContract.partyB?.name || '-'}</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>身份证</Text>
                    <Text className={styles.infoValue}>{currentContract.partyB?.idNumber || '-'}</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>电话</Text>
                    <Text className={styles.infoValue}>{currentContract.partyB?.phone || '-'}</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>地址</Text>
                    <Text className={styles.infoValue}>{currentContract.partyB?.address || '-'}</Text>
                  </View>
                </View>
              </View>

              {risks.length > 0 && (
                <View className={styles.infoCard}>
                  <Text className={styles.cardTitle}>
                    <Text className={styles.cardIcon}>⚠️</Text>
                    风险提示
                  </Text>
                  <View className={styles.riskSummary}>
                    <View className={styles.riskStat}>
                      <Text className={`${styles.riskStatValue} ${styles.high}`}>{riskStats.high}</Text>
                      <Text className={styles.riskStatLabel}>高风险</Text>
                    </View>
                    <View className={styles.riskStat}>
                      <Text className={`${styles.riskStatValue} ${styles.medium}`}>{riskStats.medium}</Text>
                      <Text className={styles.riskStatLabel}>中风险</Text>
                    </View>
                    <View className={styles.riskStat}>
                      <Text className={`${styles.riskStatValue} ${styles.low}`}>{riskStats.low}</Text>
                      <Text className={styles.riskStatLabel}>低风险</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {activeTab === 'terms' && (
            <View className={styles.infoCard}>
              <Text className={styles.cardTitle}>
                <Text className={styles.cardIcon}>📜</Text>
                合同条款
              </Text>
              <View className={styles.termsContent}>
                {currentContract.clauses && currentContract.clauses.length > 0 ? (
                  <View>
                    {currentContract.clauses.map((clause, index) => (
                      <View key={clause.id} style={{ marginBottom: index < currentContract.clauses!.length - 1 ? 24 : 0 }}>
                        <Text className={styles.clauseTitle}>{clause.title}</Text>
                        <Text className={styles.termsText}>{clause.content}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className={styles.termsText}>暂无条款内容</Text>
                )}
              </View>
            </View>
          )}

          {activeTab === 'sign' && (
            <View>
              <View className={styles.infoCard}>
                <Text className={styles.cardTitle}>
                  <Text className={styles.cardIcon}>✍️</Text>
                  签署状态
                </Text>
                <View className={styles.signSection}>
                  <View className={styles.signParty}>
                    <View className={classnames(styles.signBox, partyASigned && styles.signed)}>
                      {partyASigned ? (
                        <Text className={styles.signText}>已签署</Text>
                      ) : (
                        <Text className={styles.signPlaceholder}>待签署</Text>
                      )}
                    </View>
                    <Text className={styles.signName}>甲方</Text>
                    <Text className={styles.signDate}>
                      {partyASigned || '未签署'}
                    </Text>
                  </View>
                  
                  <View className={styles.signParty}>
                    <View className={classnames(styles.signBox, partyBSigned && styles.signed)}>
                      {partyBSigned ? (
                        <Text className={styles.signText}>已签署</Text>
                      ) : (
                        <Text className={styles.signPlaceholder}>待签署</Text>
                      )}
                    </View>
                    <Text className={styles.signName}>乙方</Text>
                    <Text className={styles.signDate}>
                      {partyBSigned || '未签署'}
                    </Text>
                  </View>
                </View>
              </View>

              {isSigned && currentContract.qrCodeData && (
                <View className={styles.infoCard}>
                  <Text className={styles.cardTitle}>
                    <Text className={styles.cardIcon}>🔐</Text>
                    防伪验证
                  </Text>
                  <View className={styles.qrSection}>
                    <View className={styles.qrContainer}>
                      <QRCode
                        value={currentContract.qrCodeData}
                        size={200}
                      />
                    </View>
                    <Text className={styles.qrDesc}>
                      扫描二维码验证合同真伪
                    </Text>
                    {currentContract.encryptedData && (
                      <Text className={styles.qrDesc} style={{ marginTop: 8, wordBreak: 'break-all' }}>
                        合同哈希：{currentContract.encryptedData.substring(0, 16)}...
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          {activeTab === 'history' && (
            <View className={styles.infoCard}>
              <Text className={styles.cardTitle}>
                <Text className={styles.cardIcon}>📊</Text>
                操作记录
              </Text>
              <View className={styles.timeline}>
                {timeline.map((item, index) => (
                  <View key={index} className={styles.timelineItem}>
                    <View className={classnames(styles.timelineDot, item.status === 'pending' && styles.pending, item.status === 'success' && styles.success)} />
                    <View className={styles.timelineContent}>
                      <Text className={styles.timelineTitle}>{item.title}</Text>
                      {item.desc && <Text className={styles.timelineDesc}>{item.desc}</Text>}
                      <Text className={styles.timelineTime}>
                        {item.time ? dayjs(item.time).format('YYYY-MM-DD HH:mm') : '-'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <Button className={styles.secondaryBtn} onClick={handleExport} disabled={isExporting}>
          {isExporting ? '导出中' : '📥 导出'}
        </Button>
        
        {canSign && (
          <Button className={styles.primaryBtn} onClick={handleSign}>
            ✍️ 立即签署
          </Button>
        )}
        
        {currentContract.status === 'pending' && (
          <Button className={styles.secondaryBtn} onClick={handleNegotiate}>
            💬 发起协商
          </Button>
        )}
        
        {canRenew && (
          <Button className={styles.primaryBtn} onClick={handleRenew}>
            🔄 续签合同
          </Button>
        )}
        
        {isSigned && !canRenew && (
          <Button className={styles.primaryBtn} onClick={handleNegotiate}>
            💬 协商修改
          </Button>
        )}
        
        {currentContract.status === 'signed' && (
          <Button className={styles.dangerBtn} onClick={handleTerminate}>
            ⏹️ 终止合同
          </Button>
        )}
        
        {currentContract.status === 'draft' && (
          <Button className={styles.dangerBtn} onClick={handleDelete}>
            🗑️ 删除合同
          </Button>
        )}
      </View>
    </View>
  );
};

export default ContractDetailPage;
