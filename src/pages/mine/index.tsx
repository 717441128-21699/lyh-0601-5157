import React, { useState, useMemo } from 'react';
import { View, Text, Switch } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useContractStore } from '../../store/contractStore';

interface MenuItem {
  icon: string;
  iconClass: string;
  title: string;
  subtitle?: string;
  badge?: number;
  url?: string;
  action?: () => void;
  hasToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
}

const MinePage: React.FC = () => {
  const {
    contracts,
    reminders,
    reminderEnabled,
    setReminderEnabled,
    checkReminders,
    clearExpiredReminders
  } = useContractStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useDidShow(() => {
    console.log('[Mine] 页面显示');
    checkReminders();
  });

  const userStats = useMemo(() => {
    const signed = contracts.filter(c => c.status === 'signed').length;
    const pending = contracts.filter(c => c.status === 'pending').length;
    const expiring = reminders.filter(r => r.level !== 'normal').length;
    return { total: contracts.length, signed, pending, expiring };
  }, [contracts, reminders]);

  const unreadReminders = reminders.filter(r => !r.read).length;

  const contractMenus: MenuItem[] = [
    {
      icon: '📝',
      iconClass: styles.menuIconBlue,
      title: '我的草稿',
      subtitle: `${contracts.filter(c => c.status === 'draft').length} 份`,
      url: '/pages/contracts/index?status=draft'
    },
    {
      icon: '✍️',
      iconClass: styles.menuIconOrange,
      title: '待我签署',
      subtitle: `${contracts.filter(c => c.status === 'pending').length} 份`,
      badge: contracts.filter(c => c.status === 'pending').length,
      url: '/pages/contracts/index?status=pending'
    },
    {
      icon: '💬',
      iconClass: styles.menuIconGreen,
      title: '协商中',
      subtitle: `${contracts.filter(c => c.status === 'negotiating').length} 份`,
      badge: contracts.filter(c => c.status === 'negotiating').length,
      url: '/pages/contracts/index?status=negotiating'
    },
    {
      icon: '📁',
      iconClass: styles.menuIconPurple,
      title: '合同归档',
      subtitle: '已签署的合同',
      url: '/pages/contracts/index?status=signed'
    }
  ];

  const toolMenus: MenuItem[] = [
    {
      icon: '🔔',
      iconClass: styles.menuIconOrange,
      title: '提醒设置',
      subtitle: '到期提醒、通知方式',
      badge: unreadReminders,
      url: '/pages/reminder-settings/index'
    },
    {
      icon: '⚙️',
      iconClass: styles.menuIconBlue,
      title: '通知开关',
      hasToggle: true,
      toggleValue: notificationsEnabled,
      onToggle: (value) => setNotificationsEnabled(value)
    },
    {
      icon: '⏰',
      iconClass: styles.menuIconPurple,
      title: '到期提醒',
      hasToggle: true,
      toggleValue: reminderEnabled,
      onToggle: (value) => setReminderEnabled(value)
    },
    {
      icon: '📜',
      iconClass: styles.menuIconGreen,
      title: '法规库',
      subtitle: '常用法律法规查询',
      action: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    }
  ];

  const otherMenus: MenuItem[] = [
    {
      icon: '❓',
      iconClass: styles.menuIconBlue,
      title: '帮助中心',
      subtitle: '使用指南、常见问题',
      action: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
    {
      icon: '📢',
      iconClass: styles.menuIconGreen,
      title: '意见反馈',
      action: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
    },
    {
      icon: 'ℹ️',
      iconClass: styles.menuIconPurple,
      title: '关于我们',
      subtitle: '版本 v1.0.0',
      action: () => Taro.showModal({
        title: '合同管家',
        content: '版本 1.0.0\n\n个人法律文书起草与合同管理应用，让合同管理更简单、更合规。',
        showCancel: false
      })
    }
  ];

  const handleMenuClick = (menu: MenuItem) => {
    if (menu.action) {
      menu.action();
    } else if (menu.url) {
      Taro.navigateTo({ url: menu.url });
    }
  };

  const renderMenuItem = (menu: MenuItem, index: number) => (
    <View
      key={`${menu.title}-${index}`}
      className={styles.menuItem}
      onClick={() => !menu.hasToggle && handleMenuClick(menu)}
    >
      <View className={classnames(styles.menuIcon, menu.iconClass)}>
        <Text>{menu.icon}</Text>
      </View>
      <View className={styles.menuContent}>
        <View>
          <View className={styles.reminderToggle}>
            {menu.badge && menu.badge > 0 && (
              <Text className={styles.menuBadge}>{menu.badge}</Text>
            )}
            <Text className={styles.menuText}>{menu.title}</Text>
          </View>
          {menu.subtitle && (
            <Text className={styles.menuSubtitle}>{menu.subtitle}</Text>
          )}
        </View>
        {menu.hasToggle ? (
          <Switch
            checked={menu.toggleValue}
            onChange={(e) => menu.onToggle?.(e.detail.value)}
            color="#1e3a8a"
          />
        ) : (
          <Text className={styles.menuArrow}>›</Text>
        )}
      </View>
    </View>
  );

  return (
    <View className={styles.pageContainer}>
      <View className={styles.userHeader}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            <Text className={styles.avatarIcon}>👤</Text>
          </View>
          <View className={styles.userText}>
            <Text className={styles.userName}>合同用户</Text>
            <Text className={styles.userId}>ID: HT2025001</Text>
          </View>
        </View>

        <View className={styles.userStats}>
          <View className={styles.userStat}>
            <Text className={styles.userStatValue}>{userStats.total}</Text>
            <Text className={styles.userStatLabel}>合同总数</Text>
          </View>
          <View className={styles.userStat}>
            <Text className={styles.userStatValue}>{userStats.signed}</Text>
            <Text className={styles.userStatLabel}>已签署</Text>
          </View>
          <View className={styles.userStat}>
            <Text className={styles.userStatValue}>{userStats.pending}</Text>
            <Text className={styles.userStatLabel}>待签署</Text>
          </View>
          <View className={styles.userStat}>
            <Text className={styles.userStatValue}>{userStats.expiring}</Text>
            <Text className={styles.userStatLabel}>紧急提醒</Text>
          </View>
        </View>
      </View>

      <Text className={styles.sectionTitle}>合同管理</Text>
      <View className={styles.section}>
        <View className={styles.menuList}>
          {contractMenus.map(renderMenuItem)}
        </View>
      </View>

      <Text className={styles.sectionTitle}>常用工具</Text>
      <View className={styles.settingsGroup}>
        <View className={styles.menuList}>
          {toolMenus.map(renderMenuItem)}
        </View>
      </View>

      <Text className={styles.sectionTitle}>其他</Text>
      <View className={styles.section}>
        <View className={styles.menuList}>
          {otherMenus.map(renderMenuItem)}
        </View>
      </View>

      <View className={styles.versionInfo}>
        <Text>合同管家 v1.0.0 © 2025</Text>
      </View>
    </View>
  );
};

export default MinePage;
