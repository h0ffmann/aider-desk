import { LlmProvider } from '@common/llm-providers';

import type { CoreMessage } from 'ai';
import type { JsonSchema } from '@n8n/json-schema-to-zod';

export type Mode = 'code' | 'ask' | 'architect' | 'context' | 'agent';

export interface ResponseChunkData {
  messageId: string;
  baseDir: string;
  chunk: string;
  reflectedMessage?: string;
}

export interface ResponseCompletedData {
  messageId: string;
  baseDir: string;
  content: string;
  reflectedMessage?: string;
  editedFiles?: string[];
  commitHash?: string;
  commitMessage?: string;
  diff?: string;
  usageReport?: UsageReportData;
}

export interface CommandOutputData {
  baseDir: string;
  command: string;
  output: string;
}

export type LogLevel = 'info' | 'warning' | 'error' | 'loading';

export interface LogData {
  baseDir: string;
  level: LogLevel;
  message?: string;
}

export interface ToolData {
  baseDir: string;
  id: string;
  serverName: string;
  toolName: string;
  args?: Record<string, unknown>;
  response?: string;
  usageReport?: UsageReportData;
}

export interface ContextFilesUpdatedData {
  baseDir: string;
  files: ContextFile[];
}

export interface AutocompletionData {
  baseDir: string;
  words: string[];
  allFiles: string[];
  models: string[];
}

export interface SessionData {
  name: string;
  messages?: number;
  files?: number;
}

export interface QuestionData {
  baseDir: string;
  text: string;
  subject?: string;
  defaultAnswer: string;
  internal?: boolean;
  key?: string;
}

export type ContextFileSourceType = 'companion' | 'aider' | 'app' | string;

export enum MessageRole {
  User = 'user',
  Assistant = 'assistant',
}

export type ContextMessage = CoreMessage;

export interface ContextFile {
  path: string;
  readOnly?: boolean;
}

export interface WindowState {
  width: number;
  height: number;
  x: number | undefined;
  y: number | undefined;
  isMaximized: boolean;
}

export interface ProjectSettings {
  mainModel: string;
  weakModel?: string | null;
  architectModel?: string | null;
  reasoningEffort?: string;
  thinkingTokens?: string;
  currentMode: Mode;
  renderMarkdown: boolean;
}

export interface ProjectData {
  active?: boolean;
  baseDir: string;
  settings?: ProjectSettings;
}

export interface RawModelInfo {
  max_input_tokens: number;
  max_output_tokens: number;
  input_cost_per_token: number;
  output_cost_per_token: number;
  supports_function_calling: boolean;
  supports_tool_choice: boolean;
  litellm_provider: string;
}

export interface ModelsData {
  baseDir: string;
  mainModel: string;
  weakModel?: string | null;
  architectModel?: string | null;
  reasoningEffort?: string;
  thinkingTokens?: string;
  info?: RawModelInfo;
  error?: string;
}

export enum ToolApprovalState {
  Always = 'always',
  Never = 'never',
  Ask = 'ask',
}

export enum StartupMode {
  Empty = 'empty',
  Last = 'last',
}

export interface SettingsData {
  onboardingFinished?: boolean;
  language: string;
  startupMode?: StartupMode;
  zoomLevel?: number;
  aider: {
    options: string;
    environmentVariables: string;
  };
  models: {
    preferred: string[];
  };
  agentConfig: AgentConfig;
}

export interface AgentConfig {
  providers: LlmProvider[];
  maxIterations: number;
  maxTokens: number;
  minTimeBetweenToolCalls: number; // in milliseconds
  mcpServers: {
    [key: string]: McpServerConfig;
  };
  disabledServers: string[];
  toolApprovals: Record<string, ToolApprovalState>;
  includeContextFiles: boolean;
  includeRepoMap: boolean;
  useAiderTools: boolean;
  customInstructions: string;
}

export interface UsageReportData {
  sentTokens: number;
  receivedTokens: number;
  messageCost: number;
  aiderTotalCost?: number;
  mcpAgentTotalCost?: number;
}

export interface TokensCost {
  tokens: number;
  cost: number;
}

export interface TokensInfoData {
  baseDir: string;
  chatHistory: TokensCost;
  files: Record<string, TokensCost>;
  repoMap: TokensCost;
  systemMessages: TokensCost;
}

export interface InputHistoryData {
  baseDir: string;
  messages: string[];
}

export interface UserMessageData {
  baseDir: string;
  content: string;
  mode?: Mode;
}

export interface FileEdit {
  path: string;
  original: string;
  updated: string;
}

export interface McpTool {
  serverName: string;
  name: string;
  description?: string;
  inputSchema: JsonSchema;
}

export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Readonly<Record<string, string>>;
}
