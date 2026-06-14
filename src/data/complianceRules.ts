import { Contract, RiskLevel } from '../types/contract';

interface ComplianceRule {
  id: string;
  title: string;
  level: RiskLevel;
  field?: string;
  applicableRegions: string[];
  check: (contract: Contract) => string | null;
  suggestion: string;
}

export const complianceRules: Record<string, ComplianceRule[]> = {
  general: [
    {
      id: 'rule_amount_min',
      title: '合同金额过低',
      level: 'medium',
      field: 'amount',
      applicableRegions: ['all'],
      check: (contract) => {
        if (contract.amount < 100) {
          return `合同金额(${contract.amount}元)过低，可能存在风险`;
        }
        return null;
      },
      suggestion: '建议核实合同金额是否正确，如确为小额交易请注明原因'
    },
    {
      id: 'rule_date_past',
      title: '开始日期已过期',
      level: 'high',
      field: 'startDate',
      applicableRegions: ['all'],
      check: (contract) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(contract.startDate);
        if (startDate < today) {
          return '合同开始日期早于当前日期';
        }
        return null;
      },
      suggestion: '请将开始日期设置为当前日期或之后的日期'
    },
    {
      id: 'rule_duration_max',
      title: '合同期限过长',
      level: 'medium',
      field: 'endDate',
      applicableRegions: ['all'],
      check: (contract) => {
        const start = new Date(contract.startDate);
        const end = new Date(contract.endDate);
        const durationYears = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (durationYears > 20) {
          return `合同期限(${durationYears.toFixed(1)}年)超过20年，可能不符合法律规定`;
        }
        return null;
      },
      suggestion: '根据《民法典》规定，租赁合同期限不得超过20年，建议调整合同期限'
    },
    {
      id: 'rule_party_missing',
      title: '签约方信息不完整',
      level: 'high',
      field: 'partyA',
      applicableRegions: ['all'],
      check: (contract) => {
        if (!contract.partyA.name || !contract.partyA.idNumber || !contract.partyA.phone) {
          return '甲方信息不完整，缺少必要字段';
        }
        if (!contract.partyB.name || !contract.partyB.idNumber || !contract.partyB.phone) {
          return '乙方信息不完整，缺少必要字段';
        }
        return null;
      },
      suggestion: '请完整填写双方的姓名、身份证号、联系电话等必要信息'
    },
    {
      id: 'rule_id_invalid',
      title: '身份证号格式异常',
      level: 'high',
      field: 'partyA',
      applicableRegions: ['all'],
      check: (contract) => {
        const idRegex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
        if (!idRegex.test(contract.partyA.idNumber)) {
          return '甲方身份证号格式不正确';
        }
        if (!idRegex.test(contract.partyB.idNumber)) {
          return '乙方身份证号格式不正确';
        }
        return null;
      },
      suggestion: '请检查身份证号是否为18位有效格式'
    }
  ],
  lease: [
    {
      id: 'rule_lease_deposit',
      title: '押金金额过高',
      level: 'medium',
      field: 'amount',
      applicableRegions: ['all'],
      check: (contract) => {
        const depositClause = contract.clauses.find(c => c.title.includes('押金'));
        if (depositClause) {
          const match = depositClause.content.match(/(\d+)/);
          if (match) {
            const deposit = parseInt(match[1]);
            const monthlyRent = contract.amount;
            if (deposit > monthlyRent * 3) {
              return `押金(${deposit}元)超过月租金(${monthlyRent}元)的3倍`;
            }
          }
        }
        return null;
      },
      suggestion: '根据相关规定，押金一般不超过3个月租金，建议调整押金金额'
    },
    {
      id: 'rule_lease_purpose',
      title: '租赁用途不明确',
      level: 'low',
      field: 'clauses',
      applicableRegions: ['all'],
      check: (contract) => {
        const purposeClause = contract.clauses.find(c => c.title.includes('用途'));
        if (purposeClause && purposeClause.content.includes('[用途]')) {
          return '租赁用途未明确填写';
        }
        return null;
      },
      suggestion: '请明确填写租赁物的具体用途'
    },
    {
      id: 'rule_lease_address',
      title: '租赁物地址不明确',
      level: 'high',
      field: 'clauses',
      applicableRegions: ['all'],
      check: (contract) => {
        const descClause = contract.clauses.find(c => c.title.includes('租赁物描述'));
        if (descClause && descClause.content.includes('[地址]')) {
          return '租赁物地址未明确填写';
        }
        return null;
      },
      suggestion: '请完整填写租赁物的详细地址'
    }
  ],
  loan: [
    {
      id: 'rule_loan_rate',
      title: '利率可能超过法定上限',
      level: 'high',
      field: 'clauses',
      applicableRegions: ['all'],
      check: (contract) => {
        const rateClause = contract.clauses.find(c => c.title.includes('利率'));
        if (rateClause) {
          const match = rateClause.content.match(/(\d+\.?\d*)\s*%/);
          if (match) {
            const rate = parseFloat(match[1]);
            if (rate > 24) {
              return `借款年利率(${rate}%)可能超过法定保护上限`;
            }
            if (rate > 15.4) {
              return `借款年利率(${rate}%)较高，请注意风险`;
            }
          }
        }
        return null;
      },
      suggestion: '根据最新司法解释，民间借贷利率受LPR4倍限制，建议合理设定利率'
    },
    {
      id: 'rule_loan_purpose',
      title: '借款用途不明确',
      level: 'medium',
      field: 'clauses',
      applicableRegions: ['all'],
      check: (contract) => {
        const purposeClause = contract.clauses.find(c => c.title.includes('用途'));
        if (purposeClause && purposeClause.content.includes('[用途]')) {
          return '借款用途未明确填写';
        }
        return null;
      },
      suggestion: '请明确填写借款的具体用途'
    }
  ],
  labor: [
    {
      id: 'rule_labor_probation',
      title: '试用期可能过长',
      level: 'medium',
      field: 'endDate',
      applicableRegions: ['all'],
      check: (contract) => {
        const start = new Date(contract.startDate);
        const end = new Date(contract.endDate);
        const durationMonths = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (durationMonths >= 3 && durationMonths < 12) {
          return '合同期限1年以下，试用期不得超过1个月';
        }
        if (durationMonths >= 12 && durationMonths < 36) {
          return '合同期限1-3年，试用期不得超过2个月';
        }
        if (durationMonths >= 36) {
          return '合同期限3年以上，试用期不得超过6个月';
        }
        return null;
      },
      suggestion: '根据《劳动合同法》规定，试用期与合同期限相关联，请合理设定'
    },
    {
      id: 'rule_labor_salary',
      title: '工资可能低于最低工资标准',
      level: 'high',
      field: 'amount',
      applicableRegions: ['all'],
      check: (contract) => {
        const monthlySalary = contract.amount;
        if (monthlySalary < 2000) {
          return `月工资(${monthlySalary}元)可能低于当地最低工资标准`;
        }
        return null;
      },
      suggestion: '请核实当地最低工资标准，确保工资不低于法定标准'
    },
    {
      id: 'rule_labor_position',
      title: '工作岗位不明确',
      level: 'medium',
      field: 'clauses',
      applicableRegions: ['all'],
      check: (contract) => {
        const positionClause = contract.clauses.find(c => c.title.includes('工作内容'));
        if (positionClause && positionClause.content.includes('[岗位]')) {
          return '工作岗位未明确填写';
        }
        return null;
      },
      suggestion: '请明确填写员工的具体工作岗位和职责'
    }
  ],
  other: []
};
