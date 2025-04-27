import { McpServerConfig, McpTool, ToolApprovalState } from '@common/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPencilAlt, FaTrash } from 'react-icons/fa';
import { SERVER_TOOL_SEPARATOR } from '@common/utils';

import { McpToolItem } from './McpToolItem';

import { Accordion } from '@/components/common/Accordion';
import { IconButton } from '@/components/common/IconButton';

type Props = {
  serverName: string;
  config: McpServerConfig;
  onRemove: () => void;
  onEdit?: () => void;
  toolApprovals: Record<string, ToolApprovalState>;
  onApprovalChange: (toolId: string, approval: ToolApprovalState) => void;
};

export const McpServerItem = ({ serverName, config, onRemove, onEdit, toolApprovals, onApprovalChange }: Props) => {
  const { t } = useTranslation();
  const [tools, setTools] = useState<McpTool[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTools = async () => {
      try {
        const loadedTools = await window.api.loadMcpServerTools(serverName, config);
        setTools(loadedTools);
      } catch (error) {
        console.error('Failed to load MCP server tools:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadTools();
  }, [serverName, config]);

  const renderTitle = () => {
    const enabledCount =
      tools && tools.length - tools.filter((tool) => toolApprovals[`${serverName}${SERVER_TOOL_SEPARATOR}${tool.name}`] === ToolApprovalState.Never).length;

    return (
      <div className="flex items-center justify-between w-full">
        <span className="text-sm">{serverName}</span>
        <div className="flex items-center">
          {loading ? (
            <span className="text-xs text-neutral-400">{t('common.loading')}</span>
          ) : (
            tools &&
            tools?.length > 0 && (
              <span className="text-xs mr-3 text-neutral-400">
                {t('mcp.serverToolStatus', {
                  count: tools.length,
                  enabledCount,
                })}
              </span>
            )
          )}
          {!loading && (
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full flex items-center justify-center ${tools && tools.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                {/* Empty div for color indicator */}
              </div>
            </div>
          )}
          {onEdit && (
            <IconButton
              icon={<FaPencilAlt className="text-neutral-200" />}
              onClick={onEdit}
              tooltip={t('common.edit')}
              className="ml-4"
              tooltipId="mcp-server-item"
            />
          )}
          <IconButton
            icon={<FaTrash className="text-red-500/60" />}
            onClick={onRemove}
            tooltip={t('common.remove')}
            className="ml-3"
            tooltipId="mcp-server-item"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="border border-neutral-700 rounded mb-1">
      <Accordion title={renderTitle()} buttonClassName="px-2">
        {loading ? (
          <div className="text-xs text-neutral-500 p-2">{t('common.loading')}</div>
        ) : tools && tools.length > 0 ? (
          <div>
            <div className="text-xs p-2 rounded mt-1 space-y-2">
              {tools.map((tool) => (
                <McpToolItem key={tool.name} tool={tool} toolApprovals={toolApprovals} onApprovalChange={onApprovalChange} serverName={serverName} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-neutral-500 p-4">{t('mcp.noToolsFound')}</div>
        )}
      </Accordion>
    </div>
  );
};
