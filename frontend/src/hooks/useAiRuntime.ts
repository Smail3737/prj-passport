import { useCallback, useEffect, useState } from 'react';
import { AI_MODEL_STORAGE_KEY } from '../config';
import { runtimeApi } from '../services/runtime-api';
import type { AiRuntimeInfo, ConverterStatus } from '../types';

const FIXED_AI_MODEL = 'auto';

interface UseAiRuntimeResult {
  selectedAiModel: string;
  availableAiModels: string[];
  aiRuntimeInfo: AiRuntimeInfo | null;
  isAiAvailable: boolean;
  aiConnectionStatus: ConverterStatus | null;
  changeAiModel: (value: string) => void;
}

export function useAiRuntime(): UseAiRuntimeResult {
  const [selectedAiModel, setSelectedAiModel] = useState<string>(FIXED_AI_MODEL);
  const [availableAiModels, setAvailableAiModels] = useState<string[]>([FIXED_AI_MODEL]);
  const [aiRuntimeInfo, setAiRuntimeInfo] = useState<AiRuntimeInfo | null>(null);
  const [isAiAvailable, setIsAiAvailable] = useState<boolean>(false);
  const [aiConnectionStatus, setAiConnectionStatus] = useState<ConverterStatus | null>(null);

  useEffect(() => {
    localStorage.removeItem(AI_MODEL_STORAGE_KEY);
  }, []);

  const loadAiRuntimeInfo = useCallback(async () => {
    try {
      const runtime = await runtimeApi.getAiRuntimeInfo({ model: FIXED_AI_MODEL });

      setSelectedAiModel(FIXED_AI_MODEL);
      setAvailableAiModels([FIXED_AI_MODEL]);
      setAiRuntimeInfo(runtime);
      setIsAiAvailable(true);
      setAiConnectionStatus({
        severity: 'success',
        message: `AI runtime is available (${runtime.provider}/${runtime.model}).`,
      });
    } catch (error) {
      console.error('Failed to load AI runtime info:', error);
      setSelectedAiModel(FIXED_AI_MODEL);
      setAvailableAiModels([FIXED_AI_MODEL]);
      setAiRuntimeInfo(null);
      setIsAiAvailable(false);
      setAiConnectionStatus({
        severity: 'error',
        message: 'Failed to load AI runtime configuration.',
      });
    }
  }, []);

  useEffect(() => {
    void loadAiRuntimeInfo();
  }, [loadAiRuntimeInfo]);

  const changeAiModel = useCallback((value: string) => {
    void value;
    setSelectedAiModel(FIXED_AI_MODEL);
    setAvailableAiModels([FIXED_AI_MODEL]);
  }, []);

  return {
    selectedAiModel,
    availableAiModels,
    aiRuntimeInfo,
    isAiAvailable,
    aiConnectionStatus,
    changeAiModel,
  };
}
