import { useState, useEffect, useRef } from 'react';
import { Modal, Form, Input, Button, Space, Typography, message, Checkbox, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../../stores/chatStore';
import GeneratePromptButton from '../GeneratePromptButton';
import { Sparkles, Brain, Save } from 'lucide-react';
import { generatePrompt } from '../../api/promptApi';
import { createPromptTemplate } from '../../api/promptTemplateApi';
import type { CreatePromptTemplateInput } from '../../api/promptTemplateApi';

interface GeneratePromptProps {
    open: boolean;
    onCancel: () => void;
    onOk?: (values: any) => void;
    title?: string;
    width?: number;
}

const { TextArea } = Input;
const { Paragraph } = Typography;

export default function GeneratePrompt({
    open,
    onCancel,
    onOk,
}: GeneratePromptProps) {
    const { t } = useTranslation();
    const { selectedModel } = useChatStore();

    const [step, setStep] = useState(0);
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [deepReasoningContent, setDeepReasoningContent] = useState('');
    const [isDeepReasoning, setIsDeepReasoning] = useState(false);
    const [showDeepReasoning, setShowDeepReasoning] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // 保存为模板相关状态
    const [saveTemplateModalVisible, setSaveTemplateModalVisible] = useState(false);
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [templateForm] = Form.useForm();

    // 模型相关状态
    const [models, setModels] = useState<{ value: string; label: string }[]>([]);
    const [modelsLoading, setModelsLoading] = useState(false);

    const [input, setInput] = useState({
        prompt: '',
        requirements: '',
        enableDeepReasoning: false,
        chatModel: selectedModel // 使用当前选择的模型作为默认值
    });

    // 获取模型列表的函数
    const fetchModels = async () => {
        setModelsLoading(true);
        try {
            const response = await fetch('https://api.token-ai.cn/v1/models');
            const data: { data: Array<{ id: string; type: string }> } = await response.json();
            
            // 过滤出 type === 'chat' 的模型
            const chatModels = data.data
                .filter(model => model.type === 'chat')
                .map(model => ({
                    value: model.id,
                    label: model.id
                }));
            
            setModels(chatModels);
            
            // 如果当前选中的模型不在新列表中，选择第一个可用模型
            if (chatModels.length > 0 && !chatModels.some(model => model.value === input.chatModel)) {
                setInput(prev => ({ ...prev, chatModel: chatModels[0].value }));
            }
        } catch (error) {
            console.error('获取模型列表失败:', error);
            message.error(t('workbench.fetchModelsError'));
            // 使用默认模型列表作为备选
            const defaultModels = [
                { value: 'claude-sonnet-4-20250514', label: 'claude-sonnet-4-20250514' },
                { value: 'gpt-4o', label: 'gpt-4o' },
                { value: 'gpt-4.1', label: 'gpt-4.1' },
                { value: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo' },
            ];
            setModels(defaultModels);
        } finally {
            setModelsLoading(false);
        }
    };

    // 组件打开时获取模型列表
    useEffect(() => {
        if (open) {
            fetchModels();
        }
    }, [open]);

    // 当selectedModel变化时，更新input.chatModel
    useEffect(() => {
        setInput(prev => ({ ...prev, chatModel: selectedModel }));
    }, [selectedModel]);

    // 组件关闭时重置状态
    useEffect(() => {
        if (!open) {
            setStep(0);
            setGeneratedPrompt('');
            setDeepReasoningContent('');
            setIsDeepReasoning(false);
            setShowDeepReasoning(false);
            setSaveTemplateModalVisible(false);
            setSavingTemplate(false);
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
            title: `优化后的提示词 - ${new Date().toLocaleDateString()}`,
            description: input.requirements || '通过AI优化生成的提示词',
            content: generatedPrompt,
            tags: '优化,AI生成'
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
            chatModel: input.chatModel
        }

        if (value.prompt === '') {
            message.error(t('generatePrompt.promptRequired'));
            return
        }

        setStep(1);
        setGeneratedPrompt('');
        setDeepReasoningContent('');
        setIsDeepReasoning(false);
        setShowDeepReasoning(false);

        // 创建新的AbortController
        abortControllerRef.current = new AbortController();

        try {
            // 调用promptApi生成提示词
            for await (const event of generatePrompt({
                prompt: value.prompt,
                requirements: value.requirements,
                enableDeepReasoning: value.enableDeepReasoning,
                chatModel: value.chatModel
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
                        } else if (data.type === "deep-reasoning-end") {
                            setIsDeepReasoning(false);
                        } else if (data.type === "deep-reasoning") {
                            if (data.message) {
                                setDeepReasoningContent(prev => prev + data.message);
                            }
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
            console.error('生成提示词失败:', error);
            message.error(t('generatePrompt.generateFailed'));
            setStep(0);
        } finally {
            abortControllerRef.current = null;
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
                        {t('generatePrompt.title')}
                    </span>

                    <Paragraph style={{
                        textAlign: 'center',
                        display: 'block',

                    }}>
                        {t('generatePrompt.description')}
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
                            options={models.map((model) => ({
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
                return <>
                    {isDeepReasoning ? (
                        // 深度推理阶段
                        <>
                            <span style={{
                                fontSize: 24,
                                fontWeight: 500,
                                textAlign: 'center',
                                display: 'block',
                                marginBottom: 16
                            }}>
                                <Brain size={24} style={{ marginRight: 8, color: '#1890ff' }} />
                                {t('generatePrompt.deepReasoningTitle')}
                            </span>

                            <Paragraph style={{
                                textAlign: 'center',
                                display: 'block',
                                marginBottom: 16
                            }}>
                                {t('generatePrompt.deepReasoningDescription2')}
                            </Paragraph>

                            <div>
                                <span>
                                    {t('generatePrompt.reasoningProcess')}
                                </span>
                                <TextArea
                                    value={deepReasoningContent || t('generatePrompt.deepReasoningInProgress')}
                                    style={{
                                        border: 'none',
                                        resize: 'none',
                                        width: '100%',
                                        marginTop: 16,
                                        marginBottom: 16,
                                    }}
                                    rows={20}
                                    readOnly
                                />
                            </div>
                        </>
                    ) : (
                        // 生成提示词阶段
                        <>
                            <span style={{
                                fontSize: 24,
                                fontWeight: 500,
                                textAlign: 'center',
                                display: 'block',
                                marginBottom: 16
                            }}>
                                {t('generatePrompt.optimizingTitle')}
                            </span>

                            <Paragraph style={{
                                textAlign: 'center',
                                display: 'block',
                                marginBottom: 16
                            }}>
                                {input.enableDeepReasoning && deepReasoningContent ?
                                    t('generatePrompt.optimizingWithReasoning') :
                                    t('generatePrompt.optimizingDescription')
                                }
                            </Paragraph>

                            {/* 如果启用了深度推理且有推理内容，显示推理结果摘要 */}
                            {input.enableDeepReasoning && deepReasoningContent && (
                                <div style={{ marginBottom: 16 }}>
                                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                                        {t('generatePrompt.deepAnalysisComplete')}
                                    </span>
                                </div>
                            )}

                            <div>
                                <span>
                                    {t('generatePrompt.generatingProgress')}
                                </span>
                                <TextArea
                                    value={generatedPrompt || t('generatePrompt.generating')}
                                    style={{
                                        border: 'none',
                                        resize: 'none',
                                        width: '100%',
                                        marginTop: 16,
                                        marginBottom: 16,
                                    }}
                                    rows={20}
                                    readOnly
                                />
                            </div>
                        </>
                    )}

                    <div style={{
                        textAlign: 'center',
                        gap: 8,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <Button
                            onClick={handleGenerationCancel}
                        >
                            {t('generatePrompt.cancel')}
                        </Button>
                    </div>
                </>
            case 2:
                return <>
                    <span style={{
                        fontSize: 24,
                        fontWeight: 500,
                        textAlign: 'center',
                        display: 'block',
                        marginBottom: 16
                    }}>
                        {showDeepReasoning ? t('generatePrompt.deepReasoningProcessTitle') : t('generatePrompt.optimizationComplete')}
                    </span>

                    <Paragraph style={{
                        textAlign: 'center',
                        display: 'block',
                        marginBottom: 16
                    }}>
                        {showDeepReasoning ?
                            t('generatePrompt.deepReasoningProcessDescription') :
                            t('generatePrompt.optimizedPromptDescription')
                        }
                    </Paragraph>

                    <div>
                        <span>
                            {showDeepReasoning ? t('generatePrompt.reasoningProcess') : t('generatePrompt.optimizedPromptLabel')}
                        </span>
                        <TextArea
                            value={showDeepReasoning ? deepReasoningContent : generatedPrompt}
                            style={{
                                border: 'none',
                                resize: 'none',
                                width: '100%',
                                marginTop: 16,
                                marginBottom: 16,
                            }}
                            rows={20}
                            readOnly
                        />
                    </div>

                    {/* 切换按钮 */}
                    {deepReasoningContent && (
                        <div style={{
                            marginBottom: 16,
                            textAlign: 'center'
                        }}>
                            <Button
                                size="small"
                                type="link"
                                icon={showDeepReasoning ? undefined : <Brain size={14} />}
                                onClick={() => setShowDeepReasoning(!showDeepReasoning)}
                            >
                                {showDeepReasoning ? t('generatePrompt.backToPrompt') : t('generatePrompt.viewReasoningProcess')}
                            </Button>
                        </div>
                    )}

                    <div style={{
                        textAlign: 'center',
                        gap: 8,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <Button
                            onClick={() => {
                                setStep(0);
                                setGeneratedPrompt('');
                                setDeepReasoningContent('');
                                setIsDeepReasoning(false);
                                setShowDeepReasoning(false);
                            }}
                        >
                            {t('generatePrompt.regenerate')}
                        </Button>
                        <Button
                            onClick={() => {
                                const contentToCopy = showDeepReasoning ? deepReasoningContent : generatedPrompt;
                                navigator.clipboard.writeText(contentToCopy);
                                message.success(showDeepReasoning ? 
                                    t('generatePrompt.copyReasoningSuccess') : 
                                    t('generatePrompt.copyPromptSuccess')
                                );
                            }}
                        >
                            {showDeepReasoning ? t('generatePrompt.copyReasoning') : t('generatePrompt.copyPrompt')}
                        </Button>
                        {!showDeepReasoning && (
                            <>
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
    }

    return (
        <>
            <Modal
                open={open}
                onCancel={handleCancel}
                width={740}
                height={740}
                footer={null}
                style={{
                    minWidth: 740,
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