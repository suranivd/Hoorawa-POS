import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const AdminVerificationModal = ({ isOpen, onClose, onVerified, title = "Admin Verification Required", message = "This action requires administrative privileges. Please verify your credentials." }) => {
    const { user } = useAuthStore();
    const [password, setPassword] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const isCurrentUserAdmin = user?.role === 'admin';

    const handleVerify = async (e) => {
        e.preventDefault();
        
        if (!password) {
            toast.error('Password is required');
            return;
        }

        if (!isCurrentUserAdmin && !adminEmail) {
            toast.error('Admin email is required');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/auth/verify-admin', {
                password,
                adminEmail: isCurrentUserAdmin ? undefined : adminEmail
            });

            if (response.data.success) {
                toast.success('Verified successfully');
                onVerified(response.data.data);
                onClose();
                // Reset form
                setPassword('');
                setAdminEmail('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                    <ShieldCheck size={24} />
                    <p className="text-sm font-medium">{message}</p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                    {!isCurrentUserAdmin && (
                        <Input
                            label="Admin Email"
                            type="email"
                            placeholder="Enter admin email"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            required
                        />
                    )}
                    
                    <Input
                        label={isCurrentUserAdmin ? "Your Password" : "Admin Password"}
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" isLoading={isLoading}>
                            Verify & Proceed
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default AdminVerificationModal;
