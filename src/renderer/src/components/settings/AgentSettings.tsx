import { AgentConfig, McpServerConfig, SettingsData, ToolApprovalState } from '@common/types';
import { useState, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPlus } from 'react-icons/fa';
import {
  LlmProvider,
  PROVIDER_MODELS,
  AVAILABLE_PROVIDERS,
  isBedrockProvider,
  isOpenAiProvider,
  isAnthropicProvider,
  isGeminiProvider,
  isDeepseekProvider,
  isOpenAiCompatibleProvider,
  isOllamaProvider,
  getActiveProvider,
} from '@common/llm-providers';
import { SERVER_TOOL_SEPARATOR } from '@common/utils';

import { McpServer, McpServerForm } from './McpServerForm';
import { McpServerItem } from './McpServerItem';
import {
  OpenAiParameters,
  AnthropicParameters,
  GeminiParameters,
  BedrockParameters,
  DeepseekParameters,
  OpenAiCompatibleParameters,
  OllamaParameters,
} from './providers';

import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Slider } from '@/components/common/Slider';
import { InfoIcon } from '@/components/common/InfoIcon';
import { TextArea } from '@/components/common/TextArea';
import { Accordion } from '@/components/common/Accordion';
import { Input } from '@/components/common/Input';
import { StyledTooltip } from '@/components/common/StyledTooltip';

const CUSTOM_INSTRUCTIONS_PLACEHOLDER = `## Probe Tools Usage

- use probe tools when you need to find files related to users request
- think about the search queries you need to use to find the files`;

type Props = {
  settings: SettingsData;
  setSettings: (settings: SettingsData) => void;
};

export const AgentSettings = ({ settings, setSettings }: Props) => {
  const { t } = useTranslation();
  const { agentConfig } = settings;
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);
  const [isEditingAllServers, setIsEditingAllServers] = useState(false);
  const activeProvider = getActiveProvider(agentConfig.providers);

  const handleProviderChanged = (newProviderName: string) => {
    let updatedProviders = settings.agentConfig.providers;

    // Check if provider already exists
    const existingProvider = updatedProviders.find((provider) => provider.name === newProviderName);

    if (!existingProvider) {
      // Create new provider with default values based on provider type
      let newProvider: LlmProvider;

      if (newProviderName === 'bedrock') {
        newProvider = {
          name: 'bedrock',
          accessKeyId: '',
          secretAccessKey: '',
          region: 'us-east-1',
          model: Object.keys(PROVIDER_MODELS[newProviderName].models)[0],
          active: true,
        };
      } else if (newProviderName === 'ollama') {
        newProvider = {
          name: 'ollama',
          baseUrl: 'http://localhost:11434/api',
          model: '',
          active: true,
        } as LlmProvider;
      } else {
        newProvider = {
          name: newProviderName,
          apiKey: '',
          model: Object.keys(PROVIDER_MODELS[newProviderName]?.models || {})?.[0] || '',
          active: true,
        } as LlmProvider;
      }

      updatedProviders = [...updatedProviders, newProvider];
    }

    // Update active state for all providers
    updatedProviders = updatedProviders.map((provider) => ({
      ...provider,
      active: provider.name === newProviderName,
    }));

    const updatedMcpConfig = {
      ...settings.agentConfig,
      providers: updatedProviders,
    };
    setSettings({ ...settings, agentConfig: updatedMcpConfig });
  };

  const handleApprovalChange = (toolId: string, approval: ToolApprovalState) => {
    const updatedApprovals = {
      ...settings.agentConfig.toolApprovals,
      [toolId]: approval,
    };
    setSettings({
      ...settings,
      agentConfig: {
        ...settings.agentConfig,
        toolApprovals: updatedApprovals,
      },
    });
  };

  const handleMaxIterationsChanged = (newMaxIterations: number) => {
    const updatedMcpConfig: AgentConfig = {
      ...settings.agentConfig,
      maxIterations: newMaxIterations,
    };
    setSettings({ ...settings, agentConfig: updatedMcpConfig });
  };

  const handleDelayBetweenIterationsChanged = (newDelay: number) => {
    const updatedMcpConfig: AgentConfig = {
      ...settings.agentConfig,
      minTimeBetweenToolCalls: newDelay,
    };
    setSettings({ ...settings, agentConfig: updatedMcpConfig });
  };

  const handleMaxTokenChanged = (newMaxTokens: number) => {
    const updatedMcpConfig: AgentConfig = {
      ...settings.agentConfig,
      maxTokens: newMaxTokens,
    };
    setSettings({ ...settings, agentConfig: updatedMcpConfig });
  };

  const handleCustomInstructionsChanged = (newSystemPrompt: string) => {
    const updatedMcpConfig = {
      ...settings.agentConfig,
      systemPrompt: newSystemPrompt,
    };
    setSettings({ ...settings, agentConfig: updatedMcpConfig });
  };

  const handleServerConfigSave = (servers: Record<string, McpServerConfig>) => {
    let updatedMcpServers = { ...settings.agentConfig.mcpServers };

    if (isAddingServer) {
      // Add new servers to the existing ones
      updatedMcpServers = {
        ...updatedMcpServers,
        ...servers,
      };
    } else if (editingServer) {
      // If editing and the server name did not change, preserve the order
      const oldName = editingServer.name;
      const newNames = Object.keys(servers);
      if (newNames.length === 1 && newNames[0] === oldName) {
        // Replace the server at the same position
        const entries = Object.entries(updatedMcpServers);
        const index = entries.findIndex(([name]) => name === oldName);
        if (index !== -1) {
          entries[index] = [oldName, servers[oldName]];
          updatedMcpServers = Object.fromEntries(entries);
        } else {
          // fallback: just replace as before
          const { [oldName]: _removed, ...rest } = updatedMcpServers;
          updatedMcpServers = {
            ...rest,
            ...servers,
          };
        }
      } else {
        // Remove the old server and add the updated one(s)
        const { [oldName]: _removed, ...rest } = updatedMcpServers;
        updatedMcpServers = {
          ...rest,
          ...servers,
        };
      }
    } else if (isEditingAllServers) {
      // Replace all servers with the new set
      updatedMcpServers = { ...servers };
    }

    // Filter toolApprovals to remove entries for tools belonging to removed servers
    const updatedToolApprovals = Object.entries(settings.agentConfig.toolApprovals).reduce(
      (acc, [toolId, approval]) => {
        const serverName = toolId.split(SERVER_TOOL_SEPARATOR)[0];
        if (updatedMcpServers[serverName]) {
          acc[toolId] = approval;
        }
        return acc;
      },
      {} as Record<string, ToolApprovalState>,
    );

    const updatedMcpConfig: AgentConfig = {
      ...settings.agentConfig,
      mcpServers: updatedMcpServers,
      disabledServers: settings.agentConfig.disabledServers.filter((name) => !!updatedMcpServers[name]),
      toolApprovals: updatedToolApprovals,
    };
    setSettings({ ...settings, agentConfig: updatedMcpConfig });
    setIsAddingServer(false);
    setEditingServer(null);
    setIsEditingAllServers(false);
  };

  const handleServerConfigRemove = (serverName: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [serverName]: removedServer, ...remainingServers } = settings.agentConfig.mcpServers;
    const updatedMcpConfig = {
      ...settings.agentConfig,
      mcpServers: remainingServers,
    };
    setSettings({ ...settings, agentConfig: updatedMcpConfig });
  };

  return (
    <div>
      {isAddingServer || editingServer || isEditingAllServers ? (
        <McpServerForm
          onSave={handleServerConfigSave}
          onCancel={() => {
            setIsAddingServer(false);
            setEditingServer(null);
            setIsEditingAllServers(false);
          }}
          servers={
            isEditingAllServers
              ? Object.entries(agentConfig.mcpServers).map(([name, config]) => ({ name, config }))
              : editingServer
                ? [editingServer]
                : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div>
                <Select
                  label={t('settings.agent.provider')}
                  value={activeProvider?.name || ''}
                  onChange={handleProviderChanged}
                  options={AVAILABLE_PROVIDERS}
                />
              </div>
              {activeProvider && isOpenAiProvider(activeProvider) && <OpenAiParameters settings={settings} setSettings={setSettings} />}
              {activeProvider && isAnthropicProvider(activeProvider) && <AnthropicParameters settings={settings} setSettings={setSettings} />}
              {activeProvider && isGeminiProvider(activeProvider) && <GeminiParameters settings={settings} setSettings={setSettings} />}
              {activeProvider && isDeepseekProvider(activeProvider) && <DeepseekParameters settings={settings} setSettings={setSettings} />}
              {activeProvider && isBedrockProvider(activeProvider) && <BedrockParameters settings={settings} setSettings={setSettings} />}
              {activeProvider && isOpenAiCompatibleProvider(activeProvider) && <OpenAiCompatibleParameters settings={settings} setSettings={setSettings} />}
              {activeProvider && isOllamaProvider(activeProvider) && <OllamaParameters settings={settings} setSettings={setSettings} />}
            </div>
            <div>
              <div>
                <Slider
                  label={
                    <div className="flex items-center">
                      <span>{t('settings.agent.maxIterations')}</span>
                      <InfoIcon className="ml-1" tooltip={t('settings.agent.computationalResources')} />
                    </div>
                  }
                  min={1}
                  max={200}
                  value={agentConfig.maxIterations}
                  onChange={handleMaxIterationsChanged}
                />
              </div>
              <div className="mt-4">
                <Input
                  label={
                    <div className="flex items-center">
                      <span>{t('settings.agent.minTimeBetweenToolCalls')}</span>
                      <InfoIcon className="ml-1" tooltip={t('settings.agent.rateLimiting')} />
                    </div>
                  }
                  type="number"
                  min={0}
                  max={10000}
                  step={100}
                  value={agentConfig.minTimeBetweenToolCalls.toString()}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleDelayBetweenIterationsChanged(Number(e.target.value))}
                />
              </div>
              <div className="mt-2">
                <Input
                  label={
                    <div className="flex items-center">
                      <span>{t('settings.agent.maxTokens')}</span>
                      <InfoIcon className="ml-1" tooltip={t('settings.agent.tokensPerResponse')} />
                    </div>
                  }
                  type="number"
                  min={1}
                  value={agentConfig.maxTokens.toString()}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleMaxTokenChanged(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Accordion title={t('settings.agent.customInstructions')} className="text-sm">
              <div className="text-xxs text-amber-500 mt-2 mb-2">{t('settings.agent.customInstructionsInfo')}</div>
              <TextArea
                value={agentConfig.customInstructions}
                onChange={(e) => handleCustomInstructionsChanged(e.target.value)}
                rows={15}
                className="w-full resize-none"
                placeholder={CUSTOM_INSTRUCTIONS_PLACEHOLDER}
              />
            </Accordion>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2 mt-4">
              <div className="text-sm text-neutral-100 font-medium">{t('settings.agent.mcpServers')}</div>
              <Button variant="text" className="ml-2 text-xs" onClick={() => setIsEditingAllServers(true)}>
                {t('settings.agent.editConfig')}
              </Button>
            </div>
            {Object.keys(agentConfig.mcpServers).length === 0 ? (
              <div className="text-xs text-gray-500 mb-2">{t('settings.agent.noServersConfigured')}</div>
            ) : (
              Object.entries(agentConfig.mcpServers).map(([serverName, config]) => (
                <McpServerItem
                  key={serverName}
                  serverName={serverName}
                  config={config}
                  onRemove={() => handleServerConfigRemove(serverName)}
                  onEdit={() => setEditingServer({ name: serverName, config })}
                  toolApprovals={agentConfig.toolApprovals} // Pass toolApprovals
                  onApprovalChange={handleApprovalChange} // Pass handler
                />
              ))
            )}
            <StyledTooltip id="mcp-server-item" />
            <div className="flex justify-center">
              <Button onClick={() => setIsAddingServer(true)} variant="text" className="mt-3 flex items-center text-sm">
                <FaPlus className="mr-2 w-2 h-2" /> {t('settings.agent.addServer')}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
