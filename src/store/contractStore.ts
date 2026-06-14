import { create } from 'zustand';
import { Contract, ContractStatus, ContractType, MonthlyReport, ReminderSettings, Party, ContractClause, Reminder } from '../types/contract';
import { mockContracts } from '../data/mockContracts';
import { contractTemplates, getTemplateById } from '../data/templates';
import { checkCompliance } from '../utils/compliance';
import { generateContractHash, generateQRCodeContent, encryptContract } from '../utils/encryption';
import { validateContractForm, ValidationError } from '../utils/validator';
import dayjs from 'dayjs';

interface ContractState {
  contracts: Contract[];
  currentContract: Contract | null;
  draftContract: Partial<Contract> | null;
  monthlyReport: MonthlyReport | null;
  reminders: Reminder[];
  reminderSettings: ReminderSettings;
  reminderEnabled: boolean;
  isLoading: boolean;
  validationErrors: ValidationError[];
  currentStep: number;
  filterStatus: ContractStatus | 'all';
  filterType: ContractType | 'all';
  searchKeyword: string;
}

interface ContractActions {
  setFilterStatus: (status: ContractStatus | 'all') => void;
  setFilterType: (type: ContractType | 'all') => void;
  setSearchKeyword: (keyword: string) => void;
  getFilteredContracts: () => Contract[];
  createContractFromTemplate: (templateId: string) => string;
  createDraftContract: (templateId: string) => void;
  updateDraftContract: (data: Partial<Contract>) => void;
  validateDraft: () => ValidationError[];
  saveDraft: () => void;
  submitForCompliance: () => Contract | null;
  setCurrentContract: (contract: Contract | null) => void;
  getContractById: (id: string) => Contract | undefined;
  addContract: (contract: Contract) => void;
  updateContract: (id: string, data: Partial<Contract>) => void;
  deleteContract: (id: string) => void;
  signContract: (id: string, party: 'partyA' | 'partyB', signatureData: string) => void;
  addNegotiation: (contractId: string, content: string, changes: Array<{ field: string; oldValue: string; newValue: string }>) => void;
  updateReminderSettings: (settings: Partial<ReminderSettings>) => void;
  checkAndSendReminders: () => void;
  setReminderEnabled: (enabled: boolean) => void;
  markReminderAsRead: (reminderId: string) => void;
  clearExpiredReminders: () => void;
  checkReminders: () => void;
  handleContractRenewal: (contractId: string) => Promise<boolean>;
  handleContractTermination: (contractId: string) => Promise<boolean>;
  generateMonthlyReport: (month?: string) => MonthlyReport;
  nextStep: () => void;
  prevStep: () => void;
  setCurrentStep: (step: number) => void;
  setValidationErrors: (errors: ValidationError[]) => void;
  initStore: () => void;
}

export const useContractStore = create<ContractState & ContractActions>((set, get) => ({
  contracts: [],
  currentContract: null,
  draftContract: null,
  monthlyReport: null,
  reminders: [],
  reminderEnabled: true,
  reminderSettings: {
    defaultDays: 30,
    urgentDays: 15,
    criticalDays: 7,
    enableNotification: true,
    enableEmail: false,
    firstReminderDays: 30,
    secondReminderDays: 15,
    finalReminderDays: 7,
    notificationMethods: {
      push: true,
      sms: false,
      email: false
    }
  },
  isLoading: false,
  validationErrors: [],
  currentStep: 0,
  filterStatus: 'all',
  filterType: 'all',
  searchKeyword: '',

  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterType: (type) => set({ filterType: type }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  getFilteredContracts: () => {
    const { contracts, filterStatus, filterType, searchKeyword } = get();
    return contracts.filter(c => {
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterType !== 'all' && c.type !== filterType) return false;
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        return c.title.toLowerCase().includes(keyword) ||
               c.partyA.name.toLowerCase().includes(keyword) ||
               c.partyB.name.toLowerCase().includes(keyword) ||
               c.contractNo.toLowerCase().includes(keyword);
      }
      return true;
    });
  },

  createContractFromTemplate: (templateId) => {
    console.log('[Store] 从模板创建合同', { templateId });
    const template = getTemplateById(templateId);
    if (!template) {
      console.error('[Store] 模板不存在', { templateId });
      Taro.showToast({ title: '模板不存在', icon: 'error' });
      return '';
    }

    const now = dayjs();
    const contractId = `contract_${Date.now()}`;
    const contract: Contract = {
      id: contractId,
      type: template.type,
      title: template.name,
      templateId: template.id,
      contractNo: `HT-${now.format('YYYYMMDD')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      partyA: { name: '', idNumber: '', phone: '', address: '', email: '' },
      partyB: { name: '', idNumber: '', phone: '', address: '', email: '' },
      clauses: template.clauses.map(c => ({ ...c })),
      amount: 0,
      startDate: now.format('YYYY-MM-DD'),
      endDate: now.add(1, 'year').format('YYYY-MM-DD'),
      status: 'draft',
      createdAt: now.format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: now.format('YYYY-MM-DD HH:mm:ss'),
      risks: [],
      signRecords: [],
      negotiationHistory: [],
      version: 1,
      reminderDays: template.defaultReminderDays,
      reminderLevel: 'normal',
      hasReminded: false
    };

    get().addContract(contract);
    console.log('[Store] 合同创建成功', { contractId, title: contract.title });
    return contractId;
  },

  createDraftContract: (templateId) => {
    console.log('[Store] 创建草稿合同', { templateId });
    const template = getTemplateById(templateId);
    if (!template) {
      console.error('[Store] 模板不存在', { templateId });
      return;
    }

    const now = dayjs();
    const draft: Partial<Contract> = {
      type: template.type,
      title: template.name,
      templateId: template.id,
      contractNo: '',
      partyA: { name: '', idNumber: '', phone: '', address: '', email: '' },
      partyB: { name: '', idNumber: '', phone: '', address: '', email: '' },
      clauses: template.clauses.map(c => ({ ...c })),
      amount: 0,
      startDate: now.format('YYYY-MM-DD'),
      endDate: now.add(1, 'year').format('YYYY-MM-DD'),
      status: 'draft',
      reminderDays: template.defaultReminderDays,
      reminderLevel: 'normal',
      hasReminded: false,
      version: 1
    };

    set({ draftContract: draft, currentStep: 0, validationErrors: [] });
  },

  updateDraftContract: (data) => {
    console.log('[Store] 更新草稿合同', { fields: Object.keys(data) });
    set(state => ({
      draftContract: state.draftContract ? { ...state.draftContract, ...data } : null
    }));
  },

  validateDraft: () => {
    const { draftContract } = get();
    if (!draftContract) return [];
    const errors = validateContractForm(draftContract);
    set({ validationErrors: errors });
    console.log('[Store] 表单校验', { errorCount: errors.length });
    return errors;
  },

  saveDraft: () => {
    const { draftContract } = get();
    if (!draftContract) return;

    const contract: Contract = {
      id: `contract_${Date.now()}`,
      type: draftContract.type || 'other',
      title: draftContract.title || '未命名合同',
      templateId: draftContract.templateId || '',
      contractNo: draftContract.contractNo || `DRAFT-${Date.now()}`,
      partyA: draftContract.partyA || { name: '', idNumber: '', phone: '', address: '' },
      partyB: draftContract.partyB || { name: '', idNumber: '', phone: '', address: '' },
      clauses: draftContract.clauses || [],
      amount: draftContract.amount || 0,
      startDate: draftContract.startDate || dayjs().format('YYYY-MM-DD'),
      endDate: draftContract.endDate || dayjs().add(1, 'year').format('YYYY-MM-DD'),
      status: 'draft',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      risks: [],
      signRecords: [],
      negotiationHistory: [],
      version: draftContract.version || 1,
      reminderDays: draftContract.reminderDays || 30,
      reminderLevel: draftContract.reminderLevel || 'normal',
      hasReminded: false
    };

    get().addContract(contract);
    console.log('[Store] 草稿已保存', { contractId: contract.id });
    Taro.showToast({ title: '草稿已保存', icon: 'success' });
  },

  submitForCompliance: () => {
    const { draftContract, validateDraft, getContractById, updateContract, addContract } = get();
    if (!draftContract) return null;

    const errors = validateDraft();
    if (errors.length > 0) {
      Taro.showToast({ title: `有${errors.length}项错误需要修正`, icon: 'none' });
      return null;
    }

    const existingContract = draftContract.id ? getContractById(draftContract.id) : null;
    const now = dayjs();
    
    let contract: Contract;
    
    if (existingContract) {
      contract = {
        ...existingContract,
        type: draftContract.type || existingContract.type,
        title: draftContract.title || existingContract.title,
        partyA: draftContract.partyA as Party || existingContract.partyA,
        partyB: draftContract.partyB as Party || existingContract.partyB,
        clauses: draftContract.clauses as ContractClause[] || existingContract.clauses,
        amount: draftContract.amount ?? existingContract.amount,
        startDate: draftContract.startDate || existingContract.startDate,
        endDate: draftContract.endDate || existingContract.endDate,
        status: 'pending',
        updatedAt: now.format('YYYY-MM-DD HH:mm:ss'),
        version: existingContract.version + 1,
        risks: [],
        signRecords: existingContract.signRecords || [],
        negotiationHistory: existingContract.negotiationHistory || []
      };
      
      const risks = checkCompliance(contract);
      contract.risks = risks;
      
      const hash = generateContractHash(contract);
      contract.qrCodeData = generateQRCodeContent(contract.id, hash, contract.createdAt);
      contract.encryptedData = encryptContract(contract);
      
      updateContract(contract.id, contract);
    } else {
      contract = {
        id: draftContract.id || `contract_${Date.now()}`,
        type: draftContract.type || 'other',
        title: draftContract.title || '未命名合同',
        templateId: draftContract.templateId || '',
        contractNo: draftContract.contractNo || `HT-${now.format('YYYYMMDDHHmmss')}`,
        partyA: draftContract.partyA as Party,
        partyB: draftContract.partyB as Party,
        clauses: draftContract.clauses as ContractClause[],
        amount: draftContract.amount || 0,
        startDate: draftContract.startDate as string,
        endDate: draftContract.endDate as string,
        status: 'pending',
        createdAt: now.format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: now.format('YYYY-MM-DD HH:mm:ss'),
        risks: [],
        signRecords: [],
        negotiationHistory: [],
        version: draftContract.version || 1,
        reminderDays: draftContract.reminderDays || 30,
        reminderLevel: draftContract.reminderLevel || 'normal',
        hasReminded: false
      };

      const risks = checkCompliance(contract);
      contract.risks = risks;
      
      const hash = generateContractHash(contract);
      contract.qrCodeData = generateQRCodeContent(contract.id, hash, contract.createdAt);
      contract.encryptedData = encryptContract(contract);

      addContract(contract);
    }

    set({ currentContract: contract, draftContract: null });
    console.log('[Store] 合同已提交合规检查', { contractId: contract.id, riskCount: contract.risks.length, isUpdate: !!existingContract });
    
    return contract;
  },

  setCurrentContract: (contract) => set({ currentContract: contract }),

  getContractById: (id) => {
    return get().contracts.find(c => c.id === id);
  },

  addContract: (contract) => {
    set(state => ({
      contracts: [contract, ...state.contracts]
    }));
    console.log('[Store] 合同已添加', { contractId: contract.id });
  },

  updateContract: (id, data) => {
    set(state => ({
      contracts: state.contracts.map(c => 
        c.id === id ? { ...c, ...data, updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') } : c
      ),
      currentContract: state.currentContract?.id === id 
        ? { ...state.currentContract, ...data, updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') }
        : state.currentContract
    }));
    console.log('[Store] 合同已更新', { contractId: id, fields: Object.keys(data) });
  },

  deleteContract: (id) => {
    set(state => ({
      contracts: state.contracts.filter(c => c.id !== id),
      currentContract: state.currentContract?.id === id ? null : state.currentContract
    }));
    console.log('[Store] 合同已删除', { contractId: id });
  },

  signContract: (id, party, signatureData) => {
    const contract = get().getContractById(id);
    if (!contract) return;

    const partyName = party === 'partyA' ? contract.partyA.name : contract.partyB.name;
    const signRecord = {
      id: `sign_${Date.now()}`,
      partyName,
      signatureData,
      signedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };

    const newSignRecords = [...contract.signRecords, signRecord];
    const allSigned = newSignRecords.length >= 2;

    get().updateContract(id, {
      signRecords: newSignRecords,
      status: allSigned ? 'signed' : contract.status,
      signedAt: allSigned ? dayjs().format('YYYY-MM-DD HH:mm:ss') : contract.signedAt
    });

    console.log('[Store] 合同已签署', { contractId: id, party, allSigned });
    Taro.showToast({ title: '签署成功', icon: 'success' });
  },

  addNegotiation: (contractId, content, changes) => {
    const contract = get().getContractById(contractId);
    if (!contract) return;

    const record = {
      id: `nego_${Date.now()}`,
      version: contract.version + 1,
      author: contract.partyA.name,
      content,
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      changes
    };

    get().updateContract(contractId, {
      negotiationHistory: [...contract.negotiationHistory, record],
      version: contract.version + 1,
      status: 'negotiating'
    });

    console.log('[Store] 协商记录已添加', { contractId, changes });
  },

  updateReminderSettings: (settings) => {
    set(state => ({
      reminderSettings: { ...state.reminderSettings, ...settings }
    }));
    console.log('[Store] 提醒设置已更新', { settings });
  },

  checkAndSendReminders: () => {
    const { contracts, reminderSettings, reminderEnabled } = get();
    if (!reminderEnabled) return;
    
    const now = dayjs();
    const newReminders: Reminder[] = [];
    let notifiedCount = 0;

    contracts.forEach(contract => {
      if (contract.status !== 'signed') return;

      const endDate = dayjs(contract.endDate);
      const daysToExpiry = endDate.diff(now, 'day');
      let newLevel = contract.reminderLevel;
      let shouldNotify = false;
      let reminderType: 'expiry' | 'renewal' | 'termination' = 'expiry';
      let message = '';

      if (daysToExpiry < 0) {
        newLevel = 'critical';
        shouldNotify = true;
        message = `合同已逾期${Math.abs(daysToExpiry)}天，请立即处理！`;
      } else if (daysToExpiry <= reminderSettings.finalReminderDays && contract.reminderLevel !== 'critical') {
        newLevel = 'critical';
        shouldNotify = true;
        message = `合同将在${daysToExpiry}天后到期，请注意处理！`;
      } else if (daysToExpiry <= reminderSettings.secondReminderDays && contract.reminderLevel === 'normal') {
        newLevel = 'urgent';
        shouldNotify = true;
        message = `合同将在${daysToExpiry}天后到期，建议开始准备续签或终止。`;
      } else if (daysToExpiry <= reminderSettings.firstReminderDays && !contract.hasReminded) {
        shouldNotify = true;
        message = `合同将在${daysToExpiry}天后到期，请注意查看。`;
      }

      if (shouldNotify) {
        if (newLevel !== contract.reminderLevel) {
          get().updateContract(contract.id, { reminderLevel: newLevel, hasReminded: true });
        }

        const reminder: Reminder = {
          id: `reminder_${Date.now()}_${contract.id}`,
          contractId: contract.id,
          contractTitle: contract.title,
          type: reminderType,
          level: newLevel,
          title: `合同到期提醒：${contract.title}`,
          message,
          reminderDate: now.format('YYYY-MM-DD HH:mm:ss'),
          read: false,
          daysUntilExpiry: daysToExpiry
        };
        newReminders.push(reminder);
        notifiedCount++;

        if (daysToExpiry < 0) {
          Taro.showModal({
            title: '⚠️ 合同已逾期',
            content: `合同"${contract.title}"已逾期${Math.abs(daysToExpiry)}天，请立即处理！`,
            showCancel: false
          });
        } else if (newLevel === 'critical') {
          Taro.showModal({
            title: '⚠️ 紧急提醒',
            content: `合同"${contract.title}"将在${daysToExpiry}天后到期，请及时处理！`,
            showCancel: false
          });
        } else {
          Taro.showToast({
            title: `合同"${contract.title}"即将到期`,
            icon: 'none',
            duration: 3000
          });
        }
      }
    });

    if (newReminders.length > 0) {
      set(state => ({
        reminders: [...newReminders, ...state.reminders]
      }));
    }

    console.log('[Store] 提醒检查完成', { notifiedCount, newReminders: newReminders.length });
  },

  setReminderEnabled: (enabled) => {
    set({ reminderEnabled: enabled });
    console.log('[Store] 提醒开关已更新', { enabled });
    if (enabled) {
      get().checkAndSendReminders();
    }
  },

  markReminderAsRead: (reminderId) => {
    set(state => ({
      reminders: state.reminders.map(r =>
        r.id === reminderId ? { ...r, read: true } : r
      )
    }));
    console.log('[Store] 提醒已标记为已读', { reminderId });
  },

  clearExpiredReminders: () => {
    set(state => ({
      reminders: state.reminders.filter(r => !r.read)
    }));
    console.log('[Store] 已清除已读提醒');
  },

  checkReminders: () => {
    get().checkAndSendReminders();
  },

  handleContractRenewal: async (contractId) => {
    const contract = get().getContractById(contractId);
    if (!contract) {
      console.error('[Store] 合同不存在', { contractId });
      return false;
    }

    try {
      const newContract: Contract = {
        ...contract,
        id: `contract_${Date.now()}`,
        contractNo: `HT-${dayjs().format('YYYYMMDDHHmmss')}`,
        startDate: dayjs(contract.endDate).add(1, 'day').format('YYYY-MM-DD'),
        endDate: dayjs(contract.endDate).add(1, 'year').format('YYYY-MM-DD'),
        status: 'draft',
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        risks: [],
        signRecords: [],
        negotiationHistory: [],
        version: 1,
        reminderLevel: 'normal',
        hasReminded: false
      };

      get().addContract(newContract);
      get().updateContract(contractId, { status: 'expired' });
      
      console.log('[Store] 合同续签成功', { oldContractId: contractId, newContractId: newContract.id });
      return true;
    } catch (error) {
      console.error('[Store] 合同续签失败', error);
      return false;
    }
  },

  handleContractTermination: async (contractId) => {
    const contract = get().getContractById(contractId);
    if (!contract) {
      console.error('[Store] 合同不存在', { contractId });
      return false;
    }

    try {
      get().updateContract(contractId, { 
        status: 'terminated',
        endDate: dayjs().format('YYYY-MM-DD')
      });
      
      console.log('[Store] 合同终止成功', { contractId });
      return true;
    } catch (error) {
      console.error('[Store] 合同终止失败', error);
      return false;
    }
  },

  generateMonthlyReport: (month) => {
    const { contracts } = get();
    const targetMonth = month || dayjs().format('YYYY-MM');
    const monthStart = dayjs(targetMonth + '-01');
    const monthEnd = monthStart.endOf('month');
    const now = dayjs();

    console.log('[Store] 生成月度报告', { targetMonth, contractCount: contracts.length });

    const monthContracts = contracts.filter(c => {
      const createdAt = dayjs(c.createdAt);
      return createdAt.isAfter(monthStart.subtract(1, 'day')) && createdAt.isBefore(monthEnd.add(1, 'day'));
    });

    const typeDistribution = { lease: 0, loan: 0, labor: 0, other: 0 } as Record<ContractType, number>;
    const statusDistribution = { draft: 0, pending: 0, negotiating: 0, signed: 0, expired: 0, terminated: 0 } as Record<ContractStatus, number>;

    contracts.forEach(c => {
      typeDistribution[c.type]++;
      statusDistribution[c.status]++;
    });

    const totalAmount = contracts.reduce((sum, c) => sum + c.amount, 0);
    const newThisMonth = monthContracts.length;

    const thisMonthStart = dayjs().startOf('month');
    const thisMonthEnd = dayjs().endOf('month');
    const nextMonthStart = thisMonthEnd.add(1, 'day').startOf('month');
    const nextMonthEnd = nextMonthStart.endOf('month');
    const in2MonthsStart = nextMonthEnd.add(1, 'day').startOf('month');
    const in2MonthsEnd = in2MonthsStart.endOf('month');

    const expiringThisMonth = contracts.filter(c => {
      const endDate = dayjs(c.endDate);
      return c.status === 'signed' && 
        endDate.isAfter(thisMonthStart.subtract(1, 'day')) && 
        endDate.isBefore(thisMonthEnd.add(1, 'day'));
    }).length;

    const expiringNextMonth = contracts.filter(c => {
      const endDate = dayjs(c.endDate);
      return c.status === 'signed' && 
        endDate.isAfter(nextMonthStart.subtract(1, 'day')) && 
        endDate.isBefore(nextMonthEnd.add(1, 'day'));
    }).length;

    const expiringIn2Months = contracts.filter(c => {
      const endDate = dayjs(c.endDate);
      return c.status === 'signed' && 
        endDate.isAfter(in2MonthsStart.subtract(1, 'day')) && 
        endDate.isBefore(in2MonthsEnd.add(1, 'day'));
    }).length;

    const expiringIn3PlusMonths = contracts.filter(c => 
      c.status === 'signed' && dayjs(c.endDate).isAfter(in2MonthsEnd)
    ).length;

    const expiring30 = contracts.filter(c => c.status === 'signed' && dayjs(c.endDate).diff(now, 'day') <= 30 && dayjs(c.endDate).diff(now, 'day') > 15);
    const expiring15 = contracts.filter(c => c.status === 'signed' && dayjs(c.endDate).diff(now, 'day') <= 15 && dayjs(c.endDate).diff(now, 'day') > 7);
    const expiring7 = contracts.filter(c => c.status === 'signed' && dayjs(c.endDate).diff(now, 'day') <= 7 && dayjs(c.endDate).diff(now, 'day') >= 0);
    const expired = contracts.filter(c => c.status === 'signed' && dayjs(c.endDate).diff(now, 'day') < 0);
    const upcomingExpiry = [...expiring7, ...expiring15, ...expiring30].slice(0, 10);

    const report: MonthlyReport = {
      month: targetMonth,
      totalCount: contracts.length,
      totalContracts: contracts.length,
      totalAmount,
      newThisMonth,
      expiringThisMonth,
      expiringNextMonth,
      expiringIn2Months,
      expiringIn3PlusMonths,
      typeDistribution,
      statusDistribution,
      expiryDistribution: [
        { period: '7天内到期', count: expiring7.length },
        { period: '8-15天到期', count: expiring15.length },
        { period: '16-30天到期', count: expiring30.length },
        { period: '已过期', count: expired.length }
      ],
      upcomingExpiry
    };

    set({ monthlyReport: report });
    console.log('[Store] 月度报告已生成', { 
      month: targetMonth, 
      totalContracts: report.totalContracts,
      totalAmount: report.totalAmount,
      expiringThisMonth: report.expiringThisMonth
    });
    return report;
  },

  nextStep: () => set(state => ({ currentStep: Math.min(state.currentStep + 1, 3) })),
  prevStep: () => set(state => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
  setCurrentStep: (step) => set({ currentStep: step }),
  setValidationErrors: (errors) => set({ validationErrors: errors }),

  initStore: () => {
    console.log('[Store] 初始化数据');
    set({ contracts: [...mockContracts] });
    get().generateMonthlyReport();
    setTimeout(() => {
      get().checkAndSendReminders();
    }, 2000);
  }
}));
