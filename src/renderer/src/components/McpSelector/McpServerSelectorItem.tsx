import { useEffect, useState } from 'react';
import { CgSpinner } from 'react-icons/cg';
import { useTranslation } from 'react-i18next';
import { ToolApprovalState } from '@common/types';
import { SERVER_TOOL_SEPARATOR } from '@common/utils';

import { Checkbox } from '../common/Checkbox';

type Props = {
  serverName: string;
  disabled: boolean;
  toolApprovals: Record<string, ToolApprovalState>;
  onToggle: (serverName: string) => void;
};

export const McpServerSelectorItem = ({ serverName, disabled, toolApprovals, onToggle }: Props) => {
  const { t } = useTranslation();
  const [toolsCount, setToolsCount] = useState<number | null>(null);

  useEffect(() => {
    const loadTools = async () => {
      // set to loading state after 500ms
      const timeoutId = setTimeout(() => setToolsCount(null), 500);
      try {
        const tools = await window.api.loadMcpServerTools(serverName);
        const totalTools = tools?.length ?? 0;
        const disabledCount =
          tools?.filter((tool) => toolApprovals[`${serverName}${SERVER_TOOL_SEPARATOR}${tool.name}`] === ToolApprovalState.Never).length ?? 0;
        setToolsCount(Math.max(0, totalTools - disabledCount));
      } catch (error) {
        console.error('Failed to load MCP server tools:', error);
        setToolsCount(0); // Set count to 0 on error
      } finally {
        clearTimeout(timeoutId); // Clear timeout regardless of success or error
      }
    };

    void loadTools();
  }, [toolApprovals, serverName]);

  return (
    <div className="flex items-center justify-between px-3 py-1 hover:bg-neutral-800 cursor-pointer text-xs" onClick={() => onToggle(serverName)}>
      <Checkbox checked={!disabled} onChange={() => onToggle(serverName)} className="mr-1" label={serverName} />
      {toolsCount === null ? (
        <CgSpinner className="animate-spin text-xs text-neutral-700 ml-2" />
      ) : (
        <span className="text-xxs text-neutral-700 ml-2 whitespace-nowrap">{t('mcp.toolsCount', { count: toolsCount })}</span>
      )}
    </div>
  );
};
