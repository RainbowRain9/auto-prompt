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
  AutoComplete
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
  EyeInvisibleOutlined
} from '@ant-design/icons';
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
import './ImageGeneration.css';

const { Content } = Layout;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  revisedPrompt?: string;
  timestamp: number;
  type: 'generate' | 'edit';
  model: string;
  size: string;
}

const ImageGeneration: React.FC = () => {
  const { isAuthenticated, isGuestMode } = useAuthStore();

  // 使用模型 store
  const {
    fetchModels,
    getImageModelOptions,
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
    if (isGuestMode) {
      return hasValidLLMConfig();
    }
    return isAuthenticated;
  }, [isAuthenticated, isGuestMode]);

  // 初始化时获取模型列表
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // 如果获取模型失败，显示错误信息
  useEffect(() => {
    if (modelsError) {
      message.warning(`模型列表获取失败，使用默认模型: ${modelsError}`);
    }
  }, [modelsError]);

  // 当图片模型列表加载完成后，设置默认模型
  useEffect(() => {
    if (imageModelOptions.length > 0 && !form.getFieldValue('model')) {
      form.setFieldValue('model', imageModelOptions[0].value);
    }
  }, [imageModelOptions, form]);

  // 生成/编辑图片
  const handleSubmit = async (values: any) => {
    if (!checkApiConfig()) {
      message.error('请先配置API设置或登录');
      return;
    }

    if (currentMode === 'edit' && !editImageFile) {
      message.error('请先上传要编辑的图片');
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
          prompt: values.prompt,
          model: values.model || 'gpt-4o-image-1',
          n: values.n || 1,
          size: values.size || '1024x1024',
          quality: values.quality || 'standard',
          style: values.style || 'vivid',
        };

        response = await generateImage(params);
        newImages = response.data.map((item, index) => ({
          id: `gen_${Date.now()}_${index}`,
          url: item.url || '',
          prompt: values.prompt,
          revisedPrompt: item.revised_prompt,
          timestamp: Date.now(),
          type: 'generate',
          model: params.model || 'gpt-4o-image-1',
          size: params.size || '1024x1024',
        }));
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
          prompt: values.prompt,
          model: values.model || 'gpt-image-1', // 使用用户选择的模型
          n: values.n || 1,
          size: values.size || '1024x1024',
        };

        response = await editImage(params);
        newImages = response.data.map((item, index) => ({
          id: `edit_${Date.now()}_${index}`,
          url: item.url || '',
          prompt: values.prompt,
          timestamp: Date.now(),
          type: 'edit',
          model: values.model || 'gpt-image-1', // 使用用户选择的模型
          size: params.size || '1024x1024',
        }));
      }

      clearInterval(progressInterval);
      setProgress(100);

      setImages(prev => [...newImages, ...prev]);
      message.success(`成功${currentMode === 'generate' ? '生成' : '编辑生成'} ${newImages.length} 张图片`);

    } catch (error: any) {
      message.error(error.message || '操作失败');
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
    setImages(prev => prev.filter(img => img.id !== imageId));
    message.success('图片已删除');
  }, []);

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
    form.resetFields(['prompt']); // 只重置提示词，保留其他设置
  };

  return (
    <Layout style={{ minHeight: '100vh', }}>
      <Content style={{ margin: '5px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PictureOutlined />
            AI 图片生成工具
          </Title>
          <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
            {currentMode === 'generate'
              ? '使用文字描述生成图片，支持多种模型和参数调节'
              : '基于上传的图片进行编辑，支持蒙版绘制指定编辑区域'
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
                  {currentMode === 'generate' ? '文字生成图片' : '图片编辑'}
                  <Tag color={currentMode === 'generate' ? 'blue' : 'orange'}>
                    {currentMode === 'generate' ? '生成模式' : '编辑模式'}
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
                  model: imageModelOptions.length > 0 ? imageModelOptions[0].value : 'gpt-image-1',
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
                      <span>上传图片</span>
                      {editImageFile && (
                        <Button
                          type="link"
                          size="small"
                          onClick={handleRemoveImage}
                          style={{ padding: 0, height: 'auto' }}
                        >
                          切换到文字生成
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
                        <div>上传图片开启编辑模式</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          支持 PNG、JPEG、WebP 格式
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
                      description="在图片上绘制红色区域标记需要编辑的部分。AI将根据你的描述重新生成被标记的区域。"
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  </>
                )}

                {/* 提示词输入 */}
                <Form.Item
                  name="prompt"
                  label={currentMode === 'generate' ? '图片描述' : '编辑描述'}
                  rules={[{ required: true, message: '请输入描述' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder={
                      currentMode === 'generate'
                        ? "详细描述你想要生成的图片，例如：一只可爱的橙色小猫坐在窗台上，阳光透过窗户洒在它身上，背景是模糊的花园"
                        : "描述你想要在蒙版区域生成的内容，例如：把这个区域替换成一只小狗"
                    }
                    maxLength={4000}
                    showCount
                  />
                </Form.Item>

                {/* 模型选择 */}
                <Form.Item name="model" label="模型">
                  <Select
                    placeholder="选择图片生成模型"
                    allowClear
                    style={{ width: '100%' }}
                    loading={modelsLoading}
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
                      <Select>
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
                      <Select>
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
                        <Select>
                          <Select.Option value="standard">标准</Select.Option>
                          <Select.Option value="hd">高清</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="style" label="风格">
                        <Select>
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
                    block
                    size="large"
                    icon={currentMode === 'generate' ? <PictureOutlined /> : <EditOutlined />}
                  >
                    {currentMode === 'generate' ? '生成图片' : '编辑图片'}
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* 右侧图片展示 */}
          <Col xs={24} lg={14}>
            <Card
              title="生成结果"
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
                  <Col key={image.id} xs={12} sm={8} md={6} lg={8} xl={6}>
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

                        {/* 类型标签 */}
                        <div style={{ position: 'absolute', top: 8, left: 8 }}>
                          <Tag color={image.type === 'generate' ? 'blue' : 'orange'}>
                            {image.type === 'generate' ? '生成' : '编辑'}
                          </Tag>
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

                        {/* 图片信息 */}
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
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {image.prompt}
                          </Text>
                          {image.revisedPrompt && (
                            <Text
                              style={{
                                color: '#ccc',
                                fontSize: 11,
                                display: 'block',
                                marginTop: 4
                              }}
                            >
                              修订: {image.revisedPrompt}
                            </Text>
                          )}
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

              {images.length === 0 && !loading && (
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