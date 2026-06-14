import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Switch, Input, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useContractStore } from '../../store/contractStore';
import { ReminderLevel } from '../../types/contract';

type ReminderFilter = 'all' | 'unread' | 'history';

const ReminderSettingsPage: React.FC = () => {
  const {
    reminders,
    reminderSettings,
    reminderEnabled,
    setReminderEnabled,
    updateReminderSettings,
    markReminderAsRead,
    clearExpiredReminders,
    checkReminders,
    handleContractRenewal,
    handleContractTermination
  } = useContractStore();

  const [activeFilter, setActiveFilter] = useState<ReminderFilter>('all');
  const [isTesting, setIsTesting] = useState(false);

  useDidShow(() => {
    console.log('[ReminderSettings] 页面显示');
    checkReminders();
  });

  const filteredReminders = useMemo(() => {
    let list = [...reminders].sort(
      (a, b) => new Date(b.reminderDate).getTime() - new Date(a.reminderDate).getTime()
    );
    
    if (activeFilter === 'unread') {
      list = list.filter(r => !r.read);
    } else if (activeFilter === 'history') {
      list = list.filter(r => r.read);
    }
    
    return list;
  }, [reminders, activeFilter]);

  const unreadCount = reminders.filter(r => !r.read).length;

  const handleDaysChange = (field: 'firstReminderDays' | 'secondReminderDays' | 'finalReminderDays', value: string) => {
    const days = parseInt(value) || 0;
    updateReminderSettings({ [field]: days });
  };

  const handleMethodToggle = (method: 'push' | 'sms' | 'email', enabled: boolean) => {
    updateReminderSettings({
      notificationMethods: {
        ...reminderSettings.notificationMethods,
        [method]: enabled
      }
    });
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      Taro.showLoading({ title: '正在发送测试通知...', mask: true });
      await new Promise(resolve => setTimeout(resolve, 1500));
      Taro.hideLoading();
      Taro.showToast({ title: '测试通知已发送', icon: 'success' });
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({ title: '发送失败', icon: 'none' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearRead = () => {
    Taro.showModal({
      title: '清除已读提醒',
      content: '确定要清除所有已读的提醒记录吗？',
      success: async (res) => {
        if (res.confirm) {
          await clearExpiredReminders();
          Taro.showToast({ title: '已清除', icon: 'success' });
        }
      }
    });
  };

  const handleReminderClick = (reminder) => {
    if (!reminder.read) {
      markReminderAsRead(reminder.id);
    }
    Taro.navigateTo({
      url: `/pages/contract-detail/index?id=${reminder.contractId}`
    });
  };

  const handleRenewal = (reminder) => {
    Taro.showModal({
      title: '续签合同',
      content: '确定要续签这份合同吗？',
      success: async (res) => {
        if (res.confirm) {
          const success = await handleContractRenewal(reminder.contractId);
          if (success) {
            Taro.showToast({ title: '已发起续签', icon: 'success' });
            Taro.navigateTo({
              url: `/pages/contract-detail/index?id=${reminder.contractId}`
            });
          } else {
            Taro.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  };

  const handleTermination = (reminder) => {
    Taro.showModal({
      title: '终止合同',
      content: '确定要终止这份合同吗？',
      confirmColor: '#dc2626',
      success: async (res) => {
        if (res.confirm) {
          const success = await handleContractTermination(reminder.contractId);
          if (success) {
            Taro.showToast({ title: '已终止', icon: 'success' });
          } else {
            Taro.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.pageHeader}>
        <Text className={styles.headerTitle}>提醒设置</Text>
        <Text className={styles.headerDesc}>
          管理合同到期提醒，设置提前通知天数和通知方式
        </Text>
      </View>

      <View className={styles.settingsSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>⚙️</Text>
          提醒规则设置
        </Text>
        
        <View className={styles.settingItem}>
          <View className={styles.settingInfo}>
            <Text className={styles.settingLabel}>开启到期提醒</Text>
            <Text className={styles.settingDesc}>
              合同到期前自动发送提醒通知
            </Text>
          </View>
          <Switch
            checked={reminderEnabled}
            onChange={(e) => setReminderEnabled(e.detail.value)}
            color="#1e3a8a"
          />
        </View>

        {reminderEnabled && (
          <View>
            <View className={styles.settingItem}>
              <View className={styles.settingInfo}>
                <Text className={styles.settingLabel}>第一次提醒</Text>
                <Text className={styles.settingDesc}>
                  到期前多少天发送第一次提醒
                </Text>
              </View>
              <View className={styles.daysSelector}>
                <Input
                  className={styles.daysInput}
                  type="number"
                  value={reminderSettings.firstReminderDays.toString()}
                  onInput={(e) => handleDaysChange('firstReminderDays', e.detail.value)}
                  maxLength={2}
                />
                <Text className={styles.daysUnit}>天</Text>
              </View>
            </View>

            <View className={styles.settingItem}>
              <View className={styles.settingInfo}>
                <Text className={styles.settingLabel}>第二次提醒</Text>
                <Text className={styles.settingDesc}>
                  到期前多少天发送第二次提醒（升级为紧急）
                </Text>
              </View>
              <View className={styles.daysSelector}>
                <Input
                  className={styles.daysInput}
                  type="number"
                  value={reminderSettings.secondReminderDays.toString()}
                  onInput={(e) => handleDaysChange('secondReminderDays', e.detail.value)}
                  maxLength={2}
                />
                <Text className={styles.daysUnit}>天</Text>
              </View>
            </View>

            <View className={styles.settingItem}>
              <View className={styles.settingInfo}>
                <Text className={styles.settingLabel}>最终提醒</Text>
                <Text className={styles.settingDesc}>
                  到期前多少天发送最终提醒（升级为紧急）
                </Text>
              </View>
              <View className={styles.daysSelector}>
                <Input
                  className={styles.daysInput}
                  type="number"
                  value={reminderSettings.finalReminderDays.toString()}
                  onInput={(e) => handleDaysChange('finalReminderDays', e.detail.value)}
                  maxLength={2}
                />
                <Text className={styles.daysUnit}>天</Text>
              </View>
            </View>

            <View className={styles.settingItem}>
              <View className={styles.settingInfo}>
                <Text className={styles.settingLabel}>通知方式</Text>
                <Text className={styles.settingDesc}>
                  选择接收提醒的方式
                </Text>
                <View className={styles.notificationMethods}>
                  <Text
                    className={classnames(
                      styles.methodTag,
                      reminderSettings.notificationMethods.push && styles.active
                    )}
                    onClick={() => handleMethodToggle('push', !reminderSettings.notificationMethods.push)}
                  >
                    推送
                  </Text>
                  <Text
                    className={classnames(
                      styles.methodTag,
                      reminderSettings.notificationMethods.sms && styles.active
                    )}
                    onClick={() => handleMethodToggle('sms', !reminderSettings.notificationMethods.sms)}
                  >
                    短信
                  </Text>
                  <Text
                    className={classnames(
                      styles.methodTag,
                      reminderSettings.notificationMethods.email && styles.active
                    )}
                    onClick={() => handleMethodToggle('email', !reminderSettings.notificationMethods.email)}
                  >
                    邮件
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      <View className={styles.levelExplanation}>
        <Text className={styles.explanationTitle}>提醒级别说明</Text>
        <View className={styles.explanationItem}>
          <View className={classnames(styles.levelDot, styles.normal)} />
          <Text className={styles.explanationText}>普通提醒</Text>
          <Text className={styles.explanationDays}>
            到期前 {reminderSettings.firstReminderDays} 天
          </Text>
        </View>
        <View className={styles.explanationItem}>
          <View className={classnames(styles.levelDot, styles.urgent)} />
          <Text className={styles.explanationText}>紧急提醒</Text>
          <Text className={styles.explanationDays}>
            到期前 {reminderSettings.secondReminderDays} 天
          </Text>
        </View>
        <View className={styles.explanationItem}>
          <View className={classnames(styles.levelDot, styles.critical)} />
          <Text className={styles.explanationText}>危急提醒</Text>
          <Text className={styles.explanationDays}>
            到期前 {reminderSettings.finalReminderDays} 天内
          </Text>
        </View>
      </View>

      <View className={styles.actionButtons}>
        <Button
          className={classnames(styles.actionButton, styles.clearBtn)}
          onClick={handleClearRead}
        >
          清除已读
        </Button>
        <Button
          className={classnames(styles.actionButton, styles.testBtn)}
          onClick={handleTestNotification}
          disabled={isTesting}
        >
          {isTesting ? '发送中' : '测试通知'}
        </Button>
      </View>

      <View className={styles.reminderListSection}>
        <Text className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>🔔</Text>
          提醒记录
          {unreadCount > 0 && (
            <Text
              style={{
                marginLeft: 8,
                backgroundColor: '#dc2626',
                color: '#fff',
                fontSize: 20,
                padding: '2rpx 12rpx',
                borderRadius: 20
              }}
            >
              {unreadCount}
            </Text>
          )}
        </Text>

        <View className={styles.reminderTabs}>
          <View
            className={classnames(styles.reminderTab, activeFilter === 'all' && styles.active)}
            onClick={() => setActiveFilter('all')}
          >
            <Text className={styles.reminderTabText}>全部</Text>
          </View>
          <View
            className={classnames(styles.reminderTab, activeFilter === 'unread' && styles.active)}
            onClick={() => setActiveFilter('unread')}
          >
            <Text className={styles.reminderTabText}>未读 ({unreadCount})</Text>
          </View>
          <View
            className={classnames(styles.reminderTab, activeFilter === 'history' && styles.active)}
            onClick={() => setActiveFilter('history')}
          >
            <Text className={styles.reminderTabText}>历史</Text>
          </View>
        </View>

        <View className={styles.reminderList}>
          {filteredReminders.length > 0 ? (
            filteredReminders.map(reminder => (
              <View
                key={reminder.id}
                className={classnames(
                  styles.reminderItem,
                  reminder.level === 'urgent' && styles.urgent,
                  reminder.level === 'critical' && styles.critical,
                  reminder.read && styles.read
                )}
                onClick={() => handleReminderClick(reminder)}
              >
                <View className={styles.reminderIcon}>
                  <Text>
                    {reminder.type === 'renewal' ? '🔄' :
                     reminder.type === 'termination' ? '⏹️' : '⏰'}
                  </Text>
                </View>
                <View className={styles.reminderContent}>
                  <Text className={styles.reminderTitle}>
                    {reminder.title}
                    {!reminder.read && (
                      <Text
                        style={{
                          marginLeft: 8,
                          backgroundColor: '#dc2626',
                          color: '#fff',
                          fontSize: 18,
                          padding: '0 8rpx',
                          borderRadius: 12
                        }}
                      >
                        新
                      </Text>
                    )}
                  </Text>
                  <Text className={styles.reminderDesc}>{reminder.message}</Text>
                  <Text className={styles.reminderTime}>
                    {dayjs(reminder.reminderDate).format('YYYY-MM-DD HH:mm')}
                  </Text>
                  
                  {!reminder.read && (
                    <View className={styles.reminderActions}>
                      <Button
                        className={classnames(styles.actionBtn, styles.primaryAction)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenewal(reminder);
                        }}
                      >
                        续签
                      </Button>
                      <Button
                        className={classnames(styles.actionBtn, styles.dangerAction)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTermination(reminder);
                        }}
                      >
                        终止
                      </Button>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>🔔</Text>
              <Text className={styles.emptyText}>
                {activeFilter === 'unread'
                  ? '暂无未读提醒'
                  : activeFilter === 'history'
                    ? '暂无历史提醒'
                    : '暂无提醒记录'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default ReminderSettingsPage;
