
/**
 * Splits an image into a grid of segments.
 */
export const splitImage = async (
  imageSrc: string,
  rows: number,
  cols: number
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const segmentWidth = img.width / cols;
      const segmentHeight = img.height / rows;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = segmentWidth;
      canvas.height = segmentHeight;

      const results: string[] = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.clearRect(0, 0, segmentWidth, segmentHeight);
          ctx.drawImage(
            img,
            c * segmentWidth,
            r * segmentHeight,
            segmentWidth,
            segmentHeight,
            0,
            0,
            segmentWidth,
            segmentHeight
          );
          results.push(canvas.toDataURL('image/png'));
        }
      }
      resolve(results);
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
};

/**
 * Merges multiple segments back into a single image.
 */
export const mergeImages = async (
  segments: string[],
  rows: number,
  cols: number
): Promise<string> => {
  if (segments.length === 0) return '';

  return new Promise((resolve, reject) => {
    const firstImg = new Image();
    firstImg.onload = () => {
      const sw = firstImg.width;
      const sh = firstImg.height;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return reject(new Error('No context'));

      canvas.width = sw * cols;
      canvas.height = sh * rows;

      let loadedCount = 0;
      segments.forEach((src, index) => {
        const img = new Image();
        img.onload = () => {
          const r = Math.floor(index / cols);
          const c = index % cols;
          ctx.drawImage(img, c * sw, r * sh, sw, sh);
          loadedCount++;
          if (loadedCount === segments.length) {
            resolve(canvas.toDataURL('image/png'));
          }
        };
        img.onerror = reject;
        img.src = src;
      });
    };
    firstImg.src = segments[0];
  });
};

/**
 * Resize a file to match a specific size if needed, or just convert to dataUrl.
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
