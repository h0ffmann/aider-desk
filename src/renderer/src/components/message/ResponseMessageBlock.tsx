import clsx from 'clsx';
import { RiRobot2Line } from 'react-icons/ri';

import { MessageBar } from './MessageBar';
import { parseMessageContent } from './utils';

import { ResponseMessage } from '@/types/message';

type Props = {
  baseDir: string;
  message: ResponseMessage;
  allFiles: string[];
  renderMarkdown: boolean;
  onRemove?: () => void;
};

export const ResponseMessageBlock = ({ baseDir, message, allFiles, renderMarkdown, onRemove }: Props) => {
  const baseClasses = 'rounded-md p-3 mb-2 max-w-full text-xs bg-neutral-850 border border-neutral-800 text-gray-100';

  if (!message.content) {
    return null;
  }

  return (
    <div className={clsx(baseClasses, 'relative flex flex-col group', !renderMarkdown && 'break-words whitespace-pre-wrap')}>
      <div className="flex items-start gap-2">
        <div className="mt-[1px]">
          <RiRobot2Line className="text-neutral-500 w-4 h-4" />
        </div>
        <div className="flex-grow-1 w-full overflow-hidden">{parseMessageContent(baseDir, message.content, allFiles, renderMarkdown)}</div>
      </div>
      <MessageBar content={message.content} usageReport={message.usageReport} removeMessage={onRemove} />
    </div>
  );
};
