import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useWedding } from '../../context/WeddingContext';
import { useToast } from '../../context/ToastContext';
import {
  Vendor,
  VendorDocumentFormData,
  VendorDocumentType,
} from '../../types/vendor';
import { VENDOR_DOCUMENT_TYPES } from '../../constants/vendorConstants';
import {
  FileText,
  Calendar,
  Link as LinkIcon,
  Tag,
} from 'lucide-react';

interface VendorDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
}

export const VendorDocumentModal: React.FC<VendorDocumentModalProps> = ({
  isOpen,
  onClose,
  vendor,
}) => {
  const { addVendorDocument } = useWedding();
  const { showToast } = useToast();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState<VendorDocumentType>('Contract');
  const [fileReference, setFileReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setDocumentName('');
      setDocumentType('Contract');
      setFileReference('');
      setNotes('');
      setErrors({});
      setTimeout(() => nameInputRef.current?.focus(), 150);
    }
  }, [isOpen, vendor]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!documentName.trim()) {
      errs.documentName = 'Document title is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: VendorDocumentFormData = {
        document_name: documentName.trim(),
        document_type: documentType,
        file_reference: fileReference.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      await addVendorDocument(vendor.id, payload);
      showToast(`Document "${payload.document_name}" attached to ${vendor.vendor_name}! 📄`, 'success');
      onClose();
    } catch (err) {
      console.error('Failed to attach document:', err);
      showToast('Could not attach document. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Attach Document — ${vendor.vendor_name}`}
      subtitle="Keep contracts, invoices, quotes and briefs organized in one place"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* TITLE */}
        <div>
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
            Document Title <span className="text-[#C93B2B]">*</span>
          </label>
          <div className="relative">
            <FileText className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={nameInputRef}
              type="text"
              required
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g. Sangeet Stage Agreement, 25% Advance GST Invoice"
              className={`w-full pl-8 pr-3 py-2 text-sm bg-[#FFFDF9] border rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35] ${
                errors.documentName ? 'border-[#C93B2B] bg-[#FFF5F5]' : 'border-[#E8DFD5]'
              }`}
            />
          </div>
          {errors.documentName && <p className="text-xs text-[#C93B2B] mt-0.5">{errors.documentName}</p>}
        </div>

        {/* DOCUMENT TYPE */}
        <div>
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
            Document Type
          </label>
          <div className="relative">
            <Tag className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as VendorDocumentType)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] font-medium focus:outline-none focus:border-[#641F35]"
            >
              {VENDOR_DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* FILE URL / REFERENCE */}
        <div>
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
            Cloud Link / Drive URL / Locker Ref (Optional)
          </label>
          <div className="relative">
            <LinkIcon className="w-3.5 h-3.5 text-[#8C7A8E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={fileReference}
              onChange={(e) => setFileReference(e.target.value)}
              placeholder="https://drive.google.com/... or Physical Folder 2"
              className="w-full pl-8 pr-3 py-2 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35]"
            />
          </div>
        </div>

        {/* NOTES */}
        <div>
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
            Notes / Storage Location
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Original signed hard copy stored in Red Wedding Folder, Drawer 2"
            className="w-full p-2.5 text-sm bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35] resize-none"
          />
        </div>

        {/* ACTIONS */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E8DFD5]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Attaching...' : 'Attach Document'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
