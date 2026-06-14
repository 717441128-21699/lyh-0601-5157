import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { ContractStatus, ReminderLevel } from '../../types/contract';

interface StatusTagProps {
  status: ContractStatus;
  reminderLevel?: ReminderLevel;
  size?: 'sm' | 'md';
}

const statusConfig: Record<ContractStatus, { text: string; className: string }> = {
  draft: { text: '草稿', className: 'draft' },
  pending: { text: '待签署', className: 'pending' },
  negotiating: { text: '协商中', className: 'negotiating' },
  signed: { text: '已签署', className: 'signed' },
  expired: { text: '已过期', className: 'expired' },
  terminated: { text: '已终止', className: 'terminated' }
};

const reminderConfig: Record<ReminderLevel, { text: string; className: string }> = {
  normal: { text: '', className: '' },
  urgent: { text: '即将到期', className: 'urgent' },
  critical: { text: '紧急', className: 'critical' }
};

const StatusTag: React.FC<StatusTagProps> = ({ status, reminderLevel, size = 'md' }) => {
  const config = statusConfig[status];
  const reminderConfigItem = reminderLevel ? reminderConfig[reminderLevel] : null;

  return (
    <View className={styles.statusTagContainer}>
      <View className={classnames(styles.statusTag, styles[config.className], styles[size])}>
        <Text className={styles.tagText}>{config.text}</Text>
      </View>
      {reminderConfigItem && reminderConfigItem.text && (
        <View className={classnames(styles.reminderTag, styles[reminderConfigItem.className])}>
          <Text className={styles.tagText}>{reminderConfigItem.text}</Text>
        </View>
      )}
    </View>
  );
};

export default StatusTag;
