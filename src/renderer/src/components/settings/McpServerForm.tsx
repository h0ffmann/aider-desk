import { McpServerConfig } from '@common/types';
import { useState, useMemo, ChangeEvent } from 'react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

const MCP_SERVER_EXAMPLE_JSON = `{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}`;

const MCP_SERVER_EXAMPLE_NO_PARENT = `{
  "puppeteer": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
  }
}`;

const MCP_SERVER_EXAMPLE_BARE = `"puppeteer": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
}`;

import { TextArea } from '@/components/common/TextArea';
import { Button } from '@/components/common/Button';

const McpServersRecordSchema = z.record(
  z.object({
    command: z.string(),
    args: z.array(z.string()).readonly(),
    env: z.record(z.string()).readonly().optional(),
    enabled: z.boolean().optional(),
  }),
);

export const McpServerConfigSchema = z.union([
  z.object({
    mcpServers: McpServersRecordSchema,
  }),
  McpServersRecordSchema,
]);

export type McpServer = {
  name: string;
  config: McpServerConfig;
};

type Props = {
  onSave: (servers: Record<string, McpServerConfig>) => void;
  onCancel: () => void;
  servers?: McpServer[];
};

export const McpServerForm = ({ onSave, onCancel, servers }: Props) => {
  const { t } = useTranslation();
  const [configJSON, setConfigJSON] = useState(() => {
    if (servers && servers.length > 0) {
      // If multiple servers, merge them into a single object
      const serversObj: Record<string, McpServerConfig> = {};
      servers.forEach(({ name, config }) => {
        serversObj[name] = config;
      });
      return JSON.stringify(
        {
          mcpServers: serversObj,
        },
        null,
        2,
      );
    }
    return '';
  });

  // Try to parse as JSON, or as a "bare" object (without enclosing {})
  const parseConfig = (text: string) => {
    try {
      // Try as full JSON first
      return JSON.parse(text);
    } catch {
      // Try as "bare" object: wrap in braces and parse
      try {
        return JSON.parse(`{${text}}`);
      } catch {
        return null;
      }
    }
  };

  const isValidJson = useMemo(() => {
    const parsed = parseConfig(configJSON);
    if (!parsed) {
      return false;
    }
    const result = McpServerConfigSchema.safeParse(parsed);
    return result.success;
  }, [configJSON]);

  const handleAddServer = () => {
    if (isValidJson) {
      const parsed = parseConfig(configJSON);
      if (!parsed) {
        return;
      }
      // Accept both { mcpServers: {...} } and just { ... }
      if ('mcpServers' in parsed && typeof parsed.mcpServers === 'object') {
        onSave(parsed.mcpServers);
      } else {
        onSave(parsed);
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setConfigJSON(e.target.value);
  };

  return (
    <div>
      <div className="flex items-center mb-2 text-neutral-100">
        <h3 className="text-md font-medium uppercase mb-1">
          {servers && servers.length === 1
            ? t('mcpServer.editServer', { name: servers[0].name })
            : servers && servers.length > 1
              ? t('settings.agent.editConfig')
              : t('mcpServer.addServer')}
        </h3>
      </div>
      <div className="mb-2">
        <TextArea
          placeholder={t('mcpServer.pasteServerAs', {
            example: MCP_SERVER_EXAMPLE_JSON,
            exampleNoParent: MCP_SERVER_EXAMPLE_NO_PARENT,
            exampleBare: MCP_SERVER_EXAMPLE_BARE,
          })}
          value={configJSON}
          onChange={handleChange}
          className={`w-full h-60 p-2 resize-none ${configJSON && !isValidJson ? 'border-red-800/50 focus:border-red-800/50' : ''}`}
        />
        {!servers && <div className="text-xs text-gray-500 mt-1">{t('mcpServer.multipleServersHint')}</div>}
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} variant="text">
          {t('common.cancel')}
        </Button>
        <Button onClick={handleAddServer} variant="contained" disabled={!isValidJson || !configJSON}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
};
