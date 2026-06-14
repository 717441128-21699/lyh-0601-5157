export const generateQRCodeMatrix = (text: string, size: number = 21): boolean[][] => {
  const matrix: boolean[][] = [];
  const data = text.split('').map(c => c.charCodeAt(0));
  
  for (let i = 0; i < size; i++) {
    matrix[i] = [];
    for (let j = 0; j < size; j++) {
      if (i < 7 && j < 7) {
        matrix[i][j] = !((i === 0 || i === 6 || j === 0 || j === 6) || (i >= 2 && i <= 4 && j >= 2 && j <= 4));
      } else if (i < 7 && j >= size - 7) {
        const jj = j - (size - 7);
        matrix[i][j] = !((i === 0 || i === 6 || jj === 0 || jj === 6) || (i >= 2 && i <= 4 && jj >= 2 && jj <= 4));
      } else if (i >= size - 7 && j < 7) {
        const ii = i - (size - 7);
        matrix[i][j] = !((ii === 0 || ii === 6 || j === 0 || j === 6) || (ii >= 2 && ii <= 4 && j >= 2 && j <= 4));
      } else {
        const dataIndex = (i * size + j) % data.length;
        const bitIndex = (i * size + j) % 8;
        const bit = (data[dataIndex] >> bitIndex) & 1;
        matrix[i][j] = bit === 1;
      }
    }
  }
  
  return matrix;
};

export const drawQRCode = (
  canvasId: string,
  text: string,
  options: { size?: number; margin?: number; darkColor?: string; lightColor?: string } = {}
): Promise<void> => {
  const { size = 200, margin = 10, darkColor = '#000000', lightColor = '#ffffff' } = options;
  
  return new Promise((resolve) => {
    const query = Taro.createSelectorQuery();
    query.select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          console.error('[QRCode] Canvas not found');
          resolve();
          return;
        }
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = Taro.getSystemInfoSync().pixelRatio;
        
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);
        
        const matrix = generateQRCodeMatrix(text);
        const cellSize = (size - margin * 2) / matrix.length;
        
        ctx.fillStyle = lightColor;
        ctx.fillRect(0, 0, size, size);
        
        ctx.fillStyle = darkColor;
        for (let i = 0; i < matrix.length; i++) {
          for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j]) {
              ctx.fillRect(
                margin + j * cellSize,
                margin + i * cellSize,
                cellSize,
                cellSize
              );
            }
          }
        }
        
        console.log('[QRCode] 二维码绘制完成');
        resolve();
      });
  });
};

export const saveQRCodeImage = (canvasId: string, fileName: string): Promise<string> => {
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
        Taro.canvasToTempFilePath({
          canvas,
          success: (res) => {
            Taro.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                console.log('[QRCode] 二维码已保存到相册');
                resolve(res.tempFilePath);
              },
              fail: (err) => {
                console.error('[QRCode] 保存失败', err);
                reject(err);
              }
            });
          },
          fail: (err) => {
            console.error('[QRCode] 生成临时文件失败', err);
            reject(err);
          }
        });
      });
  });
};
