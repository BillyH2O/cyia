'use client';

import {
  Button
} from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useChatContext } from "@/contexts/ChatContext";
import { Info } from "lucide-react";
import { useState, useEffect } from 'react';
import { Switch } from "@/components/ui/switch";
import ModelSelector from "@/components/features/chat/ModelSelector";
import { providerLogoMap } from '@/config/provider-config';

interface LabelledSliderProps {
  id: string;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  value: number | null;
  defaultValue: number;
  onChange: (value: number | null) => void;
  formatValue?: (value: number) => string;
  isMobile?: boolean;
}

function LabelledSlider({ id, label, description, min, max, step, value, defaultValue, onChange, formatValue, isMobile }: LabelledSliderProps) {
  const [internalValue, setInternalValue] = useState(value ?? defaultValue);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    setInternalValue(value ?? defaultValue);
  }, [value, defaultValue]);

  const displayValue = formatValue ? formatValue(internalValue) : internalValue.toFixed(String(step).split('.')[1]?.length || 0);

  const handleValueChange = (newValue: number[]) => {
    setInternalValue(newValue[0]);
  };

  const handleCommit = (newValue: number[]) => {
     onChange(newValue[0]);
  };

  const handleReset = () => {
    setInternalValue(defaultValue);
    onChange(null);
  }

  return (
    <div className={`grid gap-2 ${isMobile ? 'py-1' : 'py-2'}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1">
          <Label htmlFor={id} className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>
            {label}
          </Label>
          <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
            <div className="flex items-center justify-center h-4 w-4 cursor-help">
              <Info className="h-3 w-3 text-orange-500" />
            </div>
            {showTooltip && (
              <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 w-64 p-2 rounded-md bg-popover text-popover-foreground shadow-md text-xs">
                {description}
              </div>
            )}
          </div>
        </div>
        <span className={`text-sm text-muted-foreground font-mono ${isMobile ? 'w-12 text-xs' : 'w-16'} text-right`}>
          {displayValue}
        </span>
      </div>
      <div className="flex items-center gap-2">
         <Slider
           id={id}
           min={min}
           max={max}
           step={step}
           value={[internalValue]}
           onValueChange={handleValueChange}
           onValueCommit={handleCommit}
           className="flex-grow"
         />
        <Button variant="ghost" size={isMobile ? 'sm' : 'sm'} onClick={handleReset} disabled={value === null}>
            Réinitialiser
        </Button>
      </div>
    </div>
  );
}

interface LabelledInputProps {
  id: string;
  label: string;
  description: string;
  placeholder: string;
  value: number | null;
  onChange: (value: number | null) => void;
  type?: 'number' | 'text';
  step?: string;
  isMobile?: boolean;
}

function LabelledInput({ id, label, description, placeholder, value, onChange, type = 'number', step, isMobile }: LabelledInputProps) {
  const [internalValue, setInternalValue] = useState<string>(value !== null ? String(value) : '');
  const [showTooltip, setShowTooltip] = useState(false);

   useEffect(() => {
      setInternalValue(value !== null ? String(value) : '');
    }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);

    if (newValue === '') {
      onChange(null);
    } else {
      const numValue = type === 'number' ? parseFloat(newValue) : parseInt(newValue, 10);
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
    }
  };

  const handleReset = () => {
      setInternalValue('');
      onChange(null);
  }

  return (
     <div className={`grid gap-2 ${isMobile ? 'py-1' : 'py-2'}`}>
      <div className="flex justify-between items-center">
         <div className="flex items-center gap-1">
           <Label htmlFor={id} className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>
             {label}
           </Label>
           <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
             <div className="flex items-center justify-center h-4 w-4 cursor-help">
               <Info className="h-3 w-3 text-orange-500" />
             </div>
             {showTooltip && (
               <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 w-64 p-2 rounded-md bg-popover text-popover-foreground shadow-md text-xs">
                 {description}
               </div>
             )}
           </div>
         </div>
        <Button variant="ghost" size={isMobile ? 'sm' : 'sm'} onClick={handleReset} disabled={value === null || internalValue === ''}>
            Réinitialiser
        </Button>
      </div>
       <Input
         id={id}
         type={type}
         placeholder={placeholder}
         value={internalValue}
         onChange={handleChange}
         className={`col-span-3 font-mono ${isMobile ? 'h-8 text-sm' : ''}`}
         step={step}
         min={type === 'number' ? "0" : undefined}
       />
     </div>
  );
}

interface LabelledSwitchProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  isMobile?: boolean;
}

function LabelledSwitch({ id, label, description, checked, onChange, isMobile }: LabelledSwitchProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={`grid gap-2 ${isMobile ? 'py-1' : 'py-2'}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1">
          <Label htmlFor={id} className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>
            {label}
          </Label>
          <div className="relative" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
            <div className="flex items-center justify-center h-4 w-4 cursor-help">
              <Info className="h-3 w-3 text-orange-500" />
            </div>
            {showTooltip && (
              <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 w-64 p-2 rounded-md bg-popover text-popover-foreground shadow-md text-xs">
                {description}
              </div>
            )}
          </div>
        </div>
        <Switch id={id} checked={checked} onCheckedChange={onChange} />
      </div>
    </div>
  );
}

interface AdvancedOptionsPanelProps {
  isMobile?: boolean;
}

export function AdvancedOptionsPanel({ isMobile }: AdvancedOptionsPanelProps) {
  const {
    temperature, setTemperature,
    topP, setTopP,
    topK, setTopK,
    frequencyPenalty, setFrequencyPenalty,
    presencePenalty, setPresencePenalty,
    repetitionPenalty, setRepetitionPenalty,
    seed, setSeed,
    evaluateSources, setEvaluateSources,
    useReranker, setUseReranker,
    useStreaming, setUseStreaming,
    useMultiQuery, setUseMultiQuery,
    retrievalK, setRetrievalK,
    rerankK, setRerankK,
    availableModels,
    selectedModel,
    setSelectedModel,
    isLoadingModels,
  } = useChatContext();

  const DEFAULTS = {
    temperature: 1.0,
    topP: null,
    topK: null,
    frequencyPenalty: null,
    presencePenalty: null,
    repetitionPenalty: null,
    seed: null,
    retrievalK: null,
    rerankK: null,
  };

  const handleResetSwitches = () => {
    setEvaluateSources(false);
    setUseReranker(false);
    setUseStreaming(false);
    setUseMultiQuery(false);
  };

  const handleResetAll = () => {
    setTemperature(DEFAULTS.temperature);
    setTopP(DEFAULTS.topP);
    setTopK(DEFAULTS.topK);
    setFrequencyPenalty(DEFAULTS.frequencyPenalty);
    setPresencePenalty(DEFAULTS.presencePenalty);
    setRepetitionPenalty(DEFAULTS.repetitionPenalty);
    setSeed(DEFAULTS.seed);
    setRetrievalK(DEFAULTS.retrievalK);
    setRerankK(DEFAULTS.rerankK);
    handleResetSwitches();
  };

  return (
    <div className="flex flex-col h-full">
      <div className={`p-6 border-b border-border ${isMobile ? 'pb-3 pt-3' : ''}`}>
        <h2 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>Paramètres avancés</h2>
        <p className={`text-muted-foreground mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            Affinez le comportement du modèle. Survolez les icônes <span className="inline-flex items-center justify-center h-3 w-3 align-middle"><Info className="h-2 w-2 text-orange-500" /></span> pour plus de détails.
        </p>
      </div>

      <div className={`flex-grow overflow-y-auto ${isMobile ? 'p-3 space-y-1' : 'p-6 space-y-3'}`}>
        {isMobile && (
          <div className={isMobile ? "pb-2 mb-2 border-b border-border" : ""}>
            <Label className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>Modèle Actif</Label>
             <ModelSelector
                availableModels={availableModels}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                isLoading={false}
                isLoadingModels={isLoadingModels}
                providerLogoMap={providerLogoMap}
              />
          </div>
        )}
        <LabelledSlider
            id="temperature"
            label="Température"
            description="Contrôle l'aléatoire : Plus bas (0.0) = plus déterministe, Plus haut (2.0) = plus aléatoire."
            min={0.0} max={2.0} step={0.01}
            value={temperature}
            defaultValue={DEFAULTS.temperature}
            onChange={(val) => setTemperature(val as number)}
            isMobile={isMobile}
        />

        <LabelledSlider
            id="topP"
            label="Top P"
            description="Échantillonnage par noyau : Considère les tokens comprenant la masse de probabilité P la plus élevée. (0.0-1.0)"
            min={0.0} max={1.0} step={0.01}
            value={topP}
            defaultValue={1.0}
            onChange={setTopP}
            isMobile={isMobile}
        />

        <LabelledInput
            id="topK"
            label="Top K"
            description="Limite l'échantillonnage aux K tokens les plus probables. (0 = désactivé)"
            placeholder="Défaut (0)"
            value={topK}
            onChange={setTopK}
            type="number"
            step="1"
            isMobile={isMobile}
        />

        <LabelledSlider
            id="frequencyPenalty"
            label="Pénalité de fréquence"
            description="Pénalise les nouveaux tokens selon leur fréquence existante. (-2.0 à 2.0)"
            min={-2.0} max={2.0} step={0.1}
            value={frequencyPenalty}
            defaultValue={0.0}
            onChange={setFrequencyPenalty}
            isMobile={isMobile}
        />

        <LabelledSlider
            id="presencePenalty"
            label="Pénalité de présence"
            description="Pénalise les nouveaux tokens en fonction de leur présence dans le texte. (-2.0 à 2.0)"
            min={-2.0} max={2.0} step={0.1}
            value={presencePenalty}
            defaultValue={0.0}
            onChange={setPresencePenalty}
            isMobile={isMobile}
        />

        <LabelledSlider
            id="repetitionPenalty"
            label="Pénalité de répétition"
            description="Pénalise selon la probabilité de répétition. (Généralement >1.0 évite la répétition, <1.0 l'encourage)"
            min={0.0} max={2.0} step={0.01}
            value={repetitionPenalty}
            defaultValue={1.0}
            onChange={setRepetitionPenalty}
            isMobile={isMobile}
        />

        <LabelledInput
            id="seed"
            label="Seed"
            description="Entier pour un échantillonnage déterministe (si pris en charge par le modèle)."
            placeholder="Aléatoire"
            value={seed}
            onChange={setSeed}
            type="number"
            step="1"
            isMobile={isMobile}
        />

        <LabelledInput
            id="retrievalK"
            label="Documents à récupérer (k)"
            description="Nombre de documents récupérés avant tout post-traitement."
            placeholder="Défaut (20)"
            value={retrievalK}
            onChange={setRetrievalK}
            type="number"
            step="1"
            isMobile={isMobile}
        />

        <LabelledInput
            id="rerankK"
            label="Documents avant rerank (rerank_k)"
            description="Nombre de documents récupérés avant le réordonnancement sémantique."
            placeholder="Défaut (20)"
            value={rerankK}
            onChange={setRerankK}
            type="number"
            step="1"
            isMobile={isMobile}
        />

        <div className="pt-4 border-t border-border">
          <h3 className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'} mb-2`}>Options RAG avancées</h3>
          <div className={isMobile ? 'space-y-1' : 'space-y-3'}>
            <LabelledSwitch 
              id="evaluateSources" 
              label="Évaluer les sources"
              description="Ajoute une évaluation de la qualité des sources par le LLM pour vérifier si l'information récupérée est pertinente."
              checked={evaluateSources}
              onChange={setEvaluateSources}
              isMobile={isMobile}
            />
            <LabelledSwitch 
              id="useReranker" 
              label="Utiliser le réordonnanceur"
              description="Applique un modèle de réordonnancement sémantique pour mieux organiser les documents récupérés."
              checked={useReranker}
              onChange={setUseReranker}
              isMobile={isMobile}
            />
            <LabelledSwitch 
              id="useMultiQuery" 
              label="Requêtes multiples"
              description="Génère plusieurs requêtes de recherche pour améliorer la récupération de documents."
              checked={useMultiQuery}
              onChange={setUseMultiQuery}
              isMobile={isMobile}
            />
            <LabelledSwitch 
              id="useStreaming" 
              label="Mode streaming"
              description="Diffuse la réponse token par token en temps réel au lieu d'attendre la réponse complète."
              checked={useStreaming}
              onChange={setUseStreaming}
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>

      <div className={`p-6 border-t border-border mt-auto ${isMobile ? 'p-3' : ''}`}>
        <Button variant="outline" onClick={handleResetAll} className={`w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600 ${isMobile ? 'h-9 text-sm' : ''}`}>
          Tout réinitialiser
        </Button>
      </div>
    </div>
  );
} 