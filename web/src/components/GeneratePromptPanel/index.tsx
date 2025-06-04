import { useState } from "react";
import { useTranslation } from 'react-i18next';
import GeneratePrompt from "../GeneratePrompt";
import { Sparkles } from "lucide-react";
import GeneratePromptButton from "../GeneratePromptButton";


export default function GeneratePromptPanel() {
    const { t } = useTranslation();
    const [openGenerate, setOpenGenertae] = useState(false);

    return (<>
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
    </>)
}