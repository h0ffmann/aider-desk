import { useRef, useState } from 'react';
import { FaArrowDown, FaArrowUp, FaDollarSign, FaEllipsisVertical } from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';
import { UsageReportData } from '@common/types';
import { MdDeleteForever } from 'react-icons/md';

import { useClickOutside } from '../../hooks/useClickOutside';
import { IconButton } from '../common/IconButton';

import { CopyMessageButton } from './CopyMessageButton';

type Props = {
  content: string;
  usageReport?: UsageReportData;
  removeMessage?: () => void;
};

export const MessageBar = ({ content, usageReport, removeMessage }: Props) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useClickOutside([menuRef, buttonRef], () => {
    setIsMenuOpen(false);
  });

  const handleRemoveClick = () => {
    removeMessage?.();
    setIsMenuOpen(false);
  };

  return (
    <div className="mt-3 pt-3 h-[30px] flex items-center justify-end gap-2 border-t border-neutral-800 px-1 relative">
      {usageReport && (
        <div className="mt-[4px] flex items-center gap-3 px-2 text-xxs text-neutral-500 group-hover:text-neutral-200 transition-colors">
          <span className="flex items-center gap-1" data-tooltip-id="usage-info-tooltip" data-tooltip-content={t('responseMessage.inputTokens')}>
            <FaArrowUp className="w-2.5 h-2.5 mb-[3px]" /> {usageReport.sentTokens}
          </span>
          <span className="flex items-center gap-1" data-tooltip-id="usage-info-tooltip" data-tooltip-content={t('responseMessage.outputTokens')}>
            <FaArrowDown className="w-2.5 h-2.5 mb-[3px]" /> {usageReport.receivedTokens}
          </span>
          {usageReport.messageCost > 0 && (
            <span className="flex items-center gap-1">
              <FaDollarSign className="w-2.5 h-2.5 mb-[3px]" /> {usageReport.messageCost.toFixed(5)}
            </span>
          )}
        </div>
      )}
      <CopyMessageButton content={content} className="transition-colors text-neutral-700 hover:text-neutral-100" alwaysShow={true} />
      {removeMessage && (
        <div ref={buttonRef}>
          <IconButton
            icon={<FaEllipsisVertical className="w-4 h-4" />}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="transition-colors text-neutral-700 hover:text-neutral-100"
          />
        </div>
      )}
      {isMenuOpen && removeMessage && (
        <div ref={menuRef} className="absolute right-0 bottom-full  w-[120px] bg-neutral-800 border border-neutral-700 rounded shadow-lg z-10">
          <ul>
            <li
              className="flex items-center gap-1 px-2 py-1 text-xxs text-neutral-100 hover:bg-neutral-700 cursor-pointer transition-colors"
              onClick={handleRemoveClick}
            >
              <MdDeleteForever className="w-4 h-4" />
              <span className="whitespace-nowrap mb-[-4px]">{t('message.delete')}</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
