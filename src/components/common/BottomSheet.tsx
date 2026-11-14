import React from 'react';
import { Modal } from './Modal';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: string;
  showGrabber?: boolean;
  className?: string;
  scrollable?: boolean;
  footer?: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  showGrabber = true,
  className = '',
  footer,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      showGrabber={showGrabber}
      className={className}
      footer={footer}
    >
      {children}
    </Modal>
  );
};
