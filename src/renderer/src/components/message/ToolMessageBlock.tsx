import { useState, useEffect, useRef } from 'react';
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from 'react-icons/md';
import { CgSpinner } from 'react-icons/cg';
import { RiToolsFill } from 'react-icons/ri';
import { useTranslation } from 'react-i18next';
import { VscError } from 'react-icons/vsc';
import clsx from 'clsx';

import { CopyMessageButton } from './CopyMessageButton';
import { parseToolContent } from './utils';

import { ToolMessage } from '@/types/message';
import { MessageBar } from '@/components/message/MessageBar';

type Props = {
  message: ToolMessage;
  onRemove?: () => void;
};

export const ToolMessageBlock = ({ message, onRemove }: Props) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true); // Controls visibility
  const [isInitialAutoExpand, setIsInitialAutoExpand] = useState(true); // Tracks the initial phase
  const isExecuting = message.content === '';
  const parsedResult = !isExecuting ? parseToolContent(message.content) : null;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Auto-collapse only during the initial phase
    if (isInitialAutoExpand) {
      timerRef.current = setTimeout(() => {
        // Check again inside timeout in case user clicked during the delay
        if (isInitialAutoExpand) {
          setIsExpanded(false);
          setIsInitialAutoExpand(false); // End the initial phase
        }
      }, 2000);
    }

    // Cleanup function to clear the timeout
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isInitialAutoExpand]); // Depend only on isInitialAutoExpand

  const handleHeaderClick = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // Always end the initial phase on click
    if (isInitialAutoExpand) {
      setIsInitialAutoExpand(false);
    }
    // Toggle expansion state
    setIsExpanded((prev) => !prev);
  };

  const getResultContent = () => {
    if (!parsedResult) {
      return null;
    }

    let displayContent: string;
    let rawContentToCopy: string;

    if (parsedResult.parsedInnerJson) {
      // Display pretty-printed JSON
      displayContent = JSON.stringify(parsedResult.parsedInnerJson, null, 2);
      rawContentToCopy = JSON.stringify(parsedResult.parsedInnerJson); // Copy raw JSON
    } else if (parsedResult.extractedText) {
      // Display extracted text if inner JSON parsing failed
      displayContent = parsedResult.extractedText;
      rawContentToCopy = parsedResult.extractedText;
    } else {
      // Fallback to the original raw content if no text was extracted
      displayContent = parsedResult.rawContent;
      rawContentToCopy = parsedResult.rawContent;
    }

    return (
      <>
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2 font-semibold text-neutral-200">
            {t('toolMessage.result')}
            {parsedResult.isError === true && (
              <span className="flex items-center gap-1 text-red-500 text-xs font-normal">
                <VscError /> {t('toolMessage.error')}
              </span>
            )}
          </div>
          <CopyMessageButton content={rawContentToCopy} className="text-neutral-600 hover:text-neutral-300" />
        </div>
        <pre
          className={`whitespace-pre-wrap max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-700 hover:scrollbar-thumb-neutral-600 bg-neutral-900 p-2 rounded text-[11px] ${
            parsedResult.isError ? 'text-red-400' : 'text-neutral-300'
          }`}
        >
          {displayContent}
        </pre>
      </>
    );
  };

  return (
    <div className="border border-neutral-800 rounded-md mb-2 group p-3 bg-neutral-850">
      {/* Header */}
      <div className="flex items-center justify-between gap-2  cursor-pointer hover:bg-neutral-750 select-none rounded-t-md" onClick={handleHeaderClick}>
        <div className="flex items-center gap-2">
          <div className={`text-neutral-500 ${isExecuting ? 'animate-pulse' : ''}`}>
            <RiToolsFill className="w-4 h-4" />
          </div>
          <div className={`font-medium text-xs text-neutral-100 ${isExecuting ? 'animate-pulse' : ''}`}>
            {t('toolMessage.toolLabel', { server: message.serverName, tool: message.toolName })}
          </div>
          {isExecuting && <CgSpinner className="animate-spin w-3 h-3 text-neutral-400" />}
          {!isExecuting && parsedResult?.isError === true && <VscError className="text-red-500" />}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-neutral-300">{isExpanded ? <MdKeyboardArrowDown size={16} /> : <MdKeyboardArrowRight size={16} />}</div>
        </div>
      </div>

      {/* Content */}
      <div
        className={clsx('overflow-hidden transition-all duration-300 ease-in-out relative', {
          'max-h-0 opacity-0': !isExpanded,
          'max-h-[150px] opacity-100': isExpanded && isInitialAutoExpand, // Initial limited height
          'max-h-[1000px] opacity-100': isExpanded && !isInitialAutoExpand, // Full height after click or initial phase ends
        })}
      >
        {/* Add relative positioning for the gradient overlay */}
        <div className={clsx('p-3 text-xs whitespace-pre-wrap text-neutral-300 bg-neutral-850')}>
          {Object.keys(message.args).length > 0 && (
            <div className="mb-3">
              <div className="font-semibold mb-1 text-neutral-200">{t('toolMessage.arguments')}</div>
              <pre className="whitespace-pre-wrap max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-700 hover:scrollbar-thumb-neutral-600 bg-neutral-900 p-2 rounded text-neutral-300 text-[11px]">
                {JSON.stringify(message.args, null, 2)}
              </pre>
            </div>
          )}
          {isExecuting ? (
            <div className="text-xs italic text-neutral-400">{t('toolMessage.executing')}</div>
          ) : isExpanded && !isInitialAutoExpand ? (
            getResultContent()
          ) : null}
          {/* Gradient overlay for initial auto-expand */}
          {isExpanded && isInitialAutoExpand && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-neutral-850 via-neutral-850 to-transparent pointer-events-none"></div>
          )}
        </div>
      </div>
      <MessageBar content={message.content} usageReport={message.usageReport} removeMessage={onRemove} />
    </div>
  );
};
