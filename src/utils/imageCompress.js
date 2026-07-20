/**
 * 将文件压缩为 JPEG base64（控制体积，便于多模态上传）
 */
export function compressImageFile(file, { maxWidth = 1280, quality = 0.78 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('请选择图片文件'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('读取图片失败'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('图片解码失败'))
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        const comma = dataUrl.indexOf(',')
        resolve({
          mimeType: 'image/jpeg',
          base64: comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl,
          previewUrl: dataUrl,
          name: file.name
        })
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
