import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useContractStore } from '../../store/contractStore';
import RiskItemComponent from '../../components/RiskItem';
import { RiskLevel, RiskItem, Contract } from '../../types/contract';
import { checkCompliance } from '../../utils/compliance';

type RiskFilter = 'all' | 'high' | 'medium' | 'low';

const ComplianceCheckPage: React.FC = () => {
  const router = useRouter();
  const contractId = router.params.id as string;

  const {
    currentContract,
    getContractById,
    updateContract,
    setCurrentContract
  } = useContractStore();

  const [activeFilter, setActiveFilter] = useState<RiskFilter>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [risks, setRisks] = useState<RiskItem[]>([]);

  useEffect(() => {
    if (contractId) {
      const contract = getContractById(contractId);
      if (contract) {
        setCurrentContract(contract);
        const detectedRisks = checkCompliance(contract);
        setRisks(detectedRisks);
        updateContract(contractId, { risks: detectedRisks });
      }
    }
    return () => {
      setCurrentContract(null);
    };
  }, [contractId]);

  useDidShow(() => {
    console.log('[ComplianceCheck] 页面显示');
  });

  const filteredRisks = useMemo(() => {
    if (activeFilter === 'all') return risks;
    return risks.filter(r => r.level === activeFilter);
  }, [risks, activeFilter]);

  const riskStats = useMemo(() => ({
    total: risks.length,
    high: risks.filter(r => r.level === 'high').length,
    medium: risks.filter(r => r.level === 'medium').length,
    low: risks.filter(r => r.level === 'low').length
  }), [risks]);

  const allPassed = riskStats.high === 0 && riskStats.medium === 0;

  const handleFixRisk = (risk: RiskItem) => {
    Taro.showModal({
      title: '风险提示',
      content: `${risk.title}\n\n${risk.description}\n\n建议：${risk.suggestion}`,
      showCancel: false,
      confirmText: '我知道了'
    });
  };

  const handleEditContract = () => {
    Taro.navigateTo({
      url: `/pages/contract-form/index?id=${contractId}`
    });
  };

  const handleContinue = () => {
    if (!contractId || !currentContract) return;

    if (riskStats.high > 0) {
      Taro.showModal({
        title: '存在高风险',
        content: '当前合同存在高风险项，建议先修复后再继续。是否仍要继续？',
        success: (res) => {
          if (res.confirm) {
            proceedToSign();
          }
        }
      });
      return;
    }

    proceedToSign();
  };

  const proceedToSign = () => {
    if (!contractId) return;
    
    setIsProcessing(true);
    try {
      updateContract(contractId, { status: 'pending' });
      Taro.redirectTo({
        url: `/pages/contract-detail/index?id=${contractId}`
      });
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'none' });
    } finally {
      setIsProcessing(false);
    }
  };

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

  return (
    <View className={styles.pageContainer}>
      <View className={styles.checkHeader}>
        <View className={styles.checkStatus}>
          <View className={styles.statusIcon}>
            <Text>{allPassed ? '✅' : riskStats.high > 0 ? '⚠️' : '📋'}</Text>
          </View>
          <View className={styles.statusText}>
            <Text className={styles.statusTitle}>
              {allPassed ? '校验通过' : riskStats.high > 0 ? '存在高风险' : '需要关注'}
            </Text>
            <Text className={styles.statusDesc}>
              {allPassed
                ? '合同符合法规要求，可以继续签署'
                : `发现 ${riskStats.total} 个风险项，请及时处理`}
            </Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={`${styles.statValue} ${styles.error}`}>{riskStats.high}</Text>
            <Text className={styles.statLabel}>高风险</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={`${styles.statValue} ${styles.warning}`}>{riskStats.medium}</Text>
            <Text className={styles.statLabel}>中风险</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={`${styles.statValue} ${styles.success}`}>{riskStats.low}</Text>
            <Text className={styles.statLabel}>低风险</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        {[
          { key: 'all' as RiskFilter, label: `全部 (${riskStats.total})` },
          { key: 'high' as RiskFilter, label: `高风险 (${riskStats.high})` },
          { key: 'medium' as RiskFilter, label: `中风险 (${riskStats.medium})` },
          { key: 'low' as RiskFilter, label: `低风险 (${riskStats.low})` }
        ].map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tab, activeFilter === tab.key && styles.active)}
            onClick={() => setActiveFilter(tab.key)}
          >
            <Text className={styles.tabText}>{tab.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 520rpx)' }}>
        <View className={styles.contractSummary}>
          <Text className={styles.summaryTitle}>合同摘要</Text>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>合同名称</Text>
            <Text className={styles.summaryValue}>{currentContract.title}</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>合同类型</Text>
            <Text className={styles.summaryValue}>
              {typeLabels[currentContract.type] || '其他合同'}
            </Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>合同金额</Text>
            <Text className={styles.summaryValue}>¥{currentContract.amount?.toLocaleString() || 0}</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>开始日期</Text>
            <Text className={styles.summaryValue}>{currentContract.startDate || '-'}</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>结束日期</Text>
            <Text className={styles.summaryValue}>{currentContract.endDate || '-'}</Text>
          </View>
        </View>

        <View className={styles.riskList}>
          <View className={styles.riskSection}>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>🔍</Text>
              风险检测结果
            </View>

            {filteredRisks.length > 0 ? (
              <View>
                {filteredRisks.map(risk => (
                  <RiskItemComponent
                    key={risk.id}
                    risk={risk}
                    onFix={() => handleFixRisk(risk)}
                    onIgnore={() => {
                      Taro.showToast({ title: '已忽略', icon: 'none' });
                    }}
                  />
                ))}
              </View>
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>🎉</Text>
                <Text className={styles.emptyText}>
                  {activeFilter === 'all'
                    ? '太棒了！没有发现任何风险项'
                    : `没有${activeFilter === 'high' ? '高' : activeFilter === 'medium' ? '中' : '低'}风险项`}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <Button className={styles.secondaryBtn} onClick={handleEditContract}>
          返回修改
        </Button>
        <Button
          className={styles.primaryBtn}
          onClick={handleContinue}
          disabled={isProcessing}
        >
          {isProcessing ? '处理中...' : allPassed ? '进入签署' : '继续（有风险）'}
        </Button>
      </View>
    </View>
  );
};

export default ComplianceCheckPage;
