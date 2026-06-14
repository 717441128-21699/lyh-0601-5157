import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import StatusTag from '../StatusTag';
import { Contract } from '../../types/contract';
import dayjs from 'dayjs';

interface ContractCardProps {
  contract: Contract;
  onClick?: () => void;
  showActions?: boolean;
}

const typeNames: Record<string, string> = {
  lease: '租赁合同',
  loan: '借款合同',
  labor: '劳动合同',
  other: '其他合同'
};

const ContractCard: React.FC<ContractCardProps> = ({ contract, onClick, showActions = false }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/contract-detail/index?id=${contract.id}`
      });
    }
  };

  const daysToExpiry = dayjs(contract.endDate).diff(dayjs(), 'day');
  const showExpiryWarning = contract.status === 'signed' && daysToExpiry <= 30 && daysToExpiry >= 0;

  return (
    <View className={styles.contractCard} onClick={handleClick}>
      <View className={styles.cardHeader}>
        <View className={styles.titleRow}>
          <Text className={styles.contractTitle}>{contract.title}</Text>
          <StatusTag 
            status={contract.status} 
            reminderLevel={showExpiryWarning ? contract.reminderLevel : undefined}
            size="sm"
          />
        </View>
        <Text className={styles.contractNo}>{contract.contractNo}</Text>
      </View>

      <View className={styles.cardBody}>
        <View className={styles.infoRow}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>甲方</Text>
            <Text className={styles.infoValue}>{contract.partyA.name}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>乙方</Text>
            <Text className={styles.infoValue}>{contract.partyB.name}</Text>
          </View>
        </View>

        <View className={styles.infoRow}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>金额</Text>
            <Text className={styles.amountValue}>¥ {contract.amount.toLocaleString()}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>期限</Text>
            <Text className={styles.infoValue}>
              {contract.startDate} ~ {contract.endDate}
            </Text>
          </View>
        </View>

        {contract.risks.length > 0 && (
          <View className={styles.riskWarning}>
            <Text className={styles.riskIcon}>⚠️</Text>
            <Text className={styles.riskText}>
              检测到 {contract.risks.length} 项风险，点击查看详情
            </Text>
          </View>
        )}

        {showExpiryWarning && (
          <View className={styles.expiryWarning}>
            <Text className={styles.expiryIcon}>⏰</Text>
            <Text className={styles.expiryText}>
              {daysToExpiry === 0 ? '今天' : `还有 ${daysToExpiry} 天`}到期
            </Text>
          </View>
        )}
      </View>

      <View className={styles.cardFooter}>
        <Text className={styles.typeTag}>{typeNames[contract.type] || '其他'}</Text>
        <Text className={styles.updateTime}>更新于 {contract.updatedAt}</Text>
      </View>
    </View>
  );
};

export default ContractCard;
