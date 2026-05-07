import { useState, useCallback } from 'react';

export const useAdminVerify = () => {
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [onVerifySuccess, setOnVerifySuccess] = useState(null);
    const [verifyConfig, setVerifyConfig] = useState({ title: '', message: '' });

    const requestAdminVerify = useCallback((callback, config = {}) => {
        setOnVerifySuccess(() => callback);
        setVerifyConfig({
            title: config.title || "Admin Verification Required",
            message: config.message || "This action requires administrative privileges. Please verify your credentials."
        });
        setIsVerifyModalOpen(true);
    }, []);

    const handleVerified = (adminData) => {
        if (onVerifySuccess) {
            onVerifySuccess(adminData);
        }
        setIsVerifyModalOpen(false);
    };

    const closeVerifyModal = () => {
        setIsVerifyModalOpen(false);
        setOnVerifySuccess(null);
    };

    return {
        isVerifyModalOpen,
        requestAdminVerify,
        handleVerified,
        closeVerifyModal,
        verifyConfig
    };
};
