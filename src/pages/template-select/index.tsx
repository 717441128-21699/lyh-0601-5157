import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { contractTemplates } from '../../data/templates';
import TemplateCard from '../../components/TemplateCard';
import { useContractStore } from '../../store/contractStore';
import { ContractType, ContractTemplate } from '../../types/contract';

const typeTabs: Array<{ key: ContractType | 'all'; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'lease', label: '租赁' },
  { key: 'loan', label: '借款' },
  { key: 'labor', label: '劳动' },
  { key: 'other', label: '其他' }
];

const TemplateSelectPage: React.FC = () => {
  const { createContractFromTemplate } = useContractStore();
  const [selectedType, setSelectedType] = useState<ContractType | 'all'>('all');

  const filteredTemplates = useMemo(() => {
    if (selectedType === 'all') return contractTemplates;
    return contractTemplates.filter(t => t.type === selectedType);
  }, [selectedType]);

  const handleSelectTemplate = (template: ContractTemplate) => {
    Taro.showModal({
      title: '确认选择',
      content: `确定使用「${template.name}」模板吗？`,
      success: (res) => {
        if (res.confirm) {
          const contractId = createContractFromTemplate(template.id);
          Taro.navigateTo({
            url: `/pages/contract-form/index?id=${contractId}`
          });
        }
      }
    });
  };

  const handleCustomContract = () => {
    const blankTemplate = contractTemplates.find(t => t.id === 'blank');
    if (blankTemplate) {
      const contractId = createContractFromTemplate(blankTemplate.id);
      Taro.navigateTo({
        url: `/pages/contract-form/index?id=${contractId}`
      });
    }
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.pageHeader}>
        <Text className={styles.headerTitle}>选择合同模板</Text>
        <Text className={styles.headerDesc}>
          选择合适的模板快速起草合同，也可以创建空白合同自定义内容
        </Text>
      </View>

      <View className={styles.typeTabs}>
        {typeTabs.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.typeTab, selectedType === tab.key && styles.active)}
            onClick={() => setSelectedType(tab.key)}
          >
            <Text className={styles.typeTabText}>{tab.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.templateList}>
        {filteredTemplates.filter(t => t.id !== 'blank').length > 0 ? (
          <View className={styles.templateGrid}>
            {filteredTemplates
              .filter(t => t.id !== 'blank')
              .map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => handleSelectTemplate(template)}
                />
              ))}
          </View>
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>该分类下暂无模板</Text>
          </View>
        )}
      </View>

      <View className={styles.customSection}>
        <Text className={styles.customTitle}>
          <Text className={styles.customIcon}>✏️</Text>
          创建空白合同
        </Text>
        <Text className={styles.customDesc}>
          没有找到合适的模板？创建一份空白合同，完全自定义内容和条款
        </Text>
        <Button className={styles.customBtn} onClick={handleCustomContract}>
          + 创建空白合同
        </Button>
      </View>
    </View>
  );
};

export default TemplateSelectPage;
