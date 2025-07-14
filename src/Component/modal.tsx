import React from "react";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

const Modal = ({ children, onClose }: ModalProps) => {
  return (
    <div className="fixed inset-0 z-50 bg-gray-200 flex items-center justify-center">
      <div onClick={onClose} className="absolute inset-0" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default Modal;
