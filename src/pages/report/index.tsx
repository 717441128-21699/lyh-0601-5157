import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Button, PullToRefresh } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useContractStore } from '../../store/contractStore';
import StatCard from '../../components/StatCard';
import Chart from '../../components/Chart';
import { generateReportPDF } from '../../utils/pdf';
import { ContractType, ContractStatus } from '../../types/contract';

const typeColors: Record<ContractType, string> = {
  lease: '#3b82f6',
  loan: '#10b981',
  labor: '#f59e0b',
  other: '#8b5cf6'
};

const typeLabels: Record<ContractType, string> = {
  lease: '租赁合同',
  loan: '借款合同',
  labor: '劳动合同',
  other: '其他合同'
};

const ReportPage: React.FC = () => {
  const { contracts, monthlyReport, generateMonthlyReport, initStore } = useContractStore();
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    generateMonthlyReport(currentMonth);
  }, [currentMonth]);

  useDidShow(() => {
    console.log('[Report] 页面显示');
    generateMonthlyReport(currentMonth);
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    initStore();
    generateMonthlyReport(currentMonth);
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullToRefresh();
    }, 1000);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(dayjs(currentMonth).subtract(1, 'month').format('YYYY-MM'));
  };

  const handleNextMonth = () => {
    const nextMonth = dayjs(currentMonth).add(1, 'month');
    if (nextMonth.isBefore(dayjs().add(1, 'day'))) {
      setCurrentMonth(nextMonth.format('YYYY-MM'));
    } else {
      Taro.showToast({ title: '不能选择未来月份', icon: 'none' });
    }
  };

  const handleExport = async () => {
    if (!monthlyReport) return;
    setIsExporting(true);
    try {
      Taro.showLoading({ title: '正在生成...', mask: true });
      await generateReportPDF(monthlyReport);
      Taro.showToast({ title: '已保存到相册', icon: 'success' });
    } catch (error) {
      Taro.showToast({ title: '导出失败', icon: 'none' });
      console.error('Export error:', error);
    } finally {
      Taro.hideLoading();
      setIsExporting(false);
    }
  };

  const summaryStats = useMemo(() => {
    if (!monthlyReport) return null;
    return {
      total: monthlyReport.totalContracts,
      newThisMonth: monthlyReport.newThisMonth,
      totalAmount: monthlyReport.totalAmount,
      expiringSoon: monthlyReport.expiringThisMonth
    };
  }, [monthlyReport]);

  const statusDistribution = useMemo(() => {
    if (!monthlyReport) return [];
    const statusOrder: ContractStatus[] = ['draft', 'pending', 'negotiating', 'signed', 'expired'];
    const statusLabels: Record<ContractStatus, string> = {
      draft: '草稿',
      pending: '待签署',
      negotiating: '协商中',
      signed: '已签署',
      expired: '已过期'
    };
    return statusOrder.map(status => ({
      label: statusLabels[status],
      value: monthlyReport.statusDistribution[status] || 0,
      color: status === 'signed' ? '#059669' : status === 'pending' ? '#d97706' : '#64748b'
    })).filter(item => item.value > 0);
  }, [monthlyReport]);

  const typeDistribution = useMemo(() => {
    if (!monthlyReport) return [];
    return Object.entries(monthlyReport.typeDistribution).map(([type, count]) => ({
      label: typeLabels[type as ContractType],
      value: count,
      color: typeColors[type as ContractType]
    })).filter(item => item.value > 0);
  }, [monthlyReport]);

  const expirationData = useMemo(() => {
    if (!monthlyReport) return { labels: [], values: [] };
    return {
      labels: ['本月', '下月', '2个月', '3个月+'],
      values: [
        monthlyReport.expiringThisMonth,
        monthlyReport.expiringNextMonth,
        monthlyReport.expiringIn2Months,
        monthlyReport.expiringIn3PlusMonths
      ]
    };
  }, [monthlyReport]);

  const maxExpirationValue = Math.max(...expirationData.values, 1);

  const trendStats = useMemo(() => {
    if (!monthlyReport) return [];
    return [
      { label: '合同总数', value: monthlyReport.totalContracts, change: '+12%', down: false },
      { label: '新增合同', value: monthlyReport.newThisMonth, change: '+8%', down: false },
      { label: '合同金额', value: `¥${(monthlyReport.totalAmount / 10000).toFixed(1)}万`, change: '-3%', down: true }
    ];
  }, [monthlyReport]);

  if (!monthlyReport) {
    return (
      <View className={styles.pageContainer}>
        <View className={styles.loading}>
          <Text>正在加载报告...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.pageContainer}>
      <PullToRefresh onRefresh={handleRefresh} isRefresh={isRefreshing}>
        <View className={styles.reportHeader}>
          <Text className={styles.reportTitle}>月度合同报告</Text>
          <Text className={styles.reportSubtitle}>
            共 {summaryStats?.total || 0} 份合同，总金额 ¥{summaryStats?.totalAmount?.toLocaleString() || 0}
          </Text>

          <View className={styles.monthSelector}>
            <Text className={styles.monthArrow} onClick={handlePrevMonth}>‹</Text>
            <Text className={styles.monthText}>
              {dayjs(currentMonth).format('YYYY年M月')}
            </Text>
            <Text className={styles.monthArrow} onClick={handleNextMonth}>›</Text>
            <Button className={styles.exportBtn} onClick={handleExport} disabled={isExporting}>
              {isExporting ? '生成中' : '📥 导出'}
            </Button>
          </View>
        </View>

        <View className={styles.summaryCards}>
          <View className={styles.statsGrid}>
            <StatCard
              title="合同总数"
              value={summaryStats?.total || 0}
              icon="📊"
              theme="blue"
              subtitle={`本月新增 ${summaryStats?.newThisMonth || 0}`}
            />
            <StatCard
              title="总金额"
              value={`¥${(summaryStats?.totalAmount || 0).toLocaleString()}`}
              icon="💰"
              theme="green"
            />
            <StatCard
              title="本月到期"
              value={summaryStats?.expiringSoon || 0}
              icon="⏰"
              theme="orange"
            />
            <StatCard
              title="已签署"
              value={monthlyReport.statusDistribution.signed || 0}
              icon="✅"
              theme="purple"
              subtitle={`${(((monthlyReport.statusDistribution.signed || 0) / (monthlyReport.totalContracts || 1)) * 100).toFixed(0)}% 签署率`}
            />
          </View>
        </View>

        <View className={styles.chartSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📈</Text>
            到期分布
          </Text>
          <View className={styles.chartContainer}>
            <Chart.BarChart
              data={expirationData.labels.map((label, index) => ({
                label,
                value: expirationData.values[index]
              }))}
              maxValue={maxExpirationValue}
            />
          </View>
          <View className={styles.distributionList}>
            {expirationData.labels.map((label, index) => (
              <View key={label} className={styles.distributionItem}>
                <Text className={styles.distributionLabel}>{label}</Text>
                <View className={styles.distributionBar}>
                  <View
                    className={styles.distributionFill}
                    style={{ width: `${(expirationData.values[index] / maxExpirationValue) * 100}%` }}
                  />
                </View>
                <Text className={styles.distributionValue}>{expirationData.values[index]} 份</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.chartSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📊</Text>
            类型占比
          </Text>
          <View className={styles.chartContainer}>
            <Chart.PieChart data={typeDistribution} />
          </View>
          <View className={styles.typeLegend}>
            {typeDistribution.map(item => (
              <View key={item.label} className={styles.legendItem}>
                <View className={styles.legendDot} style={{ backgroundColor: item.color }} />
                <Text>{item.label} ({item.value})</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.chartSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📋</Text>
            状态分布
          </Text>
          <View className={styles.distributionList}>
            {statusDistribution.map(item => (
              <View key={item.label} className={styles.distributionItem}>
                <Text className={styles.distributionLabel}>{item.label}</Text>
                <View className={styles.distributionBar}>
                  <View
                    className={styles.distributionFill}
                    style={{
                      width: `${(item.value / monthlyReport.totalContracts) * 100}%`,
                      background: item.color
                    }}
                  />
                </View>
                <Text className={styles.distributionValue}>
                  {item.value} ({(((item.value / monthlyReport.totalContracts) * 100).toFixed(0))}%)
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.trendSection}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📊</Text>
            环比趋势
          </Text>
          <View className={styles.trendStats}>
            {trendStats.map(stat => (
              <View key={stat.label} className={styles.trendStat}>
                <Text className={styles.trendStatValue}>{stat.value}</Text>
                <Text className={styles.trendStatLabel}>{stat.label}</Text>
                <Text className={`${styles.trendStatChange} ${stat.down ? styles.down : ''}`}>
                  {stat.down ? '↓' : '↑'} {stat.change}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {contracts.length === 0 && (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📊</Text>
            <Text className={styles.emptyText}>
              还没有合同数据，快去起草第一份合同吧！
            </Text>
          </View>
        )}
      </PullToRefresh>
    </View>
  );
};

export default ReportPage;
