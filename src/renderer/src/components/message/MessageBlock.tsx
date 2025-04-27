import { CommandOutputMessageBlock } from './CommandOutputMessageBlock';
import { LoadingMessageBlock } from './LoadingMessageBlock';
import { LogMessageBlock } from './LogMessageBlock';
import { UserMessageBlock } from './UserMessageBlock';
import { ReflectedMessageBlock } from './ReflectedMessageBlock';
import { ResponseMessageBlock } from './ResponseMessageBlock';

import {
  isCommandOutputMessage,
  isLogMessage,
  isLoadingMessage,
  isUserMessage,
  isReflectedMessage,
  isResponseMessage,
  Message,
  isToolMessage,
} from '@/types/message';
import { ToolMessageBlock } from '@/components/message/ToolMessageBlock';

type Props = {
  baseDir: string;
  message: Message;
  allFiles: string[];
  renderMarkdown: boolean;
};

export const MessageBlock = ({ baseDir, message, allFiles, renderMarkdown }: Props) => {
  if (isLoadingMessage(message)) {
    return <LoadingMessageBlock message={message} />;
  }

  if (isLogMessage(message)) {
    return <LogMessageBlock message={message} />;
  }

  if (isReflectedMessage(message)) {
    return <ReflectedMessageBlock baseDir={baseDir} message={message} allFiles={allFiles} renderMarkdown={renderMarkdown} />;
  }

  if (isCommandOutputMessage(message)) {
    return <CommandOutputMessageBlock message={message} />;
  }

  if (isUserMessage(message)) {
    return <UserMessageBlock baseDir={baseDir} message={message} allFiles={allFiles} renderMarkdown={renderMarkdown} />;
  }

  if (isResponseMessage(message)) {
    return <ResponseMessageBlock baseDir={baseDir} message={message} allFiles={allFiles} renderMarkdown={renderMarkdown} />;
  }

  if (isToolMessage(message)) {
    return <ToolMessageBlock message={message} />;
  }

  return null;
};
