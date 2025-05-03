import { FaRegUser } from 'react-icons/fa';
import clsx from 'clsx';

import { MessageBar } from './MessageBar';
import { parseMessageContent } from './utils';

import { UserMessage } from '@/types/message';

type Props = {
  baseDir: string;
  message: UserMessage;
  allFiles: string[];
  renderMarkdown: boolean;
  onRemove?: () => void;
};

export const UserMessageBlock = ({ baseDir, message, allFiles, renderMarkdown, onRemove }: Props) => {
  const baseClasses = 'rounded-md p-3 mb-2 max-w-full text-xs bg-neutral-850 border border-neutral-800 text-gray-100';

  return (
    <div className={clsx(baseClasses, 'relative flex flex-col group', !renderMarkdown && 'break-words whitespace-pre-wrap')}>
      <div className="flex items-start gap-2">
        <div className="mt-[3px]">
          <FaRegUser className="text-neutral-500 w-4 h-3" />
        </div>
        <div className="flex-grow-1 w-full overflow-hidden">{parseMessageContent(baseDir, message.content, allFiles, renderMarkdown)}</div>
      </div>
      <MessageBar content={message.content} removeMessage={onRemove} />
    </div>
  );
};
