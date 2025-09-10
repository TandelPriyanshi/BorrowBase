import React from "react";

interface ModalProps {
    children: React.ReactNode;
    onClose: () => void;
}

const Modal = ({ children, onClose }: ModalProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur and overlay */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 cursor-pointer"
            />

            {/* Modal content */}
            <div className="relative z-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
                {children}
            </div>
        </div>
    );
};

export default Modal;
