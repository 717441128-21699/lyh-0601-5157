export const simpleEncrypt = (data: string, key: string = 'contract_secure_key'): string => {
  try {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    let result = '';
    for (let i = 0; i < dataStr.length; i++) {
      const charCode = dataStr.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(encodeURIComponent(result));
  } catch (error) {
    console.error('[Encryption] 加密失败', error);
    return '';
  }
};

export const simpleDecrypt = (encrypted: string, key: string = 'contract_secure_key'): string => {
  try {
    const decoded = decodeURIComponent(atob(encrypted));
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (error) {
    console.error('[Encryption] 解密失败', error);
    return '';
  }
};

export const generateContractHash = (contractData: any): string => {
  const dataStr = JSON.stringify({
    id: contractData.id,
    contractNo: contractData.contractNo,
    partyA: contractData.partyA,
    partyB: contractData.partyB,
    amount: contractData.amount,
    startDate: contractData.startDate,
    endDate: contractData.endDate,
    version: contractData.version
  });
  
  let hash = 0;
  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(16).toUpperCase();
};

export const generateQRCodeContent = (contractId: string, hash: string, timestamp: string): string => {
  const content = JSON.stringify({
    contractId,
    hash,
    timestamp,
    verifyUrl: 'https://verify.contract-manager.com'
  });
  return btoa(content);
};

export const verifyContractHash = (contractData: any, expectedHash: string): boolean => {
  const actualHash = generateContractHash(contractData);
  return actualHash === expectedHash;
};

export const encryptContract = (contract: any): string => {
  return simpleEncrypt(JSON.stringify(contract));
};

export const decryptContract = (encrypted: string): any => {
  const decrypted = simpleDecrypt(encrypted);
  try {
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
};
