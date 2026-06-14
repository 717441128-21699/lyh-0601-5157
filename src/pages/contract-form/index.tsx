import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useContractStore } from '../../store/contractStore';
import FormItem from '../../components/FormItem';
import { validateParty, validateRequired, validateDate, validateAmount, validateDateRange } from '../../utils/validator';
import { FormStep, Contract, Party, ContractClause } from '../../types/contract';

const steps: Array<{ key: FormStep; label: string }> = [
  { key: 'basic', label: '基本信息' },
  { key: 'parties', label: '双方信息' },
  { key: 'terms', label: '合同条款' },
  { key: 'confirm', label: '确认提交' }
];

const ContractFormPage: React.FC = () => {
  const router = useRouter();
  const templateId = router.params.templateId as string;
  const contractId = router.params.id as string;

  const {
    draftContract,
    currentStep,
    validationErrors,
    createDraftContract,
    updateDraftContract,
    validateDraft,
    saveDraft,
    submitForCompliance,
    setCurrentStep,
    nextStep,
    prevStep,
    getContractById,
    setCurrentContract,
    setValidationErrors
  } = useContractStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (contractId) {
      const existing = getContractById(contractId);
      if (existing) {
        updateDraftContract(existing);
        setCurrentContract(existing);
      }
    } else if (templateId) {
      createDraftContract(templateId);
    }
    return () => {
      setCurrentContract(null);
    };
  }, [contractId, templateId]);

  useDidShow(() => {
    console.log('[ContractForm] 页面显示');
  });

  const currentStepKey = steps[currentStep]?.key || 'basic';
  const currentStepIndex = currentStep;

  const getFieldError = (field: string): string | undefined => {
    if (localErrors[field]) return localErrors[field];
    const error = validationErrors.find(e => e.field === field);
    return error?.message;
  };

  const handleFieldChange = (field: string, value: any) => {
    updateDraftContract({ [field]: value });
    if (localErrors[field]) {
      const newErrors = { ...localErrors };
      delete newErrors[field];
      setLocalErrors(newErrors);
    }
  };

  const handlePartyChange = (partyType: 'partyA' | 'partyB', field: string, value: string) => {
    const currentParty = (draftContract?.[partyType] as Party) || { name: '', idNumber: '', phone: '', address: '' };
    const updatedParty = { ...currentParty, [field]: value };
    updateDraftContract({ [partyType]: updatedParty });
    
    const errorKey = `${partyType}.${field}`;
    if (localErrors[errorKey]) {
      const newErrors = { ...localErrors };
      delete newErrors[errorKey];
      setLocalErrors(newErrors);
    }
  };

  const handleClauseChange = (index: number, value: string) => {
    const clauses = [...(draftContract?.clauses || [])];
    if (clauses[index]) {
      clauses[index] = { ...clauses[index], content: value };
      updateDraftContract({ clauses });
    }
  };

  const validateCurrentStep = (): boolean => {
    if (!draftContract) return false;
    const errors: Record<string, string> = {};

    switch (currentStepKey) {
      case 'basic': {
        const titleErr = validateRequired(draftContract.title || '', '合同名称');
        if (titleErr) errors.title = titleErr.message;

        const amountErr = validateAmount(draftContract.amount || 0, '合同金额', 0.01);
        if (amountErr) errors.amount = amountErr.message;

        const startDateErr = validateDate(draftContract.startDate || '', '开始日期');
        if (startDateErr) errors.startDate = startDateErr.message;

        const endDateErr = validateDate(draftContract.endDate || '', '结束日期');
        if (endDateErr) errors.endDate = endDateErr.message;

        if (!startDateErr && !endDateErr && draftContract.startDate && draftContract.endDate) {
          const rangeErrs = validateDateRange(draftContract.startDate, draftContract.endDate);
          rangeErrs.forEach(e => { errors[e.field] = e.message; });
        }
        break;
      }
      case 'parties': {
        const partyA = draftContract.partyA as Party;
        const partyB = draftContract.partyB as Party;

        if (partyA) {
          const partyAErrs = validateParty(partyA, 'partyA');
          partyAErrs.forEach(e => { errors[e.field] = e.message; });
        }
        if (partyB) {
          const partyBErrs = validateParty(partyB, 'partyB');
          partyBErrs.forEach(e => { errors[e.field] = e.message; });
        }
        break;
      }
      case 'terms': {
        draftContract.clauses?.forEach((clause, index) => {
          if (clause.isRequired && (!clause.content || clause.content.trim() === '')) {
            errors[`clause_${index}`] = `条款"${clause.title}"不能为空`;
          }
        });
        break;
      }
    }

    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      const firstError = Object.values(errors)[0];
      Taro.showToast({ title: firstError, icon: 'none' });
      return false;
    }
    setLocalErrors({});
    return true;
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      prevStep();
    } else {
      Taro.navigateBack();
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (currentStepIndex < steps.length - 1) {
      nextStep();
    }
  };

  const handleSaveDraft = () => {
    saveDraft();
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    
    setIsSubmitting(true);
    try {
      Taro.showLoading({ title: '正在校验...', mask: true });
      
      const contract = submitForCompliance();
      
      Taro.hideLoading();
      
      if (contract) {
        Taro.navigateTo({
          url: `/pages/compliance-check/index?id=${contract.id}`
        });
      }
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicInfo = () => {
    if (!draftContract) return null;
    return (
      <View>
        <View className={styles.formTip}>
          <Text className={styles.tipText}>
            💡 请填写合同的基本信息。合同名称将用于在列表中识别该合同。
          </Text>
        </View>
        
        <FormItem
          label="合同名称"
          required
          placeholder="请输入合同名称"
          value={draftContract.title || ''}
          error={getFieldError('title')}
          onInput={(val) => handleFieldChange('title', val)}
        />
        
        <FormItem
          label="合同类型"
          required
          type="select"
          value={draftContract.type || ''}
          error={getFieldError('type')}
          options={[
            { value: 'lease', label: '租赁合同' },
            { value: 'loan', label: '借款合同' },
            { value: 'labor', label: '劳动合同' },
            { value: 'other', label: '其他合同' }
          ]}
          onChange={(val) => handleFieldChange('type', val)}
        />
        
        <FormItem
          label="合同金额（元）"
          required
          type="digit"
          placeholder="请输入合同金额"
          value={draftContract.amount?.toString() || ''}
          error={getFieldError('amount')}
          onInput={(val) => handleFieldChange('amount', Number(val))}
        />
        
        <FormItem
          label="开始日期"
          required
          type="date"
          value={draftContract.startDate || ''}
          error={getFieldError('startDate')}
          onChange={(val) => handleFieldChange('startDate', val)}
        />
        
        <FormItem
          label="结束日期"
          required
          type="date"
          value={draftContract.endDate || ''}
          error={getFieldError('endDate')}
          onChange={(val) => handleFieldChange('endDate', val)}
        />
      </View>
    );
  };

  const renderPartiesInfo = () => {
    if (!draftContract) return null;
    const partyA = (draftContract.partyA as Party) || { name: '', idNumber: '', phone: '', address: '' };
    const partyB = (draftContract.partyB as Party) || { name: '', idNumber: '', phone: '', address: '' };

    return (
      <View>
        <View className={styles.formTip}>
          <Text className={styles.tipText}>
            💡 请准确填写甲乙双方的信息。身份证号和手机号将用于身份验证和通知发送。
          </Text>
        </View>

        <View className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>🅰️</Text>
          甲方信息
        </View>
        
        <FormItem
          label="姓名/名称"
          required
          placeholder="请输入甲方姓名或公司名称"
          value={partyA.name}
          error={getFieldError('partyA.name')}
          onInput={(val) => handlePartyChange('partyA', 'name', val)}
        />
        
        <FormItem
          label="身份证号"
          required
          placeholder="请输入身份证号"
          value={partyA.idNumber}
          error={getFieldError('partyA.idNumber')}
          onInput={(val) => handlePartyChange('partyA', 'idNumber', val)}
        />
        
        <FormItem
          label="联系电话"
          required
          type="number"
          placeholder="请输入手机号"
          value={partyA.phone}
          error={getFieldError('partyA.phone')}
          onInput={(val) => handlePartyChange('partyA', 'phone', val)}
        />
        
        <FormItem
          label="电子邮箱"
          type="text"
          placeholder="请输入邮箱（选填）"
          value={partyA.email || ''}
          error={getFieldError('partyA.email')}
          onInput={(val) => handlePartyChange('partyA', 'email', val)}
        />
        
        <FormItem
          label="联系地址"
          placeholder="请输入地址"
          value={partyA.address || ''}
          error={getFieldError('partyA.address')}
          onInput={(val) => handlePartyChange('partyA', 'address', val)}
        />

        <View className={styles.sectionTitle} style={{ marginTop: 40 }}>
          <Text className={styles.sectionIcon}>🅱️</Text>
          乙方信息
        </View>
        
        <FormItem
          label="姓名/名称"
          required
          placeholder="请输入乙方姓名或公司名称"
          value={partyB.name}
          error={getFieldError('partyB.name')}
          onInput={(val) => handlePartyChange('partyB', 'name', val)}
        />
        
        <FormItem
          label="身份证号"
          required
          placeholder="请输入身份证号"
          value={partyB.idNumber}
          error={getFieldError('partyB.idNumber')}
          onInput={(val) => handlePartyChange('partyB', 'idNumber', val)}
        />
        
        <FormItem
          label="联系电话"
          required
          type="number"
          placeholder="请输入手机号"
          value={partyB.phone}
          error={getFieldError('partyB.phone')}
          onInput={(val) => handlePartyChange('partyB', 'phone', val)}
        />
        
        <FormItem
          label="电子邮箱"
          type="text"
          placeholder="请输入邮箱（选填）"
          value={partyB.email || ''}
          error={getFieldError('partyB.email')}
          onInput={(val) => handlePartyChange('partyB', 'email', val)}
        />
        
        <FormItem
          label="联系地址"
          placeholder="请输入地址"
          value={partyB.address || ''}
          error={getFieldError('partyB.address')}
          onInput={(val) => handlePartyChange('partyB', 'address', val)}
        />
      </View>
    );
  };

  const renderTerms = () => {
    if (!draftContract) return null;
    const clauses = draftContract.clauses || [];
    
    return (
      <View>
        <View className={styles.formTip}>
          <Text className={styles.tipText}>
            💡 请仔细核对合同条款。系统已根据模板自动填充，您可以根据实际情况修改。
          </Text>
        </View>
        
        {clauses.map((clause, index) => (
          <FormItem
            key={clause.id}
            label={clause.title}
            required={clause.isRequired}
            type="textarea"
            placeholder={`请输入${clause.title}内容`}
            value={clause.content}
            error={getFieldError(`clause_${index}`)}
            onInput={(val) => handleClauseChange(index, val)}
            autoHeight
            maxLength={2000}
            editable={clause.isEditable}
          />
        ))}
      </View>
    );
  };

  const renderConfirm = () => {
    if (!draftContract) return null;
    const typeLabels: Record<string, string> = {
      lease: '租赁合同',
      loan: '借款合同',
      labor: '劳动合同',
      other: '其他合同'
    };

    return (
      <View>
        <View className={styles.formTip}>
          <Text className={styles.tipText}>
            ✅ 请仔细核对以下信息。确认无误后，点击"提交审核"进行合规校验。
          </Text>
        </View>

        <View className={styles.sectionTitle}>
          <Text className={styles.sectionIcon}>📋</Text>
          合同摘要
        </View>

        <View className={styles.termsPreview}>
          <Text className={styles.termsText}>
            {`合同名称：${draftContract.title || '-'}
合同类型：${typeLabels[draftContract.type || 'other'] || '其他合同'}
合同金额：¥${(draftContract.amount || 0).toLocaleString()}
开始日期：${draftContract.startDate || '-'}
结束日期：${draftContract.endDate || '-'}

甲方：${draftContract.partyA?.name || '-'}
身份证：${draftContract.partyA?.idNumber || '-'}
电话：${draftContract.partyA?.phone || '-'}

乙方：${draftContract.partyB?.name || '-'}
身份证：${draftContract.partyB?.idNumber || '-'}
电话：${draftContract.partyB?.phone || '-'}

合同条款：
${(draftContract.clauses?.[0]?.content || '').substring(0, 100)}...`}
          </Text>
        </View>
      </View>
    );
  };

  const renderStepContent = () => {
    switch (currentStepKey) {
      case 'basic':
        return renderBasicInfo();
      case 'parties':
        return renderPartiesInfo();
      case 'terms':
        return renderTerms();
      case 'confirm':
        return renderConfirm();
      default:
        return null;
    }
  };

  if (!draftContract) {
    return (
      <View className={styles.pageContainer}>
        <View style={{ padding: 100, textAlign: 'center', color: '#999' }}>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.pageContainer}>
      <View className={styles.stepIndicator}>
        {steps.map((step, index) => (
          <View
            key={step.key}
            className={classnames(
              styles.stepItem,
              currentStepKey === step.key && styles.active,
              index < currentStepIndex && styles.completed
            )}
          >
            <View className={styles.stepCircle}>
              <Text>{index < currentStepIndex ? '✓' : index + 1}</Text>
            </View>
            <Text className={styles.stepLabel}>{step.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 280rpx)' }}>
        <View className={styles.formSection}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>
              {currentStepKey === 'basic' ? '📝' : 
               currentStepKey === 'parties' ? '👥' :
               currentStepKey === 'terms' ? '📜' : '✅'}
            </Text>
            {steps[currentStepIndex].label}
          </View>
          {renderStepContent()}
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        {currentStepIndex > 0 && (
          <Button className={styles.secondaryBtn} onClick={handlePrev}>
            上一步
          </Button>
        )}
        
        {currentStepIndex === 0 && (
          <Button className={styles.saveBtn} onClick={handleSaveDraft}>
            保存草稿
          </Button>
        )}
        
        {currentStepIndex < steps.length - 1 ? (
          <Button
            className={styles.primaryBtn}
            onClick={handleNext}
            disabled={isSubmitting}
          >
            下一步
          </Button>
        ) : (
          <Button
            className={styles.primaryBtn}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? '提交中...' : '提交审核'}
          </Button>
        )}
      </View>
    </View>
  );
};

export default ContractFormPage;
