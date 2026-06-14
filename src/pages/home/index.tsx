import React, { useEffect, useState } from 'react';
import { View, Text, Button, PullToRefresh, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useContractStore } from '../../store/contractStore';
import ContractCard from '../../components/ContractCard';
import TemplateCard from '../../components/TemplateCard';
import { contractTemplates } from '../../data/templates';
import dayjs from 'dayjs';

const HomePage: React.FC = () => {
  const {
    contracts,
    initStore,
    getFilteredContracts,
    checkAndSendReminders,
    reminderSettings
  } = useContractStore();

  const [greeting, setGreeting] = useState('');
  const [expiringContracts, setExpiringContracts] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    initStore();
    updateGreeting();
  }, []);

  useDidShow(() => {
    checkExpiringContracts();
    setTimeout(() => {
      checkAndSendReminders();
    }, 1000);
  });

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('凌晨好');
    else if (hour < 9) setGreeting('早上好');
    else if (hour < 12) setGreeting('上午好');
    else if (hour < 14) setGreeting('中午好');
    else if (hour < 18) setGreeting('下午好');
    else if (hour < 22) setGreeting('晚上好');
    else setGreeting('深夜好');
  };

  const checkExpiringContracts = () => {
    const now = dayjs();
    const expiring = contracts.filter(c => {
      if (c.status !== 'signed') return false;
      const daysToExpiry = dayjs(c.endDate).diff(now, 'day');
      return daysToExpiry <= reminderSettings.defaultDays && daysToExpiry >= 0;
    });
    setExpiringContracts(expiring);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    initStore();
    checkExpiringContracts();
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullToRefresh();
    }, 1000);
  };

  const handleQuickAction = (action: string) => {
    console.log('[Home] 点击快捷操作', { action });
    switch (action) {
      case 'create':
        Taro.navigateTo({ url: '/pages/template-select/index' });
        break;
      case 'templates':
        Taro.navigateTo({ url: '/pages/template-select/index' });
        break;
      case 'drafts':
        Taro.switchTab({ url: '/pages/contracts/index' });
        break;
      case 'reminders':
        Taro.navigateTo({ url: '/pages/reminder-settings/index' });
        break;
    }
  };

  const handleTemplateSelect = (template) => {
    console.log('[Home] 选择模板', { templateId: template.id });
    Taro.navigateTo({
      url: `/pages/contract-edit/index?templateId=${template.id}`
    });
  };

  const handleViewAll = () => {
    Taro.switchTab({ url: '/pages/contracts/index' });
  };

  const handleViewAllTemplates = () => {
    Taro.navigateTo({ url: '/pages/template-select/index' });
  };

  const recentContracts = getFilteredContracts().slice(0, 3);
  const popularTemplates = contractTemplates.slice(0, 3);

  const stats = [
    {
      icon: '📄',
      value: contracts.length,
      label: '合同总数',
      color: 'primary'
    },
    {
      icon: '✍️',
      value: contracts.filter(c => c.status === 'pending').length,
      label: '待签署',
      color: 'warning'
    },
    {
      icon: '✅',
      value: contracts.filter(c => c.status === 'signed').length,
      label: '已签署',
      color: 'success'
    },
    {
      icon: '⏰',
      value: expiringContracts.length,
      label: '即将到期',
      color: 'error'
    }
  ];

  const quickActions = [
    { icon: '✍️', text: '起草合同', action: 'create' },
    { icon: '📚', text: '模板库', action: 'templates' },
    { icon: '📝', text: '草稿箱', action: 'drafts' },
    { icon: '🔔', text: '提醒设置', action: 'reminders' }
  ];

  return (
    <View className={styles.pageContainer}>
      <PullToRefresh onRefresh={handleRefresh} isRefresh={isRefreshing}>
        <View className={styles.header}>
          <View className={styles.welcomeSection}>
            <Text className={styles.welcomeText}>{greeting}，欢迎使用</Text>
            <Text className={styles.subText}>智能合同管家，让合同管理更简单</Text>
          </View>

          {expiringContracts.length > 0 && (
            <View className={styles.reminderBanner} onClick={() => Taro.switchTab({ url: '/pages/contracts/index' })}>
              <Text className={styles.reminderIcon}>⏰</Text>
              <View className={styles.reminderContent}>
                <Text className={styles.reminderTitle}>合同到期提醒</Text>
                <Text className={styles.reminderDesc}>
                  有 {expiringContracts.length} 份合同即将到期，请及时处理
                </Text>
              </View>
              <Text className={styles.reminderCount}>{expiringContracts.length}</Text>
            </View>
          )}
        </View>

        <View className={styles.quickActions}>
          {quickActions.map((item, index) => (
            <View
              key={index}
              className={styles.actionCard}
              onClick={() => handleQuickAction(item.action)}
            >
              <View className={styles.actionIcon}>
                <Text>{item.icon}</Text>
              </View>
              <Text className={styles.actionText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <ScrollView scrollY>
          <View className={styles.statsSection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>数据概览</Text>
            </View>
            <ScrollView className={styles.statsScroll} scrollX enableFlex>
              {stats.map((stat, index) => (
                <View key={index} className={styles.statCard}>
                  <View className={`${styles.statIcon} ${styles[stat.color]}`}>
                    <Text>{stat.icon}</Text>
                  </View>
                  <Text className={styles.statValue}>{stat.value}</Text>
                  <Text className={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          <View className={styles.templatePreview}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>常用模板</Text>
              <Text className={styles.viewAllBtn} onClick={handleViewAllTemplates}>
                查看全部 →
              </Text>
            </View>
            <View className={styles.templateList}>
              {popularTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleTemplateSelect}
                />
              ))}
            </View>
          </View>

          <View className={styles.recentSection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>近期合同</Text>
              <Text className={styles.viewAllBtn} onClick={handleViewAll}>
                查看全部 →
              </Text>
            </View>

            {recentContracts.length > 0 ? (
              recentContracts.map(contract => (
                <ContractCard key={contract.id} contract={contract} />
              ))
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📄</Text>
                <Text className={styles.emptyText}>暂无合同，点击上方按钮起草第一份合同</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </PullToRefresh>
    </View>
  );
};

export default HomePage;
