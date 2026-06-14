import { ContractTemplate, ContractClause } from '../types/contract';

const generateClauses = (type: string): ContractClause[] => {
  const baseClauses: ContractClause[] = [
    {
      id: 'clause_1',
      title: '合同标的',
      content: '本合同约定双方在合同期限内的权利与义务关系。',
      isEditable: true,
      isRequired: true
    },
    {
      id: 'clause_2',
      title: '合同期限',
      content: '本合同自起始日期起生效，至终止日期届满自动终止。',
      isEditable: false,
      isRequired: true
    },
    {
      id: 'clause_3',
      title: '金额与支付方式',
      content: '乙方应按照合同约定的金额和支付方式按时向甲方支付款项。',
      isEditable: true,
      isRequired: true
    },
    {
      id: 'clause_4',
      title: '违约责任',
      content: '任何一方违反本合同约定，应承担相应的违约责任，包括但不限于赔偿损失、支付违约金等。',
      isEditable: true,
      isRequired: true
    },
    {
      id: 'clause_5',
      title: '争议解决',
      content: '因本合同引起的或与本合同有关的任何争议，双方应友好协商解决；协商不成的，任何一方均有权向有管辖权的人民法院提起诉讼。',
      isEditable: false,
      isRequired: true
    },
    {
      id: 'clause_6',
      title: '其他约定',
      content: '本合同未尽事宜，双方可另行签订补充协议。补充协议与本合同具有同等法律效力。',
      isEditable: true,
      isRequired: false
    }
  ];

  const specificClauses: Record<string, ContractClause[]> = {
    lease: [
      {
        id: 'clause_specific_1',
        title: '租赁物描述',
        content: '甲方同意将位于[地址]的房屋出租给乙方使用，租赁面积为[面积]平方米。',
        isEditable: true,
        isRequired: true
      },
      {
        id: 'clause_specific_2',
        title: '租赁用途',
        content: '租赁物仅用于[用途]，乙方不得擅自改变租赁用途。',
        isEditable: true,
        isRequired: true
      },
      {
        id: 'clause_specific_3',
        title: '押金条款',
        content: '乙方应在签订本合同时向甲方支付押金人民币[金额]元，合同期满且乙方无违约情况下，甲方无息退还押金。',
        isEditable: true,
        isRequired: true
      }
    ],
    loan: [
      {
        id: 'clause_specific_1',
        title: '借款用途',
        content: '借款用于[用途]，乙方不得挪作他用。',
        isEditable: true,
        isRequired: true
      },
      {
        id: 'clause_specific_2',
        title: '利率条款',
        content: '借款利率为年利率[利率]%，利息按月/按季/按年结算。',
        isEditable: true,
        isRequired: true
      },
      {
        id: 'clause_specific_3',
        title: '还款方式',
        content: '乙方应按照以下方式还款：[还款方式]。',
        isEditable: true,
        isRequired: true
      }
    ],
    labor: [
      {
        id: 'clause_specific_1',
        title: '工作内容与岗位',
        content: '甲方安排乙方在[岗位]岗位工作，工作内容为[工作内容]。',
        isEditable: true,
        isRequired: true
      },
      {
        id: 'clause_specific_2',
        title: '工作时间与休假',
        content: '乙方实行[工时制度]工时制度，依法享有法定节假日、年休假等假期。',
        isEditable: true,
        isRequired: true
      },
      {
        id: 'clause_specific_3',
        title: '劳动报酬',
        content: '乙方月工资为人民币[金额]元，甲方于每月[日期]以货币形式支付乙方工资。',
        isEditable: true,
        isRequired: true
      },
      {
        id: 'clause_specific_4',
        title: '社会保险与福利',
        content: '甲方应按照国家和地方有关规定为乙方缴纳社会保险，乙方依法享受相应的福利待遇。',
        isEditable: false,
        isRequired: true
      }
    ],
    other: []
  };

  return [...baseClauses, ...(specificClauses[type] || [])];
};

export const contractTemplates: ContractTemplate[] = [
  {
    id: 'template_lease_001',
    type: 'lease',
    name: '房屋租赁合同',
    description: '适用于个人或商业房屋租赁，包含押金、维修责任等完整条款',
    icon: '🏠',
    clauses: generateClauses('lease'),
    defaultReminderDays: 30,
    applicableRegions: ['all']
  },
  {
    id: 'template_lease_002',
    type: 'lease',
    name: '商铺租赁合同',
    description: '适用于商业商铺租赁，包含装修、经营限制等特殊条款',
    icon: '🏪',
    clauses: generateClauses('lease'),
    defaultReminderDays: 60,
    applicableRegions: ['all']
  },
  {
    id: 'template_loan_001',
    type: 'loan',
    name: '个人借款合同',
    description: '适用于个人之间的借贷，包含利率、还款方式等条款',
    icon: '💰',
    clauses: generateClauses('loan'),
    defaultReminderDays: 15,
    applicableRegions: ['all']
  },
  {
    id: 'template_loan_002',
    type: 'loan',
    name: '企业借款合同',
    description: '适用于企业之间或企业与个人之间的借贷',
    icon: '🏦',
    clauses: generateClauses('loan'),
    defaultReminderDays: 30,
    applicableRegions: ['all']
  },
  {
    id: 'template_labor_001',
    type: 'labor',
    name: '全日制劳动合同',
    description: '适用于企业与员工签订的标准劳动合同',
    icon: '📋',
    clauses: generateClauses('labor'),
    defaultReminderDays: 45,
    applicableRegions: ['all']
  },
  {
    id: 'template_labor_002',
    type: 'labor',
    name: '劳务合同',
    description: '适用于临时性、项目性的劳务合作',
    icon: '👷',
    clauses: generateClauses('labor'),
    defaultReminderDays: 15,
    applicableRegions: ['all']
  },
  {
    id: 'template_other_001',
    type: 'other',
    name: '买卖合同',
    description: '适用于商品买卖交易，包含质量标准、交货方式等条款',
    icon: '📦',
    clauses: generateClauses('other'),
    defaultReminderDays: 7,
    applicableRegions: ['all']
  },
  {
    id: 'template_other_002',
    type: 'other',
    name: '服务合同',
    description: '适用于各类服务合作，包含服务标准、验收条款等',
    icon: '🤝',
    clauses: generateClauses('other'),
    defaultReminderDays: 30,
    applicableRegions: ['all']
  }
];

export const getTemplateById = (id: string): ContractTemplate | undefined => {
  return contractTemplates.find(t => t.id === id);
};

export const getTemplatesByType = (type: string): ContractTemplate[] => {
  return contractTemplates.filter(t => t.type === type);
};

export const templateTypes = [
  { type: 'lease', name: '租赁合同', icon: '🏠', count: 2 },
  { type: 'loan', name: '借款合同', icon: '💰', count: 2 },
  { type: 'labor', name: '劳动合同', icon: '📋', count: 2 },
  { type: 'other', name: '其他合同', icon: '📄', count: 2 }
];
