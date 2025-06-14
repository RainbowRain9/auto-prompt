import { useState } from "react";
import { useTranslation } from 'react-i18next';
import GeneratePrompt from "../GeneratePrompt";
import GenerateFunctionCallingPrompt from "../GenerateFunctionCallingPrompt";
import { Sparkles, Code } from "lucide-react";
import GeneratePromptButton from "../GeneratePromptButton";


export default function GeneratePromptPanel() {
    const { t } = useTranslation();
    const [openGenerate, setOpenGenertae] = useState(false);
    const [openFunctionCalling, setOpenFunctionCalling] = useState(false);

    return (<>
        <div data-tour="prompt-optimize">
            <GeneratePromptButton
                icon={<Sparkles 
                    size={16}
                    />}
                onClick={() => {
                    setOpenGenertae(true);
                }}
            >
                {t('generatePrompt.optimizePrompt')}
            </GeneratePromptButton>
        </div>
        <div data-tour="function-calling">
            <GeneratePromptButton
                icon={<Code 
                    size={16}
                    />}
                onClick={() => {
                    setOpenFunctionCalling(true);
                }}
            >
                {t('generatePrompt.optimizeFunctionCalling')}
            </GeneratePromptButton>
        </div>
        <GeneratePrompt
            open={openGenerate}
            onCancel={() => {
                setOpenGenertae(false);
            }}
            onOk={() => {
                setOpenGenertae(false)
            }}
        >

        </GeneratePrompt>
        <GenerateFunctionCallingPrompt
            open={openFunctionCalling}
            onCancel={() => {
                setOpenFunctionCalling(false);
            }}
            onOk={() => {
                setOpenFunctionCalling(false)
            }}
        />
    </>)
}