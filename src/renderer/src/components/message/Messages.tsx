import { useEffect, useRef, useState, WheelEvent, useImperativeHandle, forwardRef } from 'react';
import { toPng } from 'html-to-image';

import { MessageBlock } from './MessageBlock';

import { Message } from '@/types/message';
import { StyledTooltip } from '@/components/common/StyledTooltip';

export type MessagesRef = {
  exportToImage: () => void;
};

type Props = {
  baseDir: string;
  messages: Message[];
  allFiles?: string[];
  renderMarkdown: boolean;
  removeMessage: (message: Message) => void;
};

export const Messages = forwardRef<MessagesRef, Props>(({ baseDir, messages, allFiles = [], renderMarkdown, removeMessage }, ref) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [scrollingPaused, setScrollingPaused] = useState(false);

  const handleScroll = (e: WheelEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop === element.clientHeight;
    setScrollingPaused(!isAtBottom);
  };

  useEffect(() => {
    if (!scrollingPaused) {
      messagesEndRef.current?.scrollIntoView();
    }
  }, [messages, scrollingPaused]);

  const exportToImage = async () => {
    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer === null) {
      return;
    }

    try {
      const dataUrl = await toPng(messagesContainer, {
        cacheBust: true,
        height: messagesContainer.scrollHeight,
      });
      const link = document.createElement('a');
      link.download = `session-${new Date().toISOString().replace(/:/g, '-').substring(0, 19)}.png`;
      link.href = dataUrl;
      link.click();
      link.remove();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to export chat as PNG', err);
    }
  };

  useImperativeHandle(ref, () => ({
    exportToImage,
  }));

  return (
    <div
      ref={messagesContainerRef}
      className="relative flex flex-col overflow-y-auto max-h-full p-4
      scrollbar-thin
      scrollbar-track-neutral-900
      scrollbar-thumb-neutral-700
      hover:scrollbar-thumb-neutral-600"
      onWheel={handleScroll}
    >
      <StyledTooltip id="usage-info-tooltip" />
      {messages.map((message, index) => (
        <MessageBlock
          key={index}
          baseDir={baseDir}
          message={message}
          allFiles={allFiles}
          renderMarkdown={renderMarkdown}
          removeMessage={() => removeMessage(message)}
          isLastMessage={index === messages.length - 1}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
});

Messages.displayName = 'Messages';
