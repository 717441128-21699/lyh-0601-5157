import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartItem[];
  title?: string;
  showValue?: boolean;
  maxValue?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, title, showValue = true, maxValue }) => {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  const defaultColors = ['#1e3a8a', '#3b82f6', '#059669', '#d97706', '#dc2626'];

  return (
    <View className={styles.chartContainer}>
      {title && <Text className={styles.chartTitle}>{title}</Text>}
      <View className={styles.barChart}>
        {data.map((item, index) => {
          const heightPercent = (item.value / max) * 100;
          const color = item.color || defaultColors[index % defaultColors.length];
          return (
            <View key={index} className={styles.barItem}>
              <View className={styles.barWrapper}>
                <View 
                  className={styles.bar}
                  style={{ height: `${Math.max(heightPercent, 2)}%`, backgroundColor: color }}
                >
                  {showValue && heightPercent > 15 && (
                    <Text className={styles.barValue}>{item.value}</Text>
                  )}
                </View>
              </View>
              {showValue && heightPercent <= 15 && (
                <Text className={styles.barValueOutside}>{item.value}</Text>
              )}
              <Text className={styles.barLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

interface PieChartItem {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartItem[];
  title?: string;
  showLegend?: boolean;
}

export const PieChart: React.FC<PieChartProps> = ({ data, title, showLegend = true }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <View className={styles.chartContainer}>
      {title && <Text className={styles.chartTitle}>{title}</Text>}
      <View className={styles.pieChartWrapper}>
        <View className={styles.pieChart}>
          {data.map((item, index) => {
            const percent = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <View
                key={index}
                className={styles.pieSegment}
                style={{
                  background: `conic-gradient(${item.color} 0% ${percent}%, transparent ${percent}% 100%)`
                }}
              />
            );
          })}
          <View className={styles.pieCenter}>
            <Text className={styles.pieTotalText}>总计</Text>
            <Text className={styles.pieTotalValue}>{total}</Text>
          </View>
        </View>
        {showLegend && (
          <View className={styles.legend}>
            {data.map((item, index) => (
              <View key={index} className={styles.legendItem}>
                <View className={styles.legendDot} style={{ backgroundColor: item.color }} />
                <Text className={styles.legendLabel}>{item.label}</Text>
                <Text className={styles.legendValue}>
                  {item.value} ({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercent = true,
  color = '#1e3a8a',
  size = 'md'
}) => {
  const percent = Math.min((value / max) * 100, 100);

  return (
    <View className={classnames(styles.progressBar, styles[size])}>
      {label && <Text className={styles.progressLabel}>{label}</Text>}
      <View className={styles.progressTrack}>
        <View
          className={styles.progressFill}
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </View>
      {showPercent && (
        <Text className={styles.progressPercent}>{percent.toFixed(0)}%</Text>
      )}
    </View>
  );
};

const Chart = {
  BarChart,
  PieChart,
  ProgressBar
};

export default Chart;
