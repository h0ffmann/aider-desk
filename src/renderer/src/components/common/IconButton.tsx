import { MouseEvent, ReactNode, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { StyledTooltip } from './StyledTooltip';

type Props = {
  icon: ReactNode;
  onClick: () => void;
  tooltip?: ReactNode;
  className?: string;
  tooltipId?: string;
};

export const IconButton = ({ icon, onClick, tooltip, className, tooltipId }: Props) => {
  const tooltipIdRef = useRef<string>(tooltipId || `icon-button-tooltip-${uuidv4()}`);

  const baseClasses = 'text-neutral-500 cursor-pointer hover:text-neutral-300 transition-opacity focus:outline-none';
  const combinedClassName = `${baseClasses} ${className || ''}`;

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onClick();
  };

  const renderButton = () => (
    <div onClick={handleClick} data-tooltip-id={tooltip ? tooltipIdRef.current : undefined} className={combinedClassName}>
      {icon}
    </div>
  );

  return (
    <>
      {renderButton()}
      {tooltip && !tooltipId && <StyledTooltip id={tooltipIdRef.current} content={tooltip} />}
    </>
  );
};
