import { useState, useEffect, useRef } from 'react';
import { Modal, Form, Input, Button, Space, Typography, message, Checkbox, Select, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../../stores/chatStore';
import GeneratePromptButton from '../GeneratePromptButton';
import { Sparkles, Brain, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { generateFunctionCallingPrompt } from '../../api/promptApi';
import { createPromptTemplate } from '../../api/promptTemplateApi';
import type { CreatePromptTemplateInput } from '../../api/promptTemplateApi';
import { useModelStore } from '../../stores/modelStore';
import ReactMarkdown from 'react-markdown';

interface GenerateFunctionCallingPromptProps {
    open: boolean;
    onCancel: () => void;
    onOk?: (values: any) => void;
    title?: string;
    width?: number;
}

const { TextArea } = Input;
const { Paragraph } = Typography;

export default function GenerateFunctionCallingPrompt({
    open,
    onCancel,
    onOk,
}: GenerateFunctionCallingPromptProps) {
    const { t, i18n } = useTranslation();
    const { selectedModel } = useChatStore();
    const { getChatModelOptions, fetchModels } = useModelStore();
    const [templateForm] = Form.useForm();
    const { token } = theme.useToken();

    const [step, setStep] = useState(0);
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [deepReasoningContent, setDeepReasoningContent] = useState('');
    const [isDeepReasoning, setIsDeepReasoning] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // 保存为模板相关状态
    const [saveTemplateModalVisible, setSaveTemplateModalVisible] = useState(false);
    const [savingTemplate, setSavingTemplate] = useState(false);

    // 评估相关状态
    const [evaluationContent, setEvaluationContent] = useState('');
    const [isEvaluating, setIsEvaluating] = useState(false);

    // 获取聊天模型选项
    const modelOptions = getChatModelOptions();
    const [modelsLoading, setModelsLoading] = useState(false);

    // 推理过程展开收起状态
    const [reasoningExpanded, setReasoningExpanded] = useState(false);
    
    // 推理时间相关状态
    const [reasoningStartTime, setReasoningStartTime] = useState<number | null>(null);
    const [reasoningEndTime, setReasoningEndTime] = useState<number | null>(null);
    const [reasoningDuration, setReasoningDuration] = useState<number>(0);

    const [input, setInput] = useState({
        prompt: '',
        requirements: '',
        enableDeepReasoning: false,
        chatModel: selectedModel // 使用当前选择的模型作为默认值
    });

    // 获取模型列表
    useEffect(() => {
        if (open && modelOptions.length === 0) {
            setModelsLoading(true);
            fetchModels().finally(() => {
                setModelsLoading(false);
            });
        }
    }, [open, modelOptions.length, fetchModels]);

    // 当模型列表加载完成后，设置默认模型
    useEffect(() => {
        if (modelOptions.length > 0) {
            // 优先选择 claude-sonnet-4-20250514，否则选择第一个可用模型
            const claudeModel = modelOptions.find(model => model.value === 'claude-sonnet-4-20250514');
            const defaultModel = claudeModel ? claudeModel.value : modelOptions[0].value;
            
            if (!input.chatModel || !modelOptions.some(model => model.value === input.chatModel)) {
                setInput(prev => ({ ...prev, chatModel: defaultModel }));
            }
        }
    }, [modelOptions, input.chatModel]);

    // 当selectedModel变化时，更新input.chatModel
    useEffect(() => {
        setInput(prev => ({ ...prev, chatModel: selectedModel }));
    }, [selectedModel]);

    // 监听推理状态变化，自动控制展开收起
    useEffect(() => {
        if (isDeepReasoning) {
            // 推理开始时自动展开
            setReasoningExpanded(true);
        } else if (step === 2) {
            // 生成完成后自动收起
            setReasoningExpanded(false);
        }
    }, [isDeepReasoning, step]);

    // 组件关闭时重置状态
    useEffect(() => {
        if (!open) {
            setStep(0);
            setGeneratedPrompt('');
            setDeepReasoningContent('');
            setIsDeepReasoning(false);
            setEvaluationContent('');
            setIsEvaluating(false);
            setSaveTemplateModalVisible(false);
            setSavingTemplate(false);
            setReasoningExpanded(false);
            setReasoningStartTime(null);
            setReasoningEndTime(null);
            setReasoningDuration(0);
            templateForm.resetFields();
            // 取消正在进行的请求
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        }
    }, [open]);

    // 处理Modal关闭
    const handleCancel = () => {
        // 如果正在生成中，不允许关闭
        if (step === 1) {
            message.warning(t('generatePrompt.cannotCloseWhileGenerating'));
            return;
        }
        // 如果正在生成中，取消请求
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        onCancel();
    };

    // 处理生成过程中的取消
    const handleGenerationCancel = () => {
        // 取消正在进行的请求
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        // 直接关闭Modal
        onCancel();
    };

    // 保存为模板
    const handleSaveAsTemplate = () => {
        // 预填充表单
        templateForm.setFieldsValue({
            title: `优化后的Function Calling提示词 - ${new Date().toLocaleDateString()}`,
            description: input.requirements || '通过AI优化生成的Function Calling提示词',
            content: generatedPrompt,
            tags: '优化,AI生成,Function Calling'
        });
        setSaveTemplateModalVisible(true);
    };

    // 确认保存模板
    const handleConfirmSaveTemplate = async (values: any) => {
        setSavingTemplate(true);
        try {
            const tags = values.tags ? values.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [];

            const createInput: CreatePromptTemplateInput = {
                title: values.title,
                description: values.description,
                content: values.content,
                tags: tags
            };

            const response = await createPromptTemplate(createInput);
            if (response.success) {
                message.success(t('generatePrompt.templateSaveSuccess'));
                setSaveTemplateModalVisible(false);
                templateForm.resetFields();
            } else {
                message.error(response.message || t('generatePrompt.templateSaveFailed'));
            }
        } catch (error) {
            console.error('保存模板失败:', error);
            message.error(t('generatePrompt.templateSaveFailed'));
        } finally {
            setSavingTemplate(false);
        }
    };

    const handleSubmit = async () => {
        const value = {
            prompt: input.prompt.trim(),
            requirements: input.requirements.trim(),
            enableDeepReasoning: input.enableDeepReasoning,
            chatModel: input.chatModel,
            language: i18n.language || 'zh-CN'
        }

        if (value.prompt === '') {
            message.error(t('generatePrompt.promptRequired'));
            return
        }

        setStep(1);
        setGeneratedPrompt('');
        setDeepReasoningContent('');
        setIsDeepReasoning(false);
        setEvaluationContent('');
        setIsEvaluating(false);
        setReasoningStartTime(null);
        setReasoningEndTime(null);
        setReasoningDuration(0);

        // 创建新的AbortController
        abortControllerRef.current = new AbortController();

        try {
            // 调用generateFunctionCallingPrompt生成Function Calling提示词
            for await (const event of generateFunctionCallingPrompt({
                prompt: value.prompt,
                requirements: value.requirements,
                enableDeepReasoning: value.enableDeepReasoning,
                chatModel: value.chatModel,
                language: value.language
            })) {
                // 检查是否已被取消
                if (abortControllerRef.current?.signal.aborted) {
                    break;
                }

                // 处理流式响应数据
                if (event.data) {
                    try {
                        const data = JSON.parse(event.data);

                        if (data.type === "deep-reasoning-start") {
                            setIsDeepReasoning(true);
                            setReasoningStartTime(Date.now());
                        } else if (data.type === "deep-reasoning-end") {
                            setIsDeepReasoning(false);
                            const endTime = Date.now();
                            setReasoningEndTime(endTime);
                            // 使用当前时间和开始时间计算持续时间
                            if (reasoningStartTime !== null) {
                                setReasoningDuration(endTime - reasoningStartTime);
                            }
                        } else if (data.type === "deep-reasoning") {
                            if (data.message) {
                                setDeepReasoningContent(prev => prev + data.message);
                            }
                        } else if (data.type === "evaluate-start") {
                            setIsEvaluating(true);
                        } else if (data.type === "evaluate-end") {
                            setIsEvaluating(false);
                        } else if (data.type === "evaluate") {
                            if (data.message) {
                                setEvaluationContent(prev => prev + data.message);
                            }
                        } else if (data.type === "error") {
                            // 处理错误类型
                            console.error('生成Function Calling提示词过程中发生错误:', data.message || data.error);
                            message.error(data.message || data.error || t('generatePrompt.generateFailed'));
                            setStep(0);
                            break;
                        } else if (data.type === "message") {
                            if (data.message) {
                                setGeneratedPrompt(prev => prev + data.message);
                            }
                        }

                        // 检查是否完成
                        if (data.done || event.event === 'done') {
                            setStep(2);
                            break;
                        }
                    } catch (e) {
                        // 如果不是JSON格式，直接添加到结果中
                        if (event.data !== '[DONE]') {
                            if (isDeepReasoning) {
                                setDeepReasoningContent(prev => prev + event.data);
                            } else if (isEvaluating) {
                                setEvaluationContent(prev => prev + event.data);
                            } else {
                                setGeneratedPrompt(prev => prev + event.data);
                            }
                        } else {
                            setStep(2);
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                // 请求被取消，不显示错误
                return;
            }
            console.error('生成Function Calling提示词失败:', error);
            message.error(t('generatePrompt.generateFailed'));
            setStep(0);
        } finally {
            abortControllerRef.current = null;
        }
    };

    // 格式化推理时间
    const formatReasoningTime = (duration: number) => {
        if (duration < 1000) {
            return `${duration}ms`;
        } else {
            return `${(duration / 1000).toFixed(1)}s`;
        }
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return <>
                    <span style={{
                        fontSize: 24,
                        fontWeight: 500,
                        textAlign: 'center',
                        display: 'block',
                        marginBottom: 16
                    }}>
                        {t('generatePrompt.functionCallingTitle')}
                    </span>

                    <Paragraph style={{
                        textAlign: 'center',
                        display: 'block',

                    }}>
                        {t('generatePrompt.functionCallingDescription')}
                    </Paragraph>

                    <div>
                        <span>
                            {t('generatePrompt.inputPromptLabel')}
                        </span>
                        <TextArea
                            value={input.prompt}
                            onChange={(e) => {
                                setInput({ ...input, prompt: e.target.value });
                            }}
                            style={{
                                border: 'none',
                                resize: 'none',
                                width: '100%',
                                marginTop: 16,
                                marginBottom: 16,
                            }}
                            rows={8}
                        >
                        </TextArea>
                    </div>

                    <div>
                        <span>
                            {t('generatePrompt.requirementsLabel')}
                        </span>
                        <TextArea
                            value={input.requirements}
                            onChange={(e) => {
                                setInput({ ...input, requirements: e.target.value });
                            }}
                            style={{
                                border: 'none',
                                resize: 'none',
                                width: '100%',
                                marginTop: 16,
                                marginBottom: 16,
                            }}
                            rows={5}>

                        </TextArea>
                    </div>

                    {/* 模型选择 */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        marginBottom: 16
                    }}>
                        <span style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: '#000000d9'
                        }}>
                            {t('workbench.model')}:
                        </span>
                        <Select
                            value={input.chatModel}
                            onChange={(value) => {
                                setInput({ ...input, chatModel: value });
                            }}
                            loading={modelsLoading}
                            showSearch
                            placeholder={modelsLoading ? t('workbench.loadingModels') : t('workbench.searchOrSelectModel')}
                            filterOption={(inputValue, option) =>
                                (option?.label ?? '').toLowerCase().includes(inputValue.toLowerCase())
                            }
                            style={{
                                width: '100%'
                            }}
                            options={modelOptions.map((model) => ({
                                value: model.value,
                                label: model.label,
                            }))}
                        />
                    </div>

                    {/* EnableDeepReasoning 选项 - 优化布局 */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: 12,
                        marginBottom: 24,
                        padding: '8px 0'
                    }}>
                        <Checkbox
                            checked={input.enableDeepReasoning}
                            onChange={(checked) => {
                                setInput({ ...input, enableDeepReasoning: checked.target.checked });
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}>
                                <Brain size={14} style={{ color: '#1890ff' }} />
                                <span style={{
                                    fontSize: 14,
                                }}>
                                    {t('generatePrompt.enableDeepReasoning')}
                                </span>
                                <span style={{
                                    fontSize: 12,
                                    color: '#8c8c8c',
                                    marginLeft: 4
                                }}>
                                    {t('generatePrompt.deepReasoningDescription')}
                                </span>
                            </div>
                        </Checkbox>
                    </div>

                    <div style={{
                        textAlign: 'center',
                        gap: 8,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <Button
                            onClick={handleCancel}
                        >
                            {t('generatePrompt.cancel')}
                        </Button>
                        <GeneratePromptButton
                            icon={<Sparkles size={16} />}
                            onClick={handleSubmit}
                            disabled={input.prompt === ''}
                        >
                            {t('generatePrompt.generate')}
                        </GeneratePromptButton>
                    </div>
                </>
            case 1:
            case 2:
                return <>
                    <span style={{
                        fontSize: 24,
                        fontWeight: 500,
                        textAlign: 'center',
                        display: 'block',
                        marginBottom: 16
                    }}>
                        {step === 1 ? (
                            isDeepReasoning ? (
                                <>
                                    <Brain size={24} style={{ marginRight: 8, color: '#1890ff' }} />
                                    {t('generatePrompt.deepReasoningTitle')}
                                </>
                            ) : isEvaluating ? (
                                <>
                                    <Sparkles size={24} style={{ marginRight: 8, color: '#52c41a' }} />
                                    {t('generatePrompt.evaluatingTitle')}
                                </>
                            ) : (
                                <>
                                    <Sparkles size={24} style={{ marginRight: 8, color: '#1890ff' }} />
                                    {t('generatePrompt.optimizingTitle')}
                                </>
                            )
                        ) : (
                            t('generatePrompt.optimizationComplete')
                        )}
                    </span>

                    <Paragraph style={{
                        textAlign: 'center',
                        display: 'block',
                        marginBottom: 16
                    }}>
                        {step === 1 ? (
                            isDeepReasoning ? 
                                t('generatePrompt.deepReasoningDescription2') :
                            isEvaluating ? 
                                t('generatePrompt.evaluatingDescription') :
                                t('generatePrompt.optimizingDescription')
                        ) : (
                            t('generatePrompt.threePanelDescription')
                        )}
                    </Paragraph>

                    {/* 三个面板布局 */}
                    <div style={{
                        display: 'flex',
                        gap: 16,
                        height: '500px',
                        marginBottom: 16
                    }}>
                        {/* 左侧面板 - 原始提示词 */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{
                                fontSize: 16,
                                fontWeight: 500,
                                marginBottom: 8,
                                color: '#1890ff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}>
                                <span>📝</span>
                                {t('generatePrompt.originalPrompt')}
                            </div>
                            <TextArea
                                value={input.prompt}
                                style={{
                                    border: '1px solid #d9d9d9',
                                    borderRadius: 6,
                                    resize: 'none',
                                    flex: 1,
                                }}
                                readOnly
                            />
                        </div>

                        {/* 中间面板 - 推理过程和优化后的提示词 */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {/* 推理过程区域 */}
                            {deepReasoningContent && (
                                <div style={{
                                    marginBottom: 12,
                                    border: '1px solid #e8f4fd',
                                    borderRadius: 6,
                                    backgroundColor: '#fafcff'
                                }}>
                                    {/* 推理过程头部 - 思考按钮 */}
                                    <div 
                                        style={{
                                            padding: '8px 12px',
                                            borderBottom: reasoningExpanded ? '1px solid #e8f4fd' : 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            borderRadius: reasoningExpanded ? '6px 6px 0 0' : '6px'
                                        }}
                                        onClick={() => setReasoningExpanded(!reasoningExpanded)}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            fontSize: 14,
                                            fontWeight: 500,
                                            color: '#1890ff'
                                        }}>
                                            <Brain size={16} />
                                            <span>
                                                {step === 1 && isDeepReasoning ? 
                                                    t('generatePrompt.reasoningInProgress') : 
                                                    t('generatePrompt.reasoningProcess')
                                                }
                                            </span>
                                            {step === 2 && reasoningDuration > 0 && (
                                                <span style={{
                                                    fontSize: 12,
                                                    color: '#8c8c8c',
                                                    marginLeft: 8
                                                }}>
                                                    ({formatReasoningTime(reasoningDuration)})
                                                </span>
                                            )}
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: '#1890ff'
                                        }}>
                                            {reasoningExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                    </div>
                                    
                                    {/* 推理过程内容 */}
                                    {reasoningExpanded && (
                                        <div style={{
                                            padding: 12,
                                            fontSize: 13,
                                            lineHeight: 1.6,
                                            color: '#2c2c2c',
                                            whiteSpace: 'pre-wrap',
                                            maxHeight: 150,
                                            overflow: 'auto',
                                            backgroundColor: '#ffffff'
                                        }}>
                                            {deepReasoningContent}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 优化后的提示词标题 */}
                            <div style={{
                                fontSize: 16,
                                fontWeight: 500,
                                marginBottom: 8,
                                color: '#52c41a',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}>
                                <Sparkles size={16} />
                                {t('generatePrompt.optimizedPromptLabel')}
                            </div>
                            
                            {/* 优化后的提示词内容 */}
                            <TextArea
                                value={generatedPrompt || (step === 1 ? t('generatePrompt.generating') : '')}
                                style={{
                                    border: '1px solid #d9d9d9',
                                    borderRadius: 6,
                                    resize: 'none',
                                    flex: 1,
                                }}
                                readOnly
                            />
                        </div>

                        {/* 右侧面板 - 评估结果 */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{
                                fontSize: 16,
                                fontWeight: 500,
                                marginBottom: 8,
                                color: '#722ed1',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}>
                                <span>📊</span>
                                {t('generatePrompt.evaluationResult')}
                            </div>
                            <div
                                style={{
                                    border: `1px solid ${token.colorBorder}`,
                                    borderRadius: token.borderRadius,
                                    padding: 12,
                                    flex: 1,
                                    overflow: 'auto',
                                    backgroundColor: token.colorBgContainer,
                                }}
                            >
                                {evaluationContent ? (
                                    <div style={{
                                        fontSize: 14,
                                        lineHeight: 1.6,
                                        color: token.colorText,
                                        margin: 0,
                                    }}>
                                        <ReactMarkdown
                                            components={{
                                                // 自定义组件样式
                                                h1: ({ children }) => <h3 style={{ marginTop: 16, marginBottom: 8, fontSize: 16, fontWeight: 600, color: token.colorTextHeading }}>{children}</h3>,
                                                h2: ({ children }) => <h4 style={{ marginTop: 12, marginBottom: 6, fontSize: 15, fontWeight: 600, color: token.colorTextHeading }}>{children}</h4>,
                                                h3: ({ children }) => <h5 style={{ marginTop: 10, marginBottom: 4, fontSize: 14, fontWeight: 600, color: token.colorTextHeading }}>{children}</h5>,
                                                p: ({ children }) => <p style={{ marginBottom: 8, lineHeight: 1.6, color: token.colorText }}>{children}</p>,
                                                ul: ({ children }) => <ul style={{ marginBottom: 8, paddingLeft: 20 }}>{children}</ul>,
                                                ol: ({ children }) => <ol style={{ marginBottom: 8, paddingLeft: 20 }}>{children}</ol>,
                                                li: ({ children }) => <li style={{ marginBottom: 4, color: token.colorText }}>{children}</li>,
                                                strong: ({ children }) => <strong style={{ fontWeight: 600, color: token.colorTextHeading }}>{children}</strong>,
                                                em: ({ children }) => <em style={{ fontStyle: 'italic', color: token.colorTextSecondary }}>{children}</em>,
                                                code: ({ children }) => <code style={{ backgroundColor: token.colorBgLayout, color: token.colorText, padding: '2px 4px', borderRadius: token.borderRadiusSM, fontFamily: token.fontFamilyCode, fontSize: 13 }}>{children}</code>,
                                                // 表格组件
                                                table: ({ children }) => (
                                                    <table style={{ 
                                                        width: '100%', 
                                                        borderCollapse: 'collapse', 
                                                        marginBottom: 16,
                                                        border: `1px solid ${token.colorBorder}`
                                                    }}>
                                                        {children}
                                                    </table>
                                                ),
                                                thead: ({ children }) => (
                                                    <thead style={{ backgroundColor: token.colorBgLayout }}>
                                                        {children}
                                                    </thead>
                                                ),
                                                tbody: ({ children }) => <tbody>{children}</tbody>,
                                                tr: ({ children }) => (
                                                    <tr style={{ borderBottom: `1px solid ${token.colorBorder}` }}>
                                                        {children}
                                                    </tr>
                                                ),
                                                th: ({ children }) => (
                                                    <th style={{ 
                                                        padding: '8px 12px', 
                                                        textAlign: 'left', 
                                                        fontWeight: 600,
                                                        color: token.colorTextHeading,
                                                        border: `1px solid ${token.colorBorder}`,
                                                        backgroundColor: token.colorBgLayout
                                                    }}>
                                                        {children}
                                                    </th>
                                                ),
                                                td: ({ children }) => (
                                                    <td style={{ 
                                                        padding: '8px 12px', 
                                                        border: `1px solid ${token.colorBorder}`,
                                                        color: token.colorText
                                                    }}>
                                                        {children}
                                                    </td>
                                                ),
                                            }}
                                        >
                                            {evaluationContent}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <div style={{
                                        color: token.colorTextSecondary,
                                        fontSize: 14,
                                        textAlign: 'center',
                                        padding: '20px 0'
                                    }}>
                                        {step === 1 ? (isEvaluating ? t('generatePrompt.evaluating') : t('generatePrompt.waitingForEvaluation')) : t('generatePrompt.noEvaluation')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{
                        textAlign: 'center',
                        gap: 8,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        {step === 1 ? (
                            // 生成中的按钮
                            <Button
                                onClick={handleGenerationCancel}
                                disabled={false}
                            >
                                {t('generatePrompt.cancel')}
                            </Button>
                        ) : (
                            // 完成后的按钮
                            <>
                                <Button
                                    onClick={() => {
                                        setStep(0);
                                        setGeneratedPrompt('');
                                        setDeepReasoningContent('');
                                        setEvaluationContent('');
                                        setIsDeepReasoning(false);
                                        setIsEvaluating(false);
                                        setReasoningExpanded(false);
                                        setReasoningStartTime(null);
                                        setReasoningEndTime(null);
                                        setReasoningDuration(0);
                                    }}
                                >
                                    {t('generatePrompt.regenerate')}
                                </Button>
                                <Button
                                    onClick={() => {
                                        navigator.clipboard.writeText(generatedPrompt);
                                        message.success(t('generatePrompt.copyPromptSuccess'));
                                    }}
                                >
                                    {t('generatePrompt.copyPrompt')}
                                </Button>
                                <Button
                                    icon={<Save size={16} />}
                                    onClick={handleSaveAsTemplate}
                                    style={{
                                        background: '#52c41a',
                                        borderColor: '#52c41a',
                                        color: 'white'
                                    }}
                                >
                                    {t('generatePrompt.saveAsTemplate')}
                                </Button>
                                <Button
                                    type='primary'
                                    onClick={() => {
                                        onOk && onOk({ prompt: generatedPrompt });
                                        onCancel();
                                    }}
                                >
                                    {t('common.confirm')}
                                </Button>
                            </>
                        )}
                    </div>
                </>
        }
    };

    return (
        <>
            <Modal
                open={open}
                onCancel={handleCancel}
                width={'95%'}
                height={740}
                footer={null}
                style={{
                    minWidth: 1200,
                    maxWidth: '95vw'
                }}
                destroyOnClose
            >
                {renderStep()}
            </Modal>

            {/* 保存为模板的模态框 */}
            <Modal
                title={t('generatePrompt.saveTemplateTitle')}
                open={saveTemplateModalVisible}
                onCancel={() => setSaveTemplateModalVisible(false)}
                footer={null}
                width={600}
                destroyOnClose
            >
                <Form
                    form={templateForm}
                    layout="vertical"
                    onFinish={handleConfirmSaveTemplate}
                >
                    <Form.Item
                        name="title"
                        label={t('generatePrompt.templateTitle')}
                        rules={[{ required: true, message: t('generatePrompt.templateTitleRequired') }]}
                    >
                        <Input placeholder={t('generatePrompt.templateTitlePlaceholder')} />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label={t('generatePrompt.templateDescription')}
                        rules={[{ required: true, message: t('generatePrompt.templateDescriptionRequired') }]}
                    >
                        <Input placeholder={t('generatePrompt.templateDescriptionPlaceholder')} />
                    </Form.Item>

                    <Form.Item
                        name="content"
                        label={t('generatePrompt.templateContent')}
                        rules={[{ required: true, message: t('generatePrompt.templateContentRequired') }]}
                    >
                        <TextArea
                            rows={8}
                            placeholder={t('generatePrompt.templateContentPlaceholder')}
                            readOnly
                            style={{
                                // 不能拖动
                                resize: 'none',
                                border: 'none',
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="tags"
                        label={t('generatePrompt.templateTags')}
                    >
                        <Input placeholder={t('generatePrompt.templateTagsPlaceholder')} />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setSaveTemplateModalVisible(false)}>
                                {t('generatePrompt.cancel')}
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={savingTemplate}
                                icon={<Save size={16} />}
                            >
                                {t('generatePrompt.saveTemplate')}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}