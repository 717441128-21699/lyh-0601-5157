import { Contract, RiskItem, ContractType, RiskLevel } from '../types/contract';
import { complianceRules } from '../data/complianceRules';

export const checkCompliance = (contract: Contract, region: string = 'default'): RiskItem[] => {
  console.log('[Compliance] 开始合规检查', { contractId: contract.id, type: contract.type, region });
  
  const risks: RiskItem[] = [];
  const typeRules = complianceRules[contract.type] || [];
  const generalRules = complianceRules.general || [];
  const allRules = [...generalRules, ...typeRules];

  allRules.forEach(rule => {
    if (rule.applicableRegions && !rule.applicableRegions.includes(region) && !rule.applicableRegions.includes('all')) {
      return;
    }

    const checkResult = rule.check(contract);
    if (checkResult) {
      risks.push({
        id: `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        level: rule.level,
        title: rule.title,
        description: checkResult,
        suggestion: rule.suggestion,
        field: rule.field
      });
    }
  });

  console.log('[Compliance] 合规检查完成', { riskCount: risks.length, risks: risks.map(r => r.title) });
  return risks;
};

export const getRiskLevelColor = (level: RiskLevel): string => {
  const colors: Record<RiskLevel, string> = {
    high: '#dc2626',
    medium: '#d97706',
    low: '#059669'
  };
  return colors[level] || '#94a3b8';
};

export const getRiskLevelText = (level: RiskLevel): string => {
  const texts: Record<RiskLevel, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险'
  };
  return texts[level] || '未知';
};

export const filterRisksByLevel = (risks: RiskItem[], level: RiskLevel): RiskItem[] => {
  return risks.filter(r => r.level === level);
};

export const getRiskStatistics = (risks: RiskItem[]) => {
  return {
    total: risks.length,
    high: risks.filter(r => r.level === 'high').length,
    medium: risks.filter(r => r.level === 'medium').length,
    low: risks.filter(r => r.level === 'low').length
  };
};

export const autoFixRisk = (contract: Contract, riskId: string): Contract => {
  console.log('[Compliance] 尝试自动修复风险', { riskId });
  const updatedContract = { ...contract };
  const risk = contract.risks.find(r => r.id === riskId);
  
  if (risk) {
    if (risk.field === 'amount' && risk.title.includes('金额过低')) {
      updatedContract.amount = Math.max(contract.amount, 1000);
    }
    if (risk.field === 'endDate' && risk.title.includes('期限过长')) {
      const maxDate = new Date(contract.startDate);
      maxDate.setFullYear(maxDate.getFullYear() + 20);
      updatedContract.endDate = maxDate.toISOString().split('T')[0];
    }
  }
  
  return updatedContract;
};
