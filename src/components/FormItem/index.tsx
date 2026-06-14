import React, { useState } from 'react';
import { View, Text, Input, Textarea, Picker } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface FormItemProps {
  label: string;
  value: string | number;
  onChange?: (value: string) => void;
  onInput?: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'textarea' | 'date' | 'idcard' | 'phone' | 'digit' | 'select';
  required?: boolean;
  error?: string;
  disabled?: boolean;
  editable?: boolean;
  multiline?: boolean;
  autoHeight?: boolean;
  maxLength?: number;
  options?: Array<{ value: string; label: string }>;
}

const FormItem: React.FC<FormItemProps> = ({
  label,
  value,
  onChange,
  onInput,
  placeholder,
  type = 'text',
  required = false,
  error,
  disabled = false,
  editable = true,
  multiline = false,
  autoHeight = false,
  maxLength,
  options = []
}) => {
  const [pickerValue, setPickerValue] = useState(0);

  const handleChange = (val: string) => {
    if (onChange) onChange(val);
    if (onInput) onInput(val);
  };

  const getInputType = () => {
    if (type === 'number' || type === 'phone') return 'number';
    if (type === 'digit') return 'digit';
    if (type === 'idcard') return 'idcard';
    return 'text';
  };

  const getLabelFromValue = (val: string) => {
    const option = options.find(o => o.value === val);
    return option?.label || val;
  };

  return (
    <View className={classnames(styles.formItem, error && styles.hasError, !editable && styles.disabled)}>
      <View className={styles.labelRow}>
        <Text className={styles.label}>
          {required && <Text className={styles.required}>*</Text>}
          {label}
        </Text>
        {maxLength && (
          <Text className={styles.charCount}>
            {String(value || '').length}/{maxLength}
          </Text>
        )}
      </View>
      
      {type === 'select' ? (
        <Picker
          mode="selector"
          range={options.map(o => o.label)}
          value={pickerValue}
          onChange={(e) => {
            const index = e.detail.value;
            setPickerValue(index);
            handleChange(options[index]?.value || '');
          }}
          disabled={disabled || !editable}
        >
          <View className={classnames(styles.input, styles.picker)}>
            <Text className={value ? styles.inputText : styles.placeholder}>
              {value ? getLabelFromValue(String(value)) : placeholder || '请选择'}
            </Text>
            <Text className={styles.pickerArrow}>›</Text>
          </View>
        </Picker>
      ) : type === 'date' ? (
        <Picker
          mode="date"
          value={String(value || '')}
          onChange={(e) => handleChange(e.detail.value)}
          disabled={disabled || !editable}
        >
          <View className={classnames(styles.input, styles.picker)}>
            <Text className={value ? styles.inputText : styles.placeholder}>
              {value || placeholder || '请选择日期'}
            </Text>
            <Text className={styles.pickerArrow}>📅</Text>
          </View>
        </Picker>
      ) : type === 'textarea' || multiline ? (
        <Textarea
          className={styles.textarea}
          value={String(value || '')}
          onInput={(e) => handleChange(e.detail.value)}
          placeholder={placeholder}
          placeholderClass={styles.placeholder}
          disabled={disabled || !editable}
          maxlength={maxLength}
          autoHeight={autoHeight}
        />
      ) : (
        <Input
          className={styles.input}
          type={getInputType()}
          value={String(value || '')}
          onInput={(e) => handleChange(e.detail.value)}
          placeholder={placeholder}
          placeholderClass={styles.placeholder}
          disabled={disabled || !editable}
          maxlength={maxLength}
        />
      )}
      
      {error && (
        <View className={styles.errorRow}>
          <Text className={styles.errorIcon}>⚠️</Text>
          <Text className={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

export default FormItem;
