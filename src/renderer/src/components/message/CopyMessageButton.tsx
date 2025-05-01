import { BiCopy } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';

import { IconButton } from '../common/IconButton';

import { showInfoNotification } from '@/utils/notifications';

type Props = {
  content: string;
  className?: string;
  alwaysShow?: boolean;
};

export const CopyMessageButton = ({ content, className, alwaysShow = false }: Props) => {
  const { t } = useTranslation();
  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    showInfoNotification(t('messages.copied'));
  };

  return (
    <IconButton
      icon={<BiCopy className={`h-4 w-4 ${className}`} />}
      onClick={copyToClipboard}
      tooltip={t('messages.copy')}
      className={alwaysShow ? '' : 'opacity-0 group-hover:opacity-100'}
    />
  );
};
