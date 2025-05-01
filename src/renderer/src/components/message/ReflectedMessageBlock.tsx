import { useState } from 'react';
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from 'react-icons/md';
import { useTranslation } from 'react-i18next';

import { CopyMessageButton } from './CopyMessageButton';
import { parseMessageContent } from './utils';

import { Message } from '@/types/message';

type Props = {
  baseDir: string;
  message: Message;
  allFiles: string[];
};

export const ReflectedMessageBlock = ({ baseDir, message, allFiles }: Props) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-md p-3 mb-2 max-w-full text-xs bg-neutral-900/50 border border-neutral-800/50 text-neutral-400 relative group break-words whitespace-pre-wrap">
      <div className="flex items-center cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? <MdKeyboardArrowDown className="mr-2" /> : <MdKeyboardArrowRight className="mr-2" />}
        <span className="opacity-70 text-xs">{t('reflectedMessage.title')}</span>
      </div>
      {isExpanded && (
        <div className="mt-2">
          {parseMessageContent(baseDir, message.content, allFiles)}
          <div className="absolute top-2 right-2">
            <CopyMessageButton content={message.content} className="text-neutral-600 hover:text-neutral-300" />
          </div>
        </div>
      )}
    </div>
  );
};
