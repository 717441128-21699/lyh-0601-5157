import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView, Button, PullToRefresh } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useContractStore } from '../../store/contractStore';
import ContractCard from '../../components/ContractCard';
import { ContractStatus, ContractType } from '../../types/contract';

const statusTabs: Array<{ key: ContractStatus | 'all'; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'draft', label: '草稿' },
  { key: 'pending', label: '待签署' },
  { key: 'negotiating', label: '协商中' },
  { key: 'signed', label: '已签署' },
  { key: 'expired', label: '已过期' }
];

const typeFilters: Array<{ key: ContractType | 'all'; label: string }> = [
  { key: 'all', label: '全部类型' },
  { key: 'lease', label: '租赁' },
  { key: 'loan', label: '借款' },
  { key: 'labor', label: '劳动' },
  { key: 'other', label: '其他' }
];

const ContractsPage: React.FC = () => {
  const {
    contracts,
    filterStatus,
    filterType,
    searchKeyword,
    setFilterStatus,
    setFilterType,
    setSearchKeyword,
    getFilteredContracts,
    initStore
  } = useContractStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useDidShow(() => {
    console.log('[Contracts] 页面显示');
  });

  const filteredContracts = useMemo(() => {
    let list = getFilteredContracts();
    list = [...list].sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    return list;
  }, [contracts, filterStatus, filterType, searchKeyword, sortOrder]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    initStore();
    setTimeout(() => {
      setIsRefreshing(false);
      Taro.stopPullToRefresh();
    }, 1000);
  };

  const handleSearch = (e) => {
    setSearchKeyword(e.detail.value);
  };

  const handleStatusChange = (status: ContractStatus | 'all') => {
    setFilterStatus(status);
  };

  const handleTypeChange = (type: ContractType | 'all') => {
    setFilterType(type);
  };

  const handleSort = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const handleCreate = () => {
    Taro.navigateTo({ url: '/pages/template-select/index' });
  };

  const stats = useMemo(() => ({
    total: contracts.length,
    filtered: filteredContracts.length
  }), [contracts.length, filteredContracts.length]);

  return (
    <View className={styles.pageContainer}>
      <PullToRefresh onRefresh={handleRefresh} isRefresh={isRefreshing}>
        <View className={styles.searchSection}>
          <View className={styles.searchBar}>
            <Text className={styles.searchIcon}>🔍</Text>
            <Input
              className={styles.searchInput}
              placeholder="搜索合同名称、双方名称、编号"
              value={searchKeyword}
              onInput={handleSearch}
              confirmType="search"
            />
          </View>

          <ScrollView className={styles.filterTabs} scrollX enableFlex>
            {statusTabs.map(tab => (
              <View
                key={tab.key}
                className={classnames(styles.filterTab, filterStatus === tab.key && styles.active)}
                onClick={() => handleStatusChange(tab.key)}
              >
                <Text className={styles.filterTabText}>{tab.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View className={styles.filterSection}>
          <View className={styles.typeFilters}>
            {typeFilters.map(filter => (
              <View
                key={filter.key}
                className={classnames(styles.typeFilter, filterType === filter.key && styles.active)}
                onClick={() => handleTypeChange(filter.key)}
              >
                <Text className={styles.typeFilterText}>{filter.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.contractList}>
          <View className={styles.statsBar}>
            <Text className={styles.statsText}>
              共 {stats.filtered} 份{filterStatus !== 'all' ? ` · ${statusTabs.find(t => t.key === filterStatus)?.label}` : ''}
              {filterType !== 'all' ? ` · ${typeFilters.find(t => t.key === filterType)?.label}` : ''}
            </Text>
            <Text className={styles.sortBtn} onClick={handleSort}>
              {sortOrder === 'desc' ? '↓ 最新更新' : '↑ 最早更新'}
            </Text>
          </View>

          {filteredContracts.length > 0 ? (
            <View>
              {filteredContracts.map(contract => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
              <View className={styles.loadMore}>
                <Text>已加载全部 {filteredContracts.length} 份合同</Text>
              </View>
            </View>
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>📄</Text>
              <Text className={styles.emptyText}>
                {searchKeyword || filterStatus !== 'all' || filterType !== 'all'
                  ? '没有找到符合条件的合同'
                  : '还没有任何合同'}
              </Text>
              <Button className={styles.createBtn} onClick={handleCreate}>
                + 起草合同
              </Button>
            </View>
          )}
        </View>
      </PullToRefresh>

      <View className={styles.floatingBtn} onClick={handleCreate}>
        <Text className={styles.floatingBtnIcon}>+</Text>
      </View>
    </View>
  );
};

export default ContractsPage;
