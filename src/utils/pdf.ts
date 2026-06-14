import { Contract, MonthlyReport } from '../types/contract';
import dayjs from 'dayjs';

export const generateReportPDF = (report: MonthlyReport, canvasId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const query = Taro.createSelectorQuery();
    query.select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          reject(new Error('Canvas not found'));
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = Taro.getSystemInfoSync().pixelRatio;
        const width = 600;
        const height = 900;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(0, 0, width, 80);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('合同管理月度报告', width / 2, 50);
        ctx.font = '14px sans-serif';
        ctx.fillText(report.month, width / 2, 70);

        let y = 110;
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('一、总体概览', 30, y);
        y += 30;

        const stats = [
          { label: '合同总数', value: `${report.totalCount} 份` },
          { label: '合同总金额', value: `¥ ${report.totalAmount.toLocaleString()}` }
        ];
        stats.forEach(stat => {
          ctx.fillStyle = '#475569';
          ctx.font = '14px sans-serif';
          ctx.fillText(stat.label, 30, y);
          ctx.fillStyle = '#1e3a8a';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText(stat.value, 200, y);
          y += 28;
        });

        y += 20;
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('二、合同类型分布', 30, y);
        y += 30;

        const typeNames: Record<string, string> = {
          lease: '租赁合同',
          loan: '借款合同',
          labor: '劳动合同',
          other: '其他合同'
        };
        Object.entries(report.typeDistribution).forEach(([type, count]) => {
          const barWidth = (count / Math.max(...Object.values(report.typeDistribution), 1)) * 200;
          ctx.fillStyle = '#475569';
          ctx.font = '14px sans-serif';
          ctx.fillText(typeNames[type] || type, 30, y + 5);
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(120, y - 12, barWidth, 20);
          ctx.fillStyle = '#1e3a8a';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText(`${count} 份`, 130 + barWidth, y + 5);
          y += 35;
        });

        y += 20;
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('三、到期分布', 30, y);
        y += 30;

        report.expiryDistribution.forEach(item => {
          ctx.fillStyle = '#475569';
          ctx.font = '14px sans-serif';
          ctx.fillText(item.period, 30, y);
          ctx.fillStyle = '#d97706';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText(`${item.count} 份`, 200, y);
          y += 28;
        });

        if (report.upcomingExpiry.length > 0) {
          y += 20;
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText('四、即将到期合同', 30, y);
          y += 30;

          report.upcomingExpiry.slice(0, 5).forEach(contract => {
            ctx.fillStyle = '#475569';
            ctx.font = '14px sans-serif';
            ctx.fillText(contract.title, 30, y);
            ctx.fillStyle = '#dc2626';
            ctx.font = '12px sans-serif';
            ctx.fillText(`到期日: ${contract.endDate}`, 350, y);
            y += 28;
          });
        }

        y += 40;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`生成时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, width / 2, y);
        ctx.fillText('合同管家 - 智能合同管理系统', width / 2, y + 20);

        Taro.canvasToTempFilePath({
          canvas,
          success: (res) => {
            Taro.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                console.log('[PDF] 报告已保存到相册');
                Taro.showToast({ title: '报告已保存', icon: 'success' });
                resolve(res.tempFilePath);
              },
              fail: (err) => {
                console.error('[PDF] 保存失败', err);
                Taro.showModal({
                  title: '提示',
                  content: '保存到相册失败，是否保存为临时文件？',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      resolve(res.tempFilePath);
                    } else {
                      reject(err);
                    }
                  }
                });
              }
            });
          },
          fail: (err) => {
            console.error('[PDF] 生成临时文件失败', err);
            reject(err);
          }
        });
      });
  });
};

export const generateContractPDF = (contract: Contract, canvasId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const query = Taro.createSelectorQuery();
    query.select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          reject(new Error('Canvas not found'));
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = Taro.getSystemInfoSync().pixelRatio;
        const width = 600;
        const height = 900;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#1e3a8a';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(contract.title, width / 2, 80);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px sans-serif';
        ctx.fillText(`合同编号: ${contract.contractNo}`, width / 2, 110);

        let y = 160;
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('甲方信息', 30, y);
        y += 30;
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(`姓名: ${contract.partyA.name}`, 30, y); y += 25;
        ctx.fillText(`身份证号: ${contract.partyA.idNumber}`, 30, y); y += 25;
        ctx.fillText(`联系电话: ${contract.partyA.phone}`, 30, y); y += 25;
        ctx.fillText(`地址: ${contract.partyA.address}`, 30, y); y += 25;

        y += 20;
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('乙方信息', 30, y);
        y += 30;
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(`姓名: ${contract.partyB.name}`, 30, y); y += 25;
        ctx.fillText(`身份证号: ${contract.partyB.idNumber}`, 30, y); y += 25;
        ctx.fillText(`联系电话: ${contract.partyB.phone}`, 30, y); y += 25;
        ctx.fillText(`地址: ${contract.partyB.address}`, 30, y); y += 25;

        y += 20;
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('合同详情', 30, y);
        y += 30;
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(`合同金额: ¥ ${contract.amount.toLocaleString()}`, 30, y); y += 25;
        ctx.fillText(`合同期限: ${contract.startDate} 至 ${contract.endDate}`, 30, y); y += 25;

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(30, y + 10);
        ctx.lineTo(width - 30, y + 10);
        ctx.stroke();

        y += 40;
        contract.clauses.forEach((clause, index) => {
          if (y > height - 100) return;
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText(`${index + 1}. ${clause.title}`, 30, y);
          y += 25;
          ctx.fillStyle = '#475569';
          ctx.font = '13px sans-serif';
          const words = clause.content.split('');
          let line = '';
          for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > 500 && i > 0) {
              ctx.fillText(line, 30, y);
              line = words[i];
              y += 22;
            } else {
              line = testLine;
            }
          }
          ctx.fillText(line, 30, y);
          y += 30;
        });

        y += 30;
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`生成时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, width / 2, height - 60);
        ctx.fillText('本合同由合同管家系统生成，具有法律效力', width / 2, height - 40);

        Taro.canvasToTempFilePath({
          canvas,
          success: (res) => {
            Taro.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                console.log('[PDF] 合同已保存到相册');
                Taro.showToast({ title: '合同已保存', icon: 'success' });
                resolve(res.tempFilePath);
              },
              fail: (err) => {
                console.error('[PDF] 保存失败', err);
                reject(err);
              }
            });
          },
          fail: (err) => {
            console.error('[PDF] 生成临时文件失败', err);
            reject(err);
          }
        });
      });
  });
};
