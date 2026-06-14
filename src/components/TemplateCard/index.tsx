import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { ContractTemplate } from '../../types/contract';

interface TemplateCardProps {
  template: ContractTemplate;
  onSelect?: (template: ContractTemplate) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect }) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(template);
    } else {
      Taro.navigateTo({
        url: `/pages/contract-edit/index?templateId=${template.id}`
      });
    }
  };

  return (
    <View className={styles.templateCard} onClick={handleClick}>
      <View className={styles.iconWrapper}>
        <Text className={styles.icon}>{template.icon}</Text>
      </View>
      <View className={styles.content}>
        <Text className={styles.name}>{template.name}</Text>
        <Text className={styles.description}>{template.description}</Text>
        <View className={styles.meta}>
          <Text className={styles.metaText}>提醒: {template.defaultReminderDays}天前</Text>
          <Text className={styles.useButton}>使用 →</Text>
        </View>
      </View>
    </View>
  );
};

export default TemplateCard;
