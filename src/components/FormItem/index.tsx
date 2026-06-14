import React from 'react';
import { View, Text, Input, Textarea } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface FormItemProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'textarea' | 'date' | 'idcard' | 'phone';
  required?: boolean;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  maxLength?: number;
}

const FormItem: React.FC<FormItemProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  error,
  disabled = false,
  multiline = false,
  maxLength
}) => {
  const inputType = type === 'number' ? 'digit' : type === 'phone' ? 'number' : type === 'idcard' ? 'idcard' : 'text';

  return (
    <View className={classnames(styles.formItem, error && styles.hasError)}>
      <View className={styles.labelRow}>
        <Text className={styles.label}>
          {required && <Text className={styles.required}>*</Text>}
          {label}
        </Text>
        {maxLength && (
          <Text className={styles.charCount}>
            {String(value).length}/{maxLength}
          </Text>
        )}
      </View>
      
      {multiline ? (
        <Textarea
          className={styles.textarea}
          value={String(value)}
          onInput={(e) => onChange(e.detail.value)}
          placeholder={placeholder}
          placeholderClass={styles.placeholder}
          disabled={disabled}
          maxlength={maxLength}
          autoHeight
        />
      ) : (
        <Input
          className={styles.input}
          type={inputType}
          value={String(value)}
          onInput={(e) => onChange(e.detail.value)}
          placeholder={placeholder}
          placeholderClass={styles.placeholder}
          disabled={disabled}
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
