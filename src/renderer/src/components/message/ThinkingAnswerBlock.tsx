import { MouseEvent, useState } from 'react';
import { FaBrain, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { MdOutlineLightbulb } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

import { CopyMessageButton } from './CopyMessageButton';
import { parseMessageContent } from './utils';

type Props = {
  thinking: string;
  answer?: string | null;
  baseDir?: string;
  allFiles?: string[];
  renderMarkdown: boolean;
};

export const ThinkingAnswerBlock = ({ thinking, answer, baseDir = '', allFiles = [], renderMarkdown }: Props) => {
  const { t } = useTranslation();
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  const handleToggleThinking = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsThinkingExpanded(!isThinkingExpanded);
  };

  return (
    <div className="flex flex-col w-full gap-3 pt-5">
      {/* Thinking section */}
      <div className="border border-neutral-700 rounded-md overflow-hidden">
        <div className="flex items-center justify-between gap-2 p-2 bg-neutral-800 cursor-pointer hover:bg-neutral-750" onClick={handleToggleThinking}>
          <div className="flex items-center gap-2">
            <div className="text-neutral-200">{isThinkingExpanded ? <FaChevronDown size={14} /> : <FaChevronRight size={14} />}</div>
            <div className={`text-neutral-200 ${!answer ? 'animate-pulse' : ''}`}>
              <FaBrain size={16} />
            </div>
            <div className={`font-medium text-neutral-100 ${!answer ? 'animate-pulse' : ''}`}>{t('thinkingAnswer.thinking')}</div>
          </div>
          {thinking && <CopyMessageButton content={thinking} className="text-neutral-600 hover:text-neutral-300" />}
        </div>

        {isThinkingExpanded && (
          <div className={clsx('p-3 text-xs text-neutral-300 bg-neutral-850', !renderMarkdown && 'whitespace-pre-wrap break-words')}>
            {parseMessageContent(baseDir, thinking, allFiles, renderMarkdown)}
          </div>
        )}
      </div>

      {/* Answer section - only show if we have an answer or we're streaming */}
      {answer && (
        <div className="border border-neutral-700 rounded-md overflow-hidden">
          <div className="flex items-center justify-between gap-2 p-2 bg-neutral-800">
            <div className="flex items-center gap-2">
              <div className="text-neutral-200">
                <MdOutlineLightbulb size={18} />
              </div>
              <div className="font-medium text-neutral-100">{t('thinkingAnswer.answer')}</div>
            </div>
            <CopyMessageButton content={answer} className="text-neutral-600 hover:text-neutral-300" />
          </div>
          <div className={clsx('p-3 text-xs text-neutral-100 bg-neutral-850', !renderMarkdown && 'whitespace-pre-wrap break-words')}>
            {parseMessageContent(baseDir, answer, allFiles, renderMarkdown)}
          </div>
        </div>
      )}
    </div>
  );
};
