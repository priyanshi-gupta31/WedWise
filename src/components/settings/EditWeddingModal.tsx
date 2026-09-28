import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useWedding } from '../../context/WeddingContext';
import { useToast } from '../../context/ToastContext';
import { Wedding } from '../../types/database.types';

interface EditWeddingModalProps {
  wedding: Wedding | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditWeddingModal: React.FC<EditWeddingModalProps> = ({ wedding, isOpen, onClose }) => {
  const { updateWedding } = useWedding();
  const { showToast } = useToast();

  const [weddingName, setWeddingName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (wedding) {
      setWeddingName(wedding.wedding_name);
      setBrideName(wedding.bride_name);
      setGroomName(wedding.groom_name);
      setWeddingDate(wedding.wedding_date);
    }
  }, [wedding, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weddingName.trim() || !brideName.trim() || !groomName.trim() || !weddingDate) {
      showToast('Please fill all required wedding details', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateWedding({
        wedding_name: weddingName.trim(),
        bride_name: brideName.trim(),
        groom_name: groomName.trim(),
        wedding_date: weddingDate,
      });
      showToast('Wedding details updated successfully! 💍', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to update wedding details', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Wedding Details"
      subtitle="Update couple names and celebration date"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#77716A] uppercase tracking-wider mb-1.5">
            Wedding Title
          </label>
          <input
            type="text"
            required
            value={weddingName}
            onChange={(e) => setWeddingName(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#E9E1D7] rounded-xl text-[#262421] focus:outline-none focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C] transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#77716A] uppercase tracking-wider mb-1.5">
              Bride Name
            </label>
            <input
              type="text"
              required
              value={brideName}
              onChange={(e) => setBrideName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#E9E1D7] rounded-xl text-[#262421] focus:outline-none focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#77716A] uppercase tracking-wider mb-1.5">
              Groom Name
            </label>
            <input
              type="text"
              required
              value={groomName}
              onChange={(e) => setGroomName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#E9E1D7] rounded-xl text-[#262421] focus:outline-none focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#77716A] uppercase tracking-wider mb-1.5">
            Wedding Date
          </label>
          <input
            type="date"
            required
            value={weddingDate}
            onChange={(e) => setWeddingDate(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#E9E1D7] rounded-xl text-[#262421] focus:outline-none focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C] transition-colors"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="flex-1">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
