import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Layout,
  Card,
  Button,
  Input,
  Upload,
  Select,
  Form,
  Row,
  Col,
  Space,
  Typography,
  message,
  Spin,
  Slider,
  Image,
  Tag,
  Tooltip,
  Divider,
  Alert,
  Progress,
  Radio,
  Modal
} from 'antd';
import {
  PictureOutlined,
  EditOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ClearOutlined,
  ZoomInOutlined,
  UploadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  BulbOutlined,
  LoadingOutlined,
  StarOutlined,
  StarFilled,
  ReloadOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import { useModelStore } from '../../stores/modelStore';
import { hasValidLLMConfig } from '../../utils/llmClient';
import {
  generateImage,
  editImage,
  validateImageFile,
  createMaskCanvas,
  canvasToFile,
  type ImageGenerateParams,
  type ImageEditParams
} from '../../utils/imageClient';
import { generateImagePrompt } from '../../api/promptApi';
import {
  saveGeneratedImage,
  type SaveGeneratedImageInput,
  toggleImageFavorite,
  searchImages,
  type ImageSearchInput
} from '../../api/imageApi';
import './ImageGeneration.css';

const { Content } = Layout;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

// 将 base64 数据 URI 转换为 Blob URL 的工具函数
const convertBase64ToBlob = (dataUri: string): string => {
  if (!dataUri.startsWith('data:image/')) {
    return dataUri; // 不是base64格式，直接返回
  }

  try {
    // 提取base64数据
    const [header, base64Data] = dataUri.split(',');
    const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png';

    // 将base64转换为二进制数据
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // 创建Blob并生成URL
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('转换base64失败:', error);
    return dataUri; // 转换失败时返回原始数据
  }
};

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  revisedPrompt?: string;
  timestamp: number;
  type: 'generate' | 'edit';
  model: string;
  size: string;
  isFavorite?: boolean;
  savedId?: string; // 后端保存的ID
}

const ImageGeneration: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuthStore();

  // 使用模型 store
  const {
    fetchModels,
    getImageModelOptions,
    defaultImageGenerationModel,
    isLoading: modelsLoading,
    error: modelsError,
  } = useModelStore();

  // 获取图片模型选项
  const imageModelOptions = getImageModelOptions();

  // 生成状态
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // 表单
  const [form] = Form.useForm();

  // 图片管理
  const [images, setImages] = useState<GeneratedImage[]>([]);

  // 历史记录加载状态
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // 提示词状态管理
  const [promptValue, setPromptValue] = useState('');

  // 提示词优化相关状态
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeModalVisible, setOptimizeModalVisible] = useState(false);
  const [optimizeRequirement, setOptimizeRequirement] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [optimizedResult, setOptimizedResult] = useState('');

  // 编辑功能
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [maskCanvas, setMaskCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [showMask, setShowMask] = useState(true);
  const [brushMode, setBrushMode] = useState<'draw' | 'erase'>('draw');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // 自动判断当前模式
  const currentMode = editImageFile ? 'edit' : 'generate';

  // 检查API配置
  const checkApiConfig = useCallback(() => {
    return isAuthenticated && hasValidLLMConfig();
  }, [isAuthenticated]);

  // 加载历史记录
  const loadHistoryImages = useCallback(async () => {
    if (!isAuthenticated || historyLoaded || loadingHistory) {
      return;
    }

    setLoadingHistory(true);
    try {
      const searchInput: ImageSearchInput = {
        page: 1,
        pageSize: 50, // 加载最近50张图片
        sortBy: 'CreatedTime',
        sortOrder: 'desc'
      };

      const result = await searchImages(searchInput);
      if (result.success && result.data?.items) {
        const historyImages: GeneratedImage[] = result.data.items.map(item => ({
          id: `history_${item.id}`,
          url: item.imageUrl,
          prompt: item.prompt,
          revisedPrompt: item.revisedPrompt,
          timestamp: new Date(item.createdTime).getTime(),
          type: item.type as 'generate' | 'edit',
          model: item.model,
          size: item.size,
          isFavorite: item.isFavorite,
          savedId: item.id
        }));

        // 将历史记录添加到当前图片列表的末尾
        setImages(prev => {
          // 去重，避免重复添加
          const existingIds = new Set(prev.map(img => img.savedId).filter(Boolean));
          const newHistoryImages = historyImages.filter(img => !existingIds.has(img.savedId));
          return [...prev, ...newHistoryImages];
        });

        setHistoryLoaded(true);
        console.log(t('imageGeneration.messages.historyLoadSuccess', { count: historyImages.length }));
      }
    } catch (error: any) {
      console.error(t('imageGeneration.messages.historyLoadFailed'), error);
      message.warning(t('imageGeneration.messages.historyLoadFailed') + ': ' + error.message);
    } finally {
      setLoadingHistory(false);
    }
  }, [isAuthenticated, historyLoaded, loadingHistory, t]);

  // 初始化时获取模型列表
  useEffect(() => {
    const initializeModels = async () => {
      const response = await fetchModels();
      // 如果表单还没有设置模型值，使用默认图片模型
      if (response.imageModels && !form.getFieldValue('model')) {
        form.setFieldValue('model', response.imageModels[0].id);
      }
    };
    initializeModels();
  }, [fetchModels, form]);

  // 如果获取模型失败，显示错误信息
  useEffect(() => {
    if (modelsError) {
      message.warning(t('imageGeneration.messages.modelsLoadFailed') + ': ' + modelsError);
    }
  }, [modelsError, t]);

  // 当图片模型列表加载完成后，设置默认模型
  useEffect(() => {
    if (imageModelOptions.length > 0 && !form.getFieldValue('model')) {
      form.setFieldValue('model', imageModelOptions[0].value);
    }
  }, [imageModelOptions, form]);

  // 当默认图片模型可用时，更新表单默认值
  useEffect(() => {
    if (defaultImageGenerationModel && !form.getFieldValue('model')) {
      form.setFieldValue('model', defaultImageGenerationModel);
    }
  }, [defaultImageGenerationModel, form]);

  // 用户登录后加载历史记录
  useEffect(() => {
    if (isAuthenticated && !historyLoaded && !loadingHistory) {
      loadHistoryImages();
    }
  }, [isAuthenticated, loadHistoryImages]);

  // 组件卸载时清理所有 Blob URL
  useEffect(() => {
    return () => {
      // 清理所有的 Blob URL 以避免内存泄露
      images.forEach(image => {
        if (image.url.startsWith('blob:')) {
          URL.revokeObjectURL(image.url);
        }
      });
    };
  }, [images]);

  // 生成/编辑图片
  const handleSubmit = async (values: any) => {
    if (!checkApiConfig()) {
      message.error(t('imageGeneration.messages.configRequired'));
      return;
    }

    if (!promptValue.trim()) {
      message.error(t('imageGeneration.messages.promptRequired'));
      return;
    }

    if (currentMode === 'edit' && !editImageFile) {
      message.error(t('imageGeneration.messages.imageRequired'));
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      // 模拟进度
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      let response;
      let newImages: GeneratedImage[];

      if (currentMode === 'generate') {
        // 文字生成图片
        const params: ImageGenerateParams = {
          prompt: promptValue,
          model: values.model || 'gpt-4o-image-1',
          n: values.n || 1,
          size: values.size || '1024x1024',
          quality: values.quality || 'standard',
          style: values.style || 'vivid',
        };

        response = await generateImage(params);
        newImages = response.data.map((item, index) => {
          // 处理图片URL，优先使用URL，其次转换base64为Blob URL
          let imageUrl = '';
          if (item.url) {
            imageUrl = item.url;
          } else if (item.b64_json) {
            // 将base64转换为data URI，然后转换为Blob URL以提升性能
            const dataUri = `data:image/png;base64,${item.b64_json}`;
            imageUrl = convertBase64ToBlob(dataUri);
          }

          return {
            id: `gen_${Date.now()}_${index}`,
            url: imageUrl,
            prompt: promptValue,
            revisedPrompt: item.revised_prompt,
            timestamp: Date.now(),
            type: 'generate',
            model: params.model || 'gpt-4o-image-1',
            size: params.size || '1024x1024',
          };
        });
      } else {
        // 图片编辑
        let maskFile: File | undefined;

        if (maskCanvas) {
          // 检查是否有绘制蒙版
          const ctx = maskCanvas.getContext('2d');
          if (ctx) {
            const imageData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
            const hasDrawing = imageData.data.some((value, index) => index % 4 === 3 && value > 0);

            if (hasDrawing) {
              maskFile = await canvasToFile(maskCanvas);
            }
          }
        }

        const params: ImageEditParams = {
          image: editImageFile!,
          mask: maskFile,
          prompt: promptValue,
          model: values.model || 'gpt-image-1', // 使用用户选择的模型
          n: values.n || 1,
          size: values.size || '1024x1024',
        };

        response = await editImage(params);
        newImages = response.data.map((item, index) => {
          // 处理图片URL，优先使用URL，其次转换base64为Blob URL
          let imageUrl = '';
          if (item.url) {
            imageUrl = item.url;
          } else if (item.b64_json) {
            // 将base64转换为data URI，然后转换为Blob URL以提升性能
            const dataUri = `data:image/png;base64,${item.b64_json}`;
            imageUrl = convertBase64ToBlob(dataUri);
          }

          return {
            id: `edit_${Date.now()}_${index}`,
            url: imageUrl,
            prompt: promptValue,
            timestamp: Date.now(),
            type: 'edit',
            model: values.model || 'gpt-image-1', // 使用用户选择的模型
            size: params.size || '1024x1024',
          };
        });
      }

      clearInterval(progressInterval);
      setProgress(100);

      setImages(prev => [...newImages, ...prev]);
      message.success(t(currentMode === 'generate' ? 'imageGeneration.messages.generateSuccess' : 'imageGeneration.messages.editSuccess', { count: newImages.length }));

      // 如果用户已登录，保存图片到后端
      if (isAuthenticated) {
        await saveImagesToBackend(newImages, values);
      }

    } catch (error: any) {
      message.error(error.message || t('imageGeneration.messages.generateFailed'));
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // 初始化蒙版画布
  const initMaskCanvas = useCallback((img: HTMLImageElement) => {
    const canvas = createMaskCanvas(img.naturalWidth, img.naturalHeight);
    setMaskCanvas(canvas);
  }, []);

  // 更新画布显示
  const updateCanvasDisplay = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !maskCanvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制原图
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 绘制蒙版
    if (showMask) {
      ctx.save();
      ctx.globalAlpha = 0.5;

      // 将蒙版数据绘制到显示画布上
      const maskCtx = maskCanvas.getContext('2d');
      if (maskCtx) {
        const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = maskCanvas.width;
        tempCanvas.height = maskCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.putImageData(imageData, 0, 0);

          // 创建红色蒙版覆盖
          tempCtx.globalCompositeOperation = 'source-in';
          tempCtx.fillStyle = '#ff4d4f';
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

          ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
        }
      }

      ctx.restore();
    }
  }, [maskCanvas, showMask]);

  // 绘制蒙版
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!maskCanvas || currentMode !== 'edit') return;
    setIsDrawing(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = maskCanvas.width / rect.width;
    const scaleY = maskCanvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    drawOnMask(x, y);
  }, [maskCanvas, currentMode, brushMode, brushSize]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !maskCanvas || currentMode !== 'edit') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = maskCanvas.width / rect.width;
    const scaleY = maskCanvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    drawOnMask(x, y);
  }, [isDrawing, maskCanvas, currentMode, brushMode, brushSize]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // 在蒙版上绘制
  const drawOnMask = useCallback((x: number, y: number) => {
    if (!maskCanvas) return;

    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = brushMode === 'draw' ? 'source-over' : 'destination-out';
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, 2 * Math.PI);
    ctx.fill();

    updateCanvasDisplay();
  }, [maskCanvas, brushMode, brushSize, updateCanvasDisplay]);

  // 清空蒙版
  const clearMask = useCallback(() => {
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      updateCanvasDisplay();
    }
  }, [maskCanvas, updateCanvasDisplay]);

  // 下载图片
  const downloadImage = useCallback((image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `${image.type}_${image.timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // 删除图片
  const deleteImage = useCallback((imageId: string) => {
    setImages(prev => {
      const imageToDelete = prev.find(img => img.id === imageId);
      if (imageToDelete?.url.startsWith('blob:')) {
        // 释放 Blob URL 以避免内存泄露
        URL.revokeObjectURL(imageToDelete.url);
      }
      return prev.filter(img => img.id !== imageId);
    });
    message.success(t('imageGeneration.messages.imageDeleted'));
  }, [t]);

  // 文件上传处理
  const handleImageUpload = useCallback((file: File) => {
    try {
      const validatedFile = validateImageFile(file);
      setEditImageFile(validatedFile);

      // 创建图片预览和初始化蒙版
      const img = document.createElement('img');
      img.onload = () => {
        initMaskCanvas(img);
        if (imageRef.current) {
          imageRef.current.src = img.src;
        }
        updateCanvasDisplay();
      };
      img.src = URL.createObjectURL(validatedFile);

      return false; // 阻止默认上传
    } catch (error: any) {
      message.error(error.message);
      return false;
    }
  }, [initMaskCanvas, updateCanvasDisplay]);

  // 移除图片
  const handleRemoveImage = () => {
    setEditImageFile(null);
    setMaskCanvas(null);
    setPromptValue(''); // 重置提示词状态
  };

  // 优化提示词
  const handleOptimizePrompt = async () => {
    if (!promptValue.trim()) {
      message.warning(t('imageGeneration.messages.optimizePromptFirst'));
      return;
    }

    if (!checkApiConfig()) {
      message.error(t('imageGeneration.messages.configRequired'));
      return;
    }

    setOptimizeModalVisible(true);
  };

  // 执行优化
  const executeOptimize = async () => {
    // 保存原始提示词
    setOriginalPrompt(promptValue);
    setOptimizedResult('');
    setIsOptimizing(true);

    try {
      let optimizedPrompt = '';
      const data = {
        Prompt: promptValue + (optimizeRequirement.trim() ? `\n\n优化要求：${optimizeRequirement}` : ''),
        language: i18n.language || 'zh-CN'
      };

      for await (const event of generateImagePrompt(data)) {
        if (event.data === '[DONE]') {
          break;
        }

        if (event.data) {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'message') {
              optimizedPrompt += parsed.message;
              // 实时更新优化结果显示
              setOptimizedResult(optimizedPrompt);
            }
          } catch (e) {
            // 处理非JSON格式的数据
            optimizedPrompt += event.data;
            // 实时更新优化结果显示
            setOptimizedResult(optimizedPrompt);
          }
        }
      }

      if (optimizedPrompt.trim()) {
        setOptimizedResult(optimizedPrompt.trim());
        message.success(t('imageGeneration.messages.optimizeComplete'));
      } else {
        message.warning(t('imageGeneration.messages.optimizeEmpty'));
        setOptimizedResult('');
      }
    } catch (error: any) {
      message.error(error.message || t('imageGeneration.messages.optimizeFailed'));
      setOptimizedResult('');
    } finally {
      setIsOptimizing(false);
    }
  };

  // 插入优化结果
  const insertOptimizedPrompt = () => {
    if (optimizedResult.trim()) {
      // 直接更新提示词状态
      setPromptValue(optimizedResult.trim());
      message.success(t('imageGeneration.messages.optimizeInserted'));
      // 关闭模态框并重置状态
      setOptimizeModalVisible(false);
      setOptimizeRequirement('');
      setOriginalPrompt('');
      setOptimizedResult('');
    }
  };

  // 取消优化
  const cancelOptimize = () => {
    if (isOptimizing) {
      // 如果正在优化中，停止优化
      setIsOptimizing(false);
      message.info(t('imageGeneration.messages.optimizeCanceled'));
    }
    setOptimizeModalVisible(false);
    setOptimizeRequirement('');
    setOriginalPrompt('');
    setOptimizedResult('');
  };

  // 用图片进行编辑
  const handleEditImage = useCallback(async (image: GeneratedImage) => {
    try {
      // 将图片URL转换为File对象
      const response = await fetch(image.url);
      const blob = await response.blob();
      const file = new File([blob], `edit_${image.timestamp}.png`, { type: 'image/png' });

      // 设置为编辑文件
      setEditImageFile(file);

      // 设置提示词为原始提示词
      setPromptValue(image.prompt);

      // 创建图片预览和初始化蒙版
      const img = document.createElement('img');
      img.onload = () => {
        initMaskCanvas(img);
        if (imageRef.current) {
          imageRef.current.src = img.src;
        }
        updateCanvasDisplay();
      };
      img.src = image.url;

      message.success(t('imageGeneration.messages.imageLoaded'));
    } catch (error: any) {
      message.error(t('imageGeneration.messages.loadImageFailed') + ': ' + error.message);
    }
  }, [initMaskCanvas, updateCanvasDisplay, t]);

  // 切换收藏状态
  const handleToggleFavorite = useCallback(async (image: GeneratedImage) => {
    // 如果图片已保存到后端，调用API切换收藏状态
    if (image.savedId && isAuthenticated) {
      try {
        const result = await toggleImageFavorite(image.savedId);
        if (result.success) {
          // 更新本地状态
          setImages(prev => prev.map(img =>
            img.id === image.id
              ? { ...img, isFavorite: result.data?.isFavorite ?? !img.isFavorite }
              : img
          ));
          message.success(result.data?.isFavorite ? t('imageGeneration.messages.favoriteSuccess') : t('imageGeneration.messages.unfavoriteSuccess'));
        } else {
          message.error(result.message || t('imageGeneration.messages.operationFailed'));
        }
      } catch (error: any) {
        message.error(t('imageGeneration.messages.operationFailed') + ': ' + error.message);
      }
    } else {
      // 只是本地切换
      setImages(prev => prev.map(img =>
        img.id === image.id
          ? { ...img, isFavorite: !img.isFavorite }
          : img
      ));
      message.success(image.isFavorite ? t('imageGeneration.messages.unfavoriteSuccess') : t('imageGeneration.messages.favoriteSuccess'));
    }
  }, [isAuthenticated, t]);

  // 保存图片到后端
  const saveImagesToBackend = useCallback(async (newImages: GeneratedImage[], formValues: any) => {
    if (!isAuthenticated) {
      return; // 未登录用户不保存
    }

    try {
      // 处理图片URL，如果是base64格式或Blob URL需要特殊处理
      const processImageUrl = (imageUrl: string): string => {
        // 检查是否是 data URI (base64) 格式
        if (imageUrl.startsWith('data:image/')) {
          // 对于 base64 格式的图片，我们先记录原始格式
          // 在实际生产环境中，这里应该上传到文件服务器并返回真实URL
          // 目前暂时返回一个标识，避免数据库存储过长的base64字符串
          console.warn('检测到base64格式图片，建议实现文件上传服务');
          return `base64_image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        // 检查是否是 Blob URL (由base64转换而来)
        if (imageUrl.startsWith('blob:')) {
          // 对于 Blob URL，也需要特殊处理，因为它们是临时的
          console.warn('检测到Blob URL格式图片，建议实现文件上传服务');
          return `blob_image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        return imageUrl;
      };

      const saveInputs: SaveGeneratedImageInput[] = newImages.map(image => ({
        imageUrl: processImageUrl(image.url),
        prompt: image.prompt,
        revisedPrompt: image.revisedPrompt,
        type: image.type,
        model: image.model,
        size: image.size,
        quality: formValues.quality,
        style: formValues.style,
        tags: [],
        generationParams: {
          n: formValues.n,
          quality: formValues.quality,
          style: formValues.style,
          // 标记原始数据类型
          originalUrl: image.url.startsWith('data:image/')
            ? '[base64_data]'
            : image.url.startsWith('blob:')
              ? '[blob_data]'
              : image.url
        }
      }));

      const result = await saveGeneratedImage(saveInputs);
      if (result.success && result.data) {
        // 更新本地图片的savedId
        setImages(prev => prev.map(img => {
          const savedImage = result.data?.find((saved: any) => {
            // 对于特殊格式图片，需要特殊匹配逻辑
            if (img.url.startsWith('data:image/')) {
              return saved.generationParams?.originalUrl === '[base64_data]';
            } else if (img.url.startsWith('blob:')) {
              return saved.generationParams?.originalUrl === '[blob_data]';
            } else {
              return saved.imageUrl === img.url;
            }
          });
          return savedImage
            ? { ...img, savedId: savedImage.id, isFavorite: savedImage.isFavorite }
            : img;
        }));
        console.log(`成功保存 ${result.data.length} 张图片到数据库`);
      }
    } catch (error: any) {
      console.error('保存图片失败:', error.message);
      // 如果是因为base64数据过大导致的错误，给出提示
      if (error.message.includes('413') || error.message.includes('too large')) {
        message.warning(t('imageGeneration.messages.saveCloudFailed'));
      }
    }
  }, [isAuthenticated, t]);

  return (
    <Layout style={{ minHeight: '100vh', }}>
      <Content style={{ margin: '5px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PictureOutlined />
            {t('imageGeneration.title')}
          </Title>
          <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
            {currentMode === 'generate'
              ? t('imageGeneration.description.generate')
              : t('imageGeneration.description.edit')
            }
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          {/* 左侧控制面板 */}
          <Col xs={24} lg={10}>
            <Card
              title={
                <Space>
                  {currentMode === 'generate' ? <PictureOutlined /> : <EditOutlined />}
                  {currentMode === 'generate' ? t('imageGeneration.generateMode') : t('imageGeneration.editMode')}
                  <Tag color={currentMode === 'generate' ? 'blue' : 'orange'}>
                    {currentMode === 'generate' ? t('imageGeneration.generateModeTag') : t('imageGeneration.editModeTag')}
                  </Tag>
                </Space>
              }
              style={{
                height: 'calc(100vh - 115px)',
                overflow: 'auto',
                overflowX: 'hidden',
              }}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                  model: defaultImageGenerationModel || 'gpt-image-1',
                  size: '1024x1024',
                  quality: 'standard',
                  style: 'vivid',
                  n: 1
                }}
              >
                {/* 图片上传区域 */}
                <Form.Item
                  label={
                    <Space>
                      <span>{t('imageGeneration.upload.title')}</span>
                      {editImageFile && (
                        <Button
                          type="link"
                          size="small"
                          onClick={handleRemoveImage}
                          style={{ padding: 0, height: 'auto' }}
                        >
                          {t('imageGeneration.upload.switchToGenerate')}
                        </Button>
                      )}
                    </Space>
                  }
                >
                  <Upload
                    accept="image/*"
                    beforeUpload={handleImageUpload}
                    maxCount={1}
                    listType="picture-card"
                    showUploadList={false}
                    disabled={isOptimizing || loading}
                    style={{ width: '100%' }}
                  >
                    {editImageFile ? (
                      <img
                        src={URL.createObjectURL(editImageFile)}
                        alt="edit"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center' }}>
                        <UploadOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#1677ff' }} />
                        <div>{t('imageGeneration.upload.uploadText')}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {t('imageGeneration.upload.supportedFormats')}
                        </Text>
                      </div>
                    )}
                  </Upload>
                </Form.Item>

                {/* 蒙版编辑工具 (仅编辑模式) */}
                {currentMode === 'edit' && editImageFile && (
                  <>
                    <Divider>蒙版编辑工具</Divider>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Form.Item label="绘制模式" style={{ marginBottom: 8 }}>
                          <Radio.Group
                            value={brushMode}
                            onChange={(e) => setBrushMode(e.target.value)}
                            style={{ width: '100%' }}
                            buttonStyle="solid"
                            size="small"
                          >
                            <Radio.Button value="draw" style={{ width: '50%', textAlign: 'center' }}>
                              绘制
                            </Radio.Button>
                            <Radio.Button value="erase" style={{ width: '50%', textAlign: 'center' }}>
                              擦除
                            </Radio.Button>
                          </Radio.Group>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label={`画笔: ${brushSize}px`} style={{ marginBottom: 8 }}>
                          <Slider
                            min={5}
                            max={50}
                            value={brushSize}
                            onChange={setBrushSize}
                            tooltip={{ open: false }}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={8} style={{ marginBottom: 16 }}>
                      <Col span={8}>
                        <Button
                          icon={<ClearOutlined />}
                          onClick={clearMask}
                          block
                          size="small"
                        >
                          清空
                        </Button>
                      </Col>
                      <Col span={8}>
                        <Button
                          icon={showMask ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                          onClick={() => setShowMask(!showMask)}
                          type={showMask ? 'primary' : 'default'}
                          block
                          size="small"
                        >
                          {showMask ? '隐藏' : '显示'}
                        </Button>
                      </Col>
                    </Row>

                    {/* 画布预览 */}
                    <div style={{
                      border: '2px dashed #d9d9d9',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginBottom: 16,
                      position: 'relative',
                      backgroundColor: '#fafafa'
                    }}>
                      <img
                        ref={imageRef}
                        src={URL.createObjectURL(editImageFile)}
                        alt="edit preview"
                        style={{ display: 'none' }}
                        onLoad={updateCanvasDisplay}
                      />
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={400}
                        style={{
                          width: '100%',
                          height: 'auto',
                          cursor: currentMode === 'edit' ? (brushMode === 'draw' ? 'crosshair' : 'grab') : 'default',
                          display: 'block'
                        }}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
                      />
                    </div>

                    <Alert
                      message="蒙版编辑说明"
                      description={
                        <div>
                          <p style={{ marginBottom: '8px' }}>
                            在图片上绘制红色区域标记需要编辑的部分。AI将根据你的描述重新生成被标记的区域。
                          </p>
                          <p style={{ marginBottom: '0', color: '#ff7875', fontSize: '12px' }}>
                            ⚠️ 注意：gpt-image-1模型使用"软蒙版"技术，可能会对整张图片进行重新渲染以保持一致性。
                            建议在提示词中明确指出"只编辑蒙版区域，保持其他部分不变"。
                          </p>
                        </div>
                      }
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  </>
                )}

                {/* 提示词输入 */}
                <Form.Item
                  label={currentMode === 'generate' ? '图片描述' : '编辑描述'}
                >
                  <div style={{ position: 'relative' }}>
                    <TextArea
                      value={promptValue}
                      onChange={(e) => setPromptValue(e.target.value)}
                      rows={4}
                      placeholder={
                        currentMode === 'generate'
                          ? "详细描述你想要生成的图片，例如：一只可爱的橙色小猫坐在窗台上，阳光透过窗户洒在它身上，背景是模糊的花园"
                          : "描述你想要在蒙版区域生成的内容。建议格式：「只编辑蒙版标记的区域，将其替换为[具体内容]，保持图片其他部分完全不变」"
                      }
                      maxLength={4000}
                      showCount
                      disabled={isOptimizing}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={isOptimizing ? <LoadingOutlined /> : <BulbOutlined />}
                      onClick={handleOptimizePrompt}
                      disabled={isOptimizing || loading}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 20,
                        zIndex: 1,
                        color: '#1677ff',
                        border: 'none',
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: '4px'
                      }}
                      title={isOptimizing ? '正在优化...' : '优化提示词'}
                    >
                      {isOptimizing ? '优化中' : '优化'}
                    </Button>
                  </div>
                </Form.Item>

                {/* 模型选择 */}
                <Form.Item name="model" label="模型">
                  <Select
                    placeholder="选择图片生成模型"
                    allowClear
                    style={{ width: '100%' }}
                    loading={modelsLoading}
                    disabled={isOptimizing || loading}
                    showSearch
                    filterOption={(inputValue, option) => {
                      if (!inputValue) return true;
                      const label = option?.label || '';
                      return String(label).toLowerCase().includes(inputValue.toLowerCase());
                    }}
                  >
                    {imageModelOptions.map(option => (
                      <Select.Option key={option.value} value={option.value}>
                        {option.label || option.value}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* 参数设置 */}
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="size" label="尺寸">
                      <Select disabled={isOptimizing || loading}>
                        <Select.Option value="1024x1024">1024×1024</Select.Option>
                        <Select.Option value="1792x1024">1792×1024</Select.Option>
                        <Select.Option value="1024x1792">1024×1792</Select.Option>
                        <Select.Option value="512x512">512×512</Select.Option>
                        <Select.Option value="256x256">256×256</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="n" label="生成数量">
                      <Select disabled={isOptimizing || loading}>
                        <Select.Option value={1}>1张</Select.Option>
                        <Select.Option value={2}>2张</Select.Option>
                        <Select.Option value={3}>3张</Select.Option>
                        <Select.Option value={4}>4张</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {/* 高级参数 (仅生成模式) */}
                {currentMode === 'generate' && (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="quality" label="质量">
                        <Select disabled={isOptimizing || loading}>
                          <Select.Option value="standard">标准</Select.Option>
                          <Select.Option value="hd">高清</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="style" label="风格">
                        <Select disabled={isOptimizing || loading}>
                          <Select.Option value="vivid">生动</Select.Option>
                          <Select.Option value="natural">自然</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                )}

                {/* 提交按钮 */}
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    disabled={isOptimizing}
                    block
                    size="large"
                    icon={currentMode === 'generate' ? <PictureOutlined /> : <EditOutlined />}
                  >
                    {currentMode === 'generate' ? '生成图片' : '编辑图片'}
                  </Button>
                </Form.Item>
              </Form>

              {/* 优化要求输入模态框 */}
              <Modal
                title="优化提示词"
                open={optimizeModalVisible}
                footer={
                  optimizedResult && !isOptimizing ? (
                    // 优化完成后显示插入和取消按钮
                    <Space>
                      <Button onClick={cancelOptimize}>
                        取消
                      </Button>
                      <Button
                        type="primary"
                        onClick={insertOptimizedPrompt}
                        icon={<BulbOutlined />}
                      >
                        插入优化结果
                      </Button>
                    </Space>
                  ) : (
                    // 优化前或优化中显示默认按钮
                    <Space>
                      <Button
                        onClick={cancelOptimize}
                        disabled={isOptimizing}
                      >
                        取消
                      </Button>
                      <Button
                        type="primary"
                        onClick={executeOptimize}
                        loading={isOptimizing}
                        disabled={isOptimizing || !promptValue.trim()}
                      >
                        {isOptimizing ? "优化中..." : "开始优化"}
                      </Button>
                    </Space>
                  )
                }
                closable={!isOptimizing}
                maskClosable={!isOptimizing}
                width={600}
              >
                {optimizedResult && !isOptimizing ? (
                  // 显示优化结果
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <Text strong>原始提示词：</Text>
                      <div style={{
                        background: '#f5f5f5',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        marginTop: '4px',
                        maxHeight: '120px',
                        overflow: 'auto',
                        fontSize: '13px',
                        color: '#666',
                        border: '1px solid #d9d9d9'
                      }}>
                        {originalPrompt || '（未输入）'}
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <Text strong style={{ color: '#1677ff' }}>优化结果：</Text>
                      <div style={{
                        background: '#f6ffed',
                        padding: '12px',
                        borderRadius: '6px',
                        marginTop: '4px',
                        maxHeight: '200px',
                        overflow: 'auto',
                        fontSize: '14px',
                        color: '#333',
                        border: '1px solid #b7eb8f',
                        lineHeight: '1.6'
                      }}>
                        {optimizedResult}
                      </div>
                    </div>

                    <Alert
                      message="提示"
                      description='检查优化结果是否符合要求，点击"插入优化结果"将替换当前提示词。'
                      type="info"
                      showIcon
                    />
                  </div>
                ) : isOptimizing ? (
                  // 优化进行中
                  <div>
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 16 }}>
                        <Text type="secondary">
                          正在优化提示词，请稍候...
                        </Text>
                      </div>
                    </div>

                    {optimizedResult && (
                      <div style={{ marginTop: 20 }}>
                        <Text strong>实时生成结果：</Text>
                        <div style={{
                          background: '#f6ffed',
                          padding: '12px',
                          borderRadius: '6px',
                          marginTop: '8px',
                          maxHeight: '150px',
                          overflow: 'auto',
                          fontSize: '14px',
                          color: '#333',
                          border: '1px solid #b7eb8f',
                          lineHeight: '1.6',
                          minHeight: '50px'
                        }}>
                          {optimizedResult}
                          <span style={{
                            animation: 'blink 1s infinite',
                            fontSize: '16px',
                            color: '#1677ff',
                            marginLeft: '2px'
                          }}>|</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // 优化前的输入界面
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <Text strong>当前提示词：</Text>
                      <div style={{
                        background: '#f5f5f5',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        marginTop: '4px',
                        maxHeight: '100px',
                        overflow: 'auto',
                        fontSize: '13px',
                        color: '#666',
                        border: '1px solid #d9d9d9'
                      }}>
                        {promptValue || '（未输入）'}
                      </div>
                    </div>

                    <div>
                      <Text strong>
                        优化要求 <Text type="secondary">（可选）</Text>：
                      </Text>
                      <TextArea
                        value={optimizeRequirement}
                        onChange={(e) => setOptimizeRequirement(e.target.value)}
                        rows={3}
                        placeholder="描述你希望如何优化这个提示词，例如：让描述更加生动详细，添加光线和色彩描述..."
                        maxLength={500}
                        showCount
                        style={{ marginTop: '8px' }}
                      />
                    </div>
                  </>
                )}
              </Modal>
            </Card>
          </Col>

          {/* 右侧图片展示 */}
          <Col xs={24} lg={14}>
            <Card
              title={
                <Space>
                  <span>生成结果</span>
                  {isAuthenticated && loadingHistory && (
                    <Spin size="small" />
                  )}
                  {isAuthenticated && historyLoaded && (
                    <Tag color="green">已加载历史记录</Tag>
                  )}
                  {isAuthenticated && (
                    <Button
                      type="text"
                      size="small"
                      icon={<ReloadOutlined />}
                      loading={loadingHistory}
                      onClick={() => {
                        setHistoryLoaded(false);
                        loadHistoryImages();
                      }}
                      title="重新加载历史记录"
                    >
                      刷新
                    </Button>
                  )}
                </Space>
              }
              style={{
                height: 'calc(100vh - 120px)',
                display: 'flex',
                flexDirection: 'column'
              }}
              bodyStyle={{
                flex: 1,
                overflow: 'auto',
                padding: '16px'
              }}
            >
              {loading && (
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>
                    <Progress percent={progress} status="active" />
                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                      正在{currentMode === 'generate' ? '生成' : '编辑'}图片...
                    </Text>
                  </div>
                </div>
              )}

              <Row gutter={[16, 16]}>
                {images.map((image) => (
                  <Col key={image.id} xs={12} sm={12} md={12} lg={12} xl={8}>
                    <div className="image-item" style={{ position: 'relative' }}>
                      <div style={{
                        aspectRatio: '1',
                        overflow: 'hidden',
                        borderRadius: 8,
                        border: '1px solid #d9d9d9',
                        position: 'relative'
                      }}>
                        <Image
                          src={image.url}
                          alt={image.prompt}
                          width="100%"
                          height="100%"
                          style={{ objectFit: 'cover' }}
                          preview={{
                            mask: (
                              <div style={{ textAlign: 'center', color: 'white' }}>
                                <ZoomInOutlined />
                                <br />
                                预览
                              </div>
                            ),
                          }}
                        />

                        <div style={{ position: 'absolute', top: 8, left: 8 }}>
                          <Space direction="vertical" size="small">
                            <Tag color={image.type === 'generate' ? 'blue' : 'orange'}>
                              {image.type === 'generate' ? '生成' : '编辑'}
                            </Tag>
                            {image.id.startsWith('history_') && (
                              <Tag color="purple" style={{ fontSize: '10px' }}>
                                历史
                              </Tag>
                            )}
                          </Space>
                        </div>

                        {/* 操作按钮 */}
                        <div
                          className="hover-buttons"
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            opacity: 0,
                            transition: 'opacity 0.2s'
                          }}
                        >
                          <Space direction="vertical" size="small">
                            <Tooltip title="用于编辑">
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleEditImage(image)}
                                style={{ background: 'rgba(24,144,255,0.8)', border: 'none', color: 'white' }}
                              />
                            </Tooltip>
                            <Tooltip title={image.isFavorite ? "取消收藏" : "收藏"}>
                              <Button
                                size="small"
                                icon={image.isFavorite ? <StarFilled /> : <StarOutlined />}
                                onClick={() => handleToggleFavorite(image)}
                                style={{
                                  background: image.isFavorite ? 'rgba(255,193,7,0.8)' : 'rgba(0,0,0,0.6)',
                                  border: 'none',
                                  color: 'white'
                                }}
                              />
                            </Tooltip>
                            <Tooltip title="下载">
                              <Button
                                size="small"
                                icon={<DownloadOutlined />}
                                onClick={() => downloadImage(image)}
                                style={{ background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white' }}
                              />
                            </Tooltip>
                            <Tooltip title="删除">
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => deleteImage(image.id)}
                                style={{ background: 'rgba(255,77,79,0.8)', border: 'none', color: 'white' }}
                              />
                            </Tooltip>
                          </Space>
                        </div>

                        <div
                          className="hover-info"
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                            color: 'white',
                            padding: '16px 8px 8px',
                            opacity: 0,
                            transition: 'opacity 0.2s'
                          }}
                        >
                          <Text
                            style={{
                              color: 'white',
                              fontSize: 12,
                              display: '-webkit-box',
                              maxHeight: '100px',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'auto'
                            }}
                          >
                            {image.prompt}
                          </Text>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 8
                          }}>
                            <Text style={{ color: '#ccc', fontSize: 11 }}>
                              {image.model} • {image.size}
                            </Text>
                            <Text style={{ color: '#ccc', fontSize: 11 }}>
                              {new Date(image.timestamp).toLocaleTimeString()}
                            </Text>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>

              {images.length === 0 && !loading && !loadingHistory && (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#999'
                }}>
                  <PictureOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                  <div>
                    还没有生成的图片
                    <br />
                    {currentMode === 'generate'
                      ? '输入描述文字开始生成图片'
                      : '上传图片并描述编辑需求'
                    }
                    {isAuthenticated && !historyLoaded && (
                      <>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          正在加载历史记录...
                        </Text>
                      </>
                    )}
                  </div>
                </div>
              )}

              {images.length === 0 && !loading && loadingHistory && (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#999'
                }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>
                    正在加载历史图片...
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default ImageGeneration; 