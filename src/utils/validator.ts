import { ValidationError, Party } from '../types/contract';

export const validateRequired = (value: string, fieldName: string): ValidationError | null => {
  if (!value || value.trim() === '') {
    return { field: fieldName, message: `${fieldName}不能为空` };
  }
  return null;
};

export const validateIdNumber = (idNumber: string, fieldName: string = '身份证号'): ValidationError | null => {
  if (!idNumber) return { field: fieldName, message: `${fieldName}不能为空` };
  const idRegex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
  if (!idRegex.test(idNumber)) {
    return { field: fieldName, message: `${fieldName}格式不正确` };
  }
  return null;
};

export const validatePhone = (phone: string, fieldName: string = '手机号'): ValidationError | null => {
  if (!phone) return { field: fieldName, message: `${fieldName}不能为空` };
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return { field: fieldName, message: `${fieldName}格式不正确` };
  }
  return null;
};

export const validateEmail = (email: string, fieldName: string = '邮箱'): ValidationError | null => {
  if (!email) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { field: fieldName, message: `${fieldName}格式不正确` };
  }
  return null;
};

export const validateDate = (date: string, fieldName: string = '日期'): ValidationError | null => {
  if (!date) return { field: fieldName, message: `${fieldName}不能为空` };
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return { field: fieldName, message: `${fieldName}格式不正确，请使用YYYY-MM-DD格式` };
  }
  const timestamp = new Date(date).getTime();
  if (isNaN(timestamp)) {
    return { field: fieldName, message: `${fieldName}不是有效日期` };
  }
  return null;
};

export const validateDateRange = (startDate: string, endDate: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  const startErr = validateDate(startDate, '开始日期');
  const endErr = validateDate(endDate, '结束日期');
  if (startErr) errors.push(startErr);
  if (endErr) errors.push(endErr);
  if (!startErr && !endErr) {
    if (new Date(startDate) >= new Date(endDate)) {
      errors.push({ field: 'endDate', message: '结束日期必须晚于开始日期' });
    }
  }
  return errors;
};

export const validateAmount = (amount: number, fieldName: string = '金额', min: number = 0, max?: number): ValidationError | null => {
  if (amount === undefined || amount === null) {
    return { field: fieldName, message: `${fieldName}不能为空` };
  }
  if (isNaN(amount)) {
    return { field: fieldName, message: `${fieldName}必须是有效数字` };
  }
  if (amount < min) {
    return { field: fieldName, message: `${fieldName}不能小于${min}` };
  }
  if (max !== undefined && amount > max) {
    return { field: fieldName, message: `${fieldName}不能大于${max}` };
  }
  return null;
};

export const validateParty = (party: Party, partyType: 'partyA' | 'partyB'): ValidationError[] => {
  const errors: ValidationError[] = [];
  const prefix = partyType === 'partyA' ? '甲方' : '乙方';
  
  const nameErr = validateRequired(party.name, `${prefix}名称`);
  if (nameErr) errors.push(nameErr);
  
  const idErr = validateIdNumber(party.idNumber, `${prefix}身份证号`);
  if (idErr) errors.push(idErr);
  
  const phoneErr = validatePhone(party.phone, `${prefix}手机号`);
  if (phoneErr) errors.push(phoneErr);
  
  const addressErr = validateRequired(party.address, `${prefix}地址`);
  if (addressErr) errors.push(addressErr);
  
  if (party.email) {
    const emailErr = validateEmail(party.email, `${prefix}邮箱`);
    if (emailErr) errors.push(emailErr);
  }
  
  return errors;
};

export const validateContractForm = (formData: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  const titleErr = validateRequired(formData.title, '合同标题');
  if (titleErr) errors.push(titleErr);
  
  errors.push(...validateParty(formData.partyA, 'partyA'));
  errors.push(...validateParty(formData.partyB, 'partyB'));
  
  errors.push(...validateDateRange(formData.startDate, formData.endDate));
  
  const amountErr = validateAmount(formData.amount, '合同金额', 0.01);
  if (amountErr) errors.push(amountErr);
  
  formData.clauses?.forEach((clause: any, index: number) => {
    if (clause.isRequired && (!clause.content || clause.content.trim() === '')) {
      errors.push({
        field: `clause_${index}`,
        message: `条款"${clause.title}"不能为空`
      });
    }
  });
  
  return errors;
};
