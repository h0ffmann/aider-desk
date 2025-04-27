import { useTranslation } from 'react-i18next';
import { McpTool, ToolApprovalState } from '@common/types';
import { SERVER_TOOL_SEPARATOR } from '@common/utils';

import { Select } from '@/components/common/Select';

type Props = {
  tool: McpTool;
  serverName: string;
  toolApprovals: Record<string, ToolApprovalState>;
  onApprovalChange: (toolId: string, approval: ToolApprovalState) => void;
};

export const McpToolItem = ({ tool, serverName, toolApprovals, onApprovalChange }: Props) => {
  const { t } = useTranslation();
  const fullToolId = `${serverName}${SERVER_TOOL_SEPARATOR}${tool.name}`;
  const currentApproval = toolApprovals[fullToolId] || ToolApprovalState.Always;

  const approvalOptions = [
    { value: ToolApprovalState.Always, label: t('mcp.approval.always') },
    { value: ToolApprovalState.Never, label: t('mcp.approval.never') },
    { value: ToolApprovalState.Ask, label: t('mcp.approval.ask') },
  ];

  const handleApprovalChange = (value: string) => {
    onApprovalChange(fullToolId, value as ToolApprovalState);
  };

  return (
    <div className="border border-neutral-700 rounded p-2">
      <div className="flex justify-between items-baseline mb-1">
        <div className="font-bold text-sm">{tool.name}</div>
        <div>
          <Select options={approvalOptions} size="sm" value={currentApproval} onChange={handleApprovalChange} />
        </div>
      </div>
      <div className="text-neutral-400 text-xs">{tool.description || t('mcp.noDescription')}</div>
    </div>
  );
};
