import path from 'path';
import { promises as fs } from 'fs';

import debounce from 'lodash/debounce';
import { ContextFile, ContextMessage, MessageRole, SessionData } from '@common/types';
import { extractServerNameToolName, extractTextContent, fileExists, isMessageEmpty, isTextContent } from '@common/utils';
import ignore from 'ignore';

import logger from './logger';
import { Project } from './project';

const AUTOSAVED_SESSION_NAME = '.autosaved';

export class SessionManager {
  private contextMessages: ContextMessage[];
  private contextFiles: ContextFile[];

  constructor(
    private readonly project: Project,
    initialMessages: ContextMessage[] = [],
    initialFiles: ContextFile[] = [],
  ) {
    this.contextMessages = initialMessages;
    this.contextFiles = initialFiles;
  }

  addContextMessage(role: MessageRole, content: string): void;
  addContextMessage(message: ContextMessage): void;
  addContextMessage(roleOrMessage: MessageRole | ContextMessage, content?: string) {
    let message: ContextMessage;

    if (typeof roleOrMessage === 'string') {
      if (!content) {
        // No content provided, do not add the message
        return;
      }

      message = {
        role: roleOrMessage,
        content: content || '',
      };
    } else {
      message = roleOrMessage;

      if (roleOrMessage.role === 'assistant' && isMessageEmpty(message.content)) {
        logger.debug('Skipping empty assistant message');
        // Skip adding empty assistant messages
        return;
      }
    }

    this.contextMessages.push(message);
    logger.debug(`Session: Added ${message.role} message. Total messages: ${this.contextMessages.length}`);
    this.saveAsAutosaved();
  }

  private async isFileIgnored(contextFile: ContextFile): Promise<boolean> {
    if (contextFile.readOnly) {
      // not checking gitignore for read-only files
      return false;
    }

    const gitignorePath = path.join(this.project.baseDir, '.gitignore');

    if (!(await fileExists(gitignorePath))) {
      logger.debug('No .gitignore file found, not checking for ignored files');
      return false;
    }

    const gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
    const ig = ignore().add(gitignoreContent);

    // Make the path relative to the base directory
    const absolutePath = path.resolve(this.project.baseDir, contextFile.path);
    const relativePath = path.relative(this.project.baseDir, absolutePath);

    logger.debug(`Checking if file is ignored: ${relativePath}, ${absolutePath}`);

    return ig.ignores(relativePath);
  }

  async addContextFile(contextFile: ContextFile) {
    const alreadyAdded = this.contextFiles.find((file) => file.path === contextFile.path);
    if (alreadyAdded) {
      return false;
    }

    // skip ignore check for folders
    const isFolder = contextFile.path.endsWith('/') || contextFile.path.endsWith(path.sep);
    if (!isFolder) {
      if (await this.isFileIgnored(contextFile)) {
        logger.debug('Skipping ignored file:', { path: contextFile.path });
        return false;
      }
    }

    this.contextFiles.push({
      ...contextFile,
      readOnly: contextFile.readOnly ?? false,
    });

    this.saveAsAutosaved();
    return true;
  }

  dropContextFile(filePath: string) {
    const absolutePath = path.resolve(this.project.baseDir, filePath);

    const file = this.contextFiles.find((f) => {
      const contextFileAbsolutePath = path.resolve(this.project.baseDir, f.path);
      return (
        f.path === filePath || // Exact match
        contextFileAbsolutePath === filePath || // Absolute path matches
        contextFileAbsolutePath === absolutePath // Relative path matches when converted to absolute
      );
    });

    if (file) {
      this.contextFiles = this.contextFiles.filter((f) => f !== file);
      this.saveAsAutosaved();
    }

    return file;
  }

  setContextFiles(contextFiles: ContextFile[]) {
    this.contextFiles = contextFiles;
    this.saveAsAutosaved();
  }

  getContextFiles(): ContextFile[] {
    return [...this.contextFiles];
  }

  getContextMessages(): ContextMessage[] {
    return [...this.contextMessages];
  }

  clearMessages() {
    this.contextMessages = [];
  }

  filterUserAndAssistantMessages(contextMessages: ContextMessage[] = this.contextMessages): { role: MessageRole; content: string }[] {
    return contextMessages.flatMap((message) => {
      if (message.role === MessageRole.User || message.role === MessageRole.Assistant) {
        const content = extractTextContent(message.content);
        if (!content) {
          return [];
        }
        return [
          {
            role: message.role,
            content,
          },
        ];
      } else if (message.role === 'tool') {
        return message.content.map((part) => ({
          role: MessageRole.Assistant,
          content: `I called tool ${part.toolName} and got result:\n${JSON.stringify(part.result)}`,
        }));
      } else {
        return [];
      }
    }) as { role: MessageRole; content: string }[];
  }

  async save(name: string) {
    try {
      const sessionsDir = path.join(this.project.baseDir, '.aider-desk', 'sessions');
      await fs.mkdir(sessionsDir, { recursive: true });
      const sessionPath = path.join(sessionsDir, `${name}.json`);

      const sessionData = {
        contextMessages: this.contextMessages,
        contextFiles: this.contextFiles,
      };

      await fs.writeFile(sessionPath, JSON.stringify(sessionData, null, 2), 'utf8');

      logger.info(`Session saved to ${sessionPath}`);
    } catch (error) {
      logger.error('Failed to save session:', { error });
      throw error;
    }
  }

  async loadMessages(sessionData: SessionData & { contextMessages?: ContextMessage[] }): Promise<void> {
    // Clear all current messages
    this.project.clearContext();

    // Load messages (only supports new CoreMessage format)
    this.contextMessages = sessionData.contextMessages || [];

    // Add messages to the UI
    for (let i = 0; i < this.contextMessages.length; i++) {
      const message = this.contextMessages[i];
      if (message.role === 'assistant') {
        if (Array.isArray(message.content)) {
          for (const part of message.content) {
            if (part.type === 'text' && part.text) {
              this.project.processResponseMessage({
                action: 'response',
                content: part.text,
                finished: true,
              });
            } else if (part.type === 'tool-call') {
              const toolCall = part;
              // Ensure toolCall.toolCallId exists before proceeding
              if (!toolCall.toolCallId) {
                continue;
              }

              const [serverName, toolName] = extractServerNameToolName(toolCall.toolName);
              this.project.addToolMessage(toolCall.toolCallId, serverName, toolName, toolCall.args as Record<string, unknown>);
            }
          }
        } else if (isTextContent(message.content)) {
          const content = extractTextContent(message.content);
          this.project.processResponseMessage({
            action: 'response',
            content: content,
            finished: true,
          });
          this.project.sendAddMessage(MessageRole.Assistant, content, false);
        }
      } else if (message.role === 'user') {
        const content = extractTextContent(message.content);
        this.project.addUserMessage(content);
        this.project.sendAddMessage(MessageRole.User, content, false);
      } else if (message.role === 'tool') {
        for (const part of message.content) {
          if (part.type === 'tool-result') {
            const [serverName, toolName] = extractServerNameToolName(part.toolName);
            this.project.addToolMessage(part.toolCallId, serverName, toolName, undefined, JSON.stringify(part.result));
          }
        }
      }
    }
  }

  async loadFiles(sessionData: SessionData & { contextFiles?: ContextFile[] }): Promise<void> {
    // Drop all current files
    this.getContextFiles().forEach((contextFile) => {
      this.project.sendDropFile(contextFile.path, contextFile.readOnly);
    });

    this.contextFiles = sessionData.contextFiles || [];
    this.getContextFiles().forEach((contextFile) => {
      this.project.sendAddFile(contextFile);
    });
  }

  async load(name: string): Promise<void> {
    try {
      const sessionData = await this.findSession(name);

      if (!sessionData) {
        logger.debug('No session found to load:', { name });
        return;
      }

      await this.loadMessages(sessionData);
      await this.loadFiles(sessionData);

      logger.info(`Session loaded from ${name}`);
    } catch (error) {
      logger.error('Failed to load session:', { error });
      throw error;
    }
  }

  private debouncedSaveAsAutosaved = debounce(async () => {
    logger.info('Saving session as autosaved', { projectDir: this.project.baseDir });
    await this.save('.autosaved');
  }, 3000);

  private saveAsAutosaved() {
    this.debouncedSaveAsAutosaved();
  }

  async loadAutosaved(): Promise<void> {
    try {
      await this.load('.autosaved');
    } catch (error) {
      logger.error('Failed to load autosaved session:', { error });
      throw error;
    }
  }

  async getAllSessions(): Promise<SessionData[]> {
    try {
      const sessionsDir = path.join(this.project.baseDir, '.aider-desk', 'sessions');
      await fs.mkdir(sessionsDir, { recursive: true });
      const files = await fs.readdir(sessionsDir);
      const sessions: SessionData[] = [];

      for (const file of files.filter((file) => file.endsWith('.json'))) {
        const sessionName = file.replace('.json', '');

        if (sessionName === AUTOSAVED_SESSION_NAME) {
          continue;
        }

        try {
          const sessionData = await this.findSession(sessionName);
          if (sessionData) {
            sessions.push({
              name: sessionName,
              messages: sessionData.contextMessages?.length || 0,
              files: sessionData.contextFiles?.length || 0,
            });
          }
        } catch (error) {
          logger.error('Failed to read session file:', { file, error });
        }
      }

      return sessions;
    } catch (error) {
      logger.error('Failed to list sessions:', { error });
      return [];
    }
  }

  async findSession(name: string): Promise<
    | (SessionData & {
        contextMessages?: ContextMessage[];
        contextFiles?: ContextFile[];
      })
    | null
  > {
    try {
      const sessionPath = path.join(this.project.baseDir, '.aider-desk', 'sessions', `${name}.json`);

      if (!(await fileExists(sessionPath))) {
        return null;
      }

      const content = await fs.readFile(sessionPath, 'utf8');
      return content ? JSON.parse(content) : null;
    } catch (error) {
      logger.error('Failed to get session data:', { name, error });
      return null;
    }
  }

  async generateSessionMarkdown(): Promise<string | null> {
    let markdown = '';

    for (const message of this.contextMessages) {
      markdown += `### ${message.role.charAt(0).toUpperCase() + message.role.slice(1)}\n\n`;

      if (message.role === 'user' || message.role === 'assistant') {
        const content = extractTextContent(message.content);
        if (content) {
          markdown += `${content}\n\n`;
        }
      } else if (message.role === 'tool') {
        if (Array.isArray(message.content)) {
          for (const part of message.content) {
            if (part.type === 'tool-result') {
              const [, toolName] = extractServerNameToolName(part.toolName);
              markdown += `**Tool Call ID:** \`${part.toolCallId}\`\n`;
              markdown += `**Tool:** \`${toolName}\`\n`;
              markdown += `**Result:**\n\`\`\`json\n${JSON.stringify(part.result, null, 2)}\n\`\`\`\n\n`;
            }
          }
        }
      }
    }

    return markdown;
  }

  async delete(name: string): Promise<void> {
    logger.info('Deleting session:', { name });
    try {
      const sessionPath = path.join(this.project.baseDir, '.aider-desk', 'sessions', `${name}.json`);
      await fs.unlink(sessionPath);
      logger.info(`Session deleted: ${sessionPath}`);
    } catch (error) {
      logger.error('Failed to delete session:', { error });
      throw error;
    }
  }
}
