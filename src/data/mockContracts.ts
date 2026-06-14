import { Contract, ContractStatus, ContractType, ReminderLevel } from '../types/contract';
import { contractTemplates } from './templates';
import dayjs from 'dayjs';

const generateContractNo = (type: ContractType, index: number): string => {
  const prefix = { lease: 'HL', loan: 'JK', labor: 'LD', other: 'QT' }[type];
  const date = dayjs().format('YYYYMM');
  const seq = String(index).padStart(4, '0');
  return `${prefix}-${date}-${seq}`;
};

const generateParty = (isA: boolean, index: number) => {
  const namesA = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二'];
  const namesB = ['北京科技有限公司', '上海贸易有限公司', '广州服务有限公司', '深圳科技有限公司', '杭州电商有限公司', '成都教育有限公司', '武汉医疗有限公司', '南京餐饮有限公司', '西安咨询有限公司', '重庆物流有限公司'];
  const addresses = ['北京市朝阳区建国路88号', '上海市浦东新区陆家嘴环路1000号', '广州市天河区珠江新城华夏路8号', '深圳市南山区科技园南路', '杭州市西湖区文三路90号', '成都市武侯区人民南路四段', '武汉市洪山区珞瑜路1037号', '南京市鼓楼区中山路100号', '西安市雁塔区高新路25号', '重庆市渝中区解放碑步行街88号'];
  
  return {
    name: isA ? namesA[index % namesA.length] : namesB[index % namesB.length],
    idNumber: `11010${1980 + (index % 20)}${String((index + 1) * 3 % 12).padStart(2, '0')}${String((index + 5) * 2 % 28).padStart(2, '0')}${String(1000 + index * 7).padStart(4, '0')}`,
    phone: `138${String(10000000 + index * 12345).slice(0, 8)}`,
    address: addresses[index % addresses.length],
    email: `user${index}@example.com`
  };
};

const statuses: ContractStatus[] = ['signed', 'signed', 'signed', 'pending', 'negotiating', 'signed', 'expired', 'signed', 'pending', 'signed'];
const types: ContractType[] = ['lease', 'loan', 'labor', 'lease', 'other', 'loan', 'labor', 'lease', 'labor', 'other'];
const titles = ['房屋租赁合同', '个人借款合同', '全日制劳动合同', '商铺租赁合同', '服务合同', '企业借款合同', '劳务合同', '房屋租赁合同', '全日制劳动合同', '买卖合同'];
const amounts = [3500, 50000, 8000, 12000, 25000, 200000, 6000, 4200, 9500, 15000];

export const mockContracts: Contract[] = Array.from({ length: 10 }, (_, i) => {
  const type = types[i];
  const template = contractTemplates.find(t => t.type === type)!;
  const now = dayjs();
  const startDate = now.subtract(i * 30, 'day').format('YYYY-MM-DD');
  const endDate = now.add(12 + i, 'month').format('YYYY-MM-DD');
  
  return {
    id: `contract_${i + 1}`,
    type,
    title: titles[i],
    templateId: template.id,
    contractNo: generateContractNo(type, i + 1),
    partyA: generateParty(true, i),
    partyB: generateParty(false, i),
    clauses: template.clauses.map(c => ({ ...c })),
    amount: amounts[i],
    startDate,
    endDate,
    status: statuses[i],
    createdAt: now.subtract(i * 15, 'day').format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: now.subtract(i * 5, 'day').format('YYYY-MM-DD HH:mm:ss'),
    signedAt: statuses[i] === 'signed' ? now.subtract(i * 10, 'day').format('YYYY-MM-DD HH:mm:ss') : undefined,
    risks: i % 3 === 0 ? [
      {
        id: `risk_${i}_1`,
        level: 'medium',
        title: '合同金额建议核实',
        description: '合同金额在同类合同中偏低，建议核实',
        suggestion: '请确认金额是否正确，如有特殊情况请在备注中说明',
        field: 'amount'
      }
    ] : [],
    signRecords: statuses[i] === 'signed' ? [
      {
        id: `sign_${i}_1`,
        partyName: generateParty(true, i).name,
        signatureData: `signature_a_${i}`,
        signedAt: now.subtract(i * 10, 'day').format('YYYY-MM-DD HH:mm:ss')
      },
      {
        id: `sign_${i}_2`,
        partyName: generateParty(false, i).name,
        signatureData: `signature_b_${i}`,
        signedAt: now.subtract(i * 10, 'day').add(1, 'day').format('YYYY-MM-DD HH:mm:ss')
      }
    ] : [],
    negotiationHistory: i % 4 === 0 ? [
      {
        id: `nego_${i}_1`,
        version: 1,
        author: generateParty(false, i).name,
        content: '建议调整租金支付方式为季度支付',
        createdAt: now.subtract(i * 12, 'day').format('YYYY-MM-DD HH:mm:ss'),
        changes: [{ field: 'payment', oldValue: '月付', newValue: '季付' }]
      }
    ] : [],
    version: 1 + (i % 3),
    qrCodeData: `qrcode_contract_${i + 1}`,
    encryptedData: `encrypted_${i + 1}`,
    reminderDays: template.defaultReminderDays,
    reminderLevel: (i % 3 === 0 ? 'urgent' : i % 3 === 1 ? 'critical' : 'normal') as ReminderLevel,
    hasReminded: i % 2 === 0
  };
});

export const getContractById = (id: string): Contract | undefined => {
  return mockContracts.find(c => c.id === id);
};

export const getContractsByStatus = (status: ContractStatus): Contract[] => {
  return mockContracts.filter(c => c.status === status);
};

export const getContractsByType = (type: ContractType): Contract[] => {
  return mockContracts.filter(c => c.type === type);
};

export const getExpiringContracts = (days: number): Contract[] => {
  const targetDate = dayjs().add(days, 'day');
  return mockContracts.filter(c => {
    const endDate = dayjs(c.endDate);
    return endDate.isBefore(targetDate) && c.status === 'signed';
  });
};
