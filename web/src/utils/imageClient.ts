import { getLLMClient } from './llmClient';

// OpenAI Image API 相关类型定义
export interface ImageGenerateParams {
  prompt: string;
  model?: 'gpt-image-1' | 'dall-e-3';
  n?: number;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  response_format?: 'url' | 'b64_json';
  user?: string;
}

export interface ImageEditParams {
  image: File;
  mask?: File;
  prompt: string;
  model?: 'gpt-image-1';
  n?: number;
  size?: '256x256' | '512x512' | '1024x1024';
  response_format?: 'url' | 'b64_json';
  user?: string;
}

export interface ImageVariationParams {
  image: File;
  model?: 'gpt-image-1';
  n?: number;
  size?: '256x256' | '512x512' | '1024x1024';
  response_format?: 'url' | 'b64_json';
  user?: string;
}

export interface ImageResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

/**
 * 生成图片
 * @param params 生成参数
 * @returns 生成的图片响应
 */
export async function generateImage(params: ImageGenerateParams): Promise<ImageResponse> {
  const client = getLLMClient();
  if (!client) {
    throw new Error('无法获取OpenAI客户端实例，请检查API配置');
  }

  try {
    const response = await client.images.generate({
      prompt: params.prompt,
      model: params.model || 'dall-e-3',
      n: params.n || 1,
      size: params.size || '1024x1024',
      quality: params.quality || 'standard',
      style: params.style || 'vivid',
      ...(params.model !== 'gpt-image-1' ? { response_format: params.response_format || 'url' } : {}),
      user: params.user,
    });

    return response as ImageResponse;
  } catch (error: any) {
    console.error('图片生成失败:', error);
    throw new Error(`图片生成失败: ${error.message || '未知错误'}`);
  }
}

/**
 * 编辑图片
 * @param params 编辑参数
 * @returns 编辑后的图片响应
 */
export async function editImage(params: ImageEditParams): Promise<ImageResponse> {
  const client = getLLMClient();
  if (!client) {
    throw new Error('无法获取OpenAI客户端实例，请检查API配置');
  }

  try {
    const response = await client.images.edit({
      image: params.image,
      mask: params.mask,
      prompt: params.prompt,
      model: params.model || 'gpt-image-1',
      n: params.n || 1,
      size: params.size || '1024x1024',
      ...(params.model !== 'gpt-image-1' ? { response_format: params.response_format || 'url' } : {}),
      user: params.user,
    });

    return response as ImageResponse;
  } catch (error: any) {
    console.error('图片编辑失败:', error);
    throw new Error(`图片编辑失败: ${error.message || '未知错误'}`);
  }
}

/**
 * 生成图片变体
 * @param params 变体参数
 * @returns 生成的图片变体响应
 */
export async function createImageVariation(params: ImageVariationParams): Promise<ImageResponse> {
  const client = getLLMClient();
  if (!client) {
    throw new Error('无法获取OpenAI客户端实例，请检查API配置');
  }

  try {
    const response = await client.images.createVariation({
      image: params.image,
      model: params.model || 'gpt-image-1',
      n: params.n || 1,
      size: params.size || '1024x1024',
      ...(params.model !== 'gpt-image-1' ? { response_format: params.response_format || 'url' } : {}),
      user: params.user,
    });

    return response as ImageResponse;
  } catch (error: any) {
    console.error('图片变体生成失败:', error);
    throw new Error(`图片变体生成失败: ${error.message || '未知错误'}`);
  }
}

/**
 * 将图片文件转换为File对象（用于API调用）
 * @param file 文件对象
 * @param maxSize 最大文件大小（字节）
 * @returns 处理后的文件对象
 */
export function validateImageFile(file: File, maxSize: number = 4 * 1024 * 1024): File {
  // 检查文件类型
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('不支持的文件类型，请上传 PNG、JPEG 或 WebP 格式的图片');
  }

  // 检查文件大小
  if (file.size > maxSize) {
    throw new Error(`文件大小不能超过 ${Math.round(maxSize / (1024 * 1024))}MB`);
  }

  return file;
}

/**
 * 创建画布用于绘制蒙版
 * @param width 画布宽度
 * @param height 画布高度
 * @returns HTMLCanvasElement
 */
export function createMaskCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // 设置透明背景
    ctx.clearRect(0, 0, width, height);
  }
  
  return canvas;
}

/**
 * 将canvas转换为File对象
 * @param canvas HTMLCanvasElement
 * @param filename 文件名
 * @returns Promise<File>
 */
export function canvasToFile(canvas: HTMLCanvasElement, filename: string = 'mask.png'): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], filename, { type: 'image/png' });
        resolve(file);
      } else {
        reject(new Error('无法生成蒙版文件'));
      }
    }, 'image/png');
  });
} 