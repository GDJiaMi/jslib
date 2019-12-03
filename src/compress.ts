import { setupLocalPreviewUrl } from './string'

/**
 * 图片压缩
 */

/**
 * 压缩配置项
 */
interface CompressOptions {
  quality: number
  width?: number
  height?: number
}

async function canvasDataURL(url: string, obj: CompressOptions) {
  return new Promise<Blob>((resolve, reject) => {
    const img = new Image()
    img.src = url
    img.onload = () => {
      // 默认按比例压缩
      let w = img.width > 4000 ? 4000 : img.width
      let h = img.height > 4000 ? 4000 : img.height
      const scale = w / h
      w = obj.width || w
      h = obj.height || w / scale
      // 生成canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      // 创建属性节点
      const anw = document.createAttribute('width')
      anw.nodeValue = w.toString()
      const anh = document.createAttribute('height')
      anh.nodeValue = h.toString()
      canvas.setAttributeNode(anw)
      canvas.setAttributeNode(anh)
      ctx!.drawImage(img, 0, 0, w, h)

      // quality值越小，所绘制出的图像越模糊
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob)
          }
        },
        'image/jpeg',
        obj.quality,
      )
    }
    img.onerror = reject
  })
}

/**
 * 对图片进行压缩处理，通过压缩比率控制输出文件的大小
 *
 * @param file 图片文件
 * @param quality 压缩比率
 *
 */
export async function compressImage(file: File, quality: number) {
  return new Promise<File>(async resolve => {
    const bl = await canvasDataURL(setupLocalPreviewUrl(file), { quality })
    resolve(new File([bl], file.name, { type: file.type }))
  })
}

/**
 * 对图片进行压缩处理，通过传入的 maxSize， 控制输出文件的大小，压缩到小于 maxSize，或者到达最小压缩比的文件
 *
 * @param file 图片文件
 * @param maxSize 压缩最大值，单位字节
 *
 */
export async function compressImageBySize(file: File, maxSize: number) {
  return compressImage(file, Math.min(maxSize / file.size, 1))
}
