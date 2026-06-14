import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { RiskItem as RiskItemType } from '../../types/contract';
import { getRiskLevelText, getRiskLevelColor } from '../../utils/compliance';

interface RiskItemProps {
  risk: RiskItemType;
  onFix?: () => void;
  showFixButton?: boolean;
}

const RiskItem: React.FC<RiskItemProps> = ({ risk, onFix, showFixButton = false }) => {
  const levelText = getRiskLevelText(risk.level);
  const levelColor = getRiskLevelColor(risk.level);

  const icons: Record<string, string> = {
    high: '🔴',
    medium: '🟡',
    low: '🟢'
  };

  return (
    <View className={classnames(styles.riskItem, styles[risk.level])}>
      <View className={styles.riskHeader}>
        <View className={styles.riskTitleRow}>
          <Text className={styles.riskIcon}>{icons[risk.level]}</Text>
          <Text className={styles.riskTitle}>{risk.title}</Text>
          <View className={styles.riskLevelBadge} style={{ backgroundColor: `${levelColor}15`, color: levelColor }}>
            <Text className={styles.riskLevelText}>{levelText}</Text>
          </View>
        </View>
      </View>
      
      <View className={styles.riskBody}>
        <Text className={styles.riskDescription}>{risk.description}</Text>
        <View className={styles.suggestionBox}>
          <Text className={styles.suggestionLabel}>💡 修改建议</Text>
          <Text className={styles.suggestionText}>{risk.suggestion}</Text>
        </View>
      </View>

      {showFixButton && onFix && (
        <View className={styles.riskFooter}>
          <Button 
            className={styles.fixButton}
            onClick={(e) => {
              e.stopPropagation();
              onFix();
            }}
          >
            一键修复
          </Button>
        </View>
      )}
    </View>
  );
};

export default RiskItem;
