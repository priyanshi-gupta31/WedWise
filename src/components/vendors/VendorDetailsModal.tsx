import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useWedding } from '../../context/WeddingContext';
import { useToast } from '../../context/ToastContext';
import {
  Vendor,
  VendorPayment,
} from '../../types/vendor';
import {
  calculateVendorAttentionState,
  getDerivedPaymentStatus,
} from '../../utils/vendorUtils';
import {
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Calendar,
  Clock,
  IndianRupee,
  FileText,
  Trash2,
  Edit2,
  Plus,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

interface VendorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  onEditVendor: (vendor: Vendor) => void;
  onRecordPayment: (vendor: Vendor) => void;
  onAddDocument: (vendor: Vendor) => void;
  onEditPayment: (vendor: Vendor, payment: VendorPayment) => void;
}

export const VendorDetailsModal: React.FC<VendorDetailsModalProps> = ({
  isOpen,
  onClose,
  vendor,
  onEditVendor,
  onRecordPayment,
  onAddDocument,
  onEditPayment,
}) => {
  const {
    events,
    vendorPayments,
    vendorDocuments,
    deleteVendorPayment,
    deleteVendorDocument,
    deleteVendor,
  } = useWedding();
  const { showToast } = useToast();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [preserveExpenses, setPreserveExpenses] = useState(true);

  if (!vendor) return null;

  const linkedEvent = events.find((e) => e.id === vendor.event_id);
  const payments = vendorPayments.filter((p) => p.vendor_id === vendor.id);
  const documents = vendorDocuments.filter((d) => d.vendor_id === vendor.id);

  const attention = calculateVendorAttentionState(vendor);
  const paymentStatus = getDerivedPaymentStatus(vendor);

  const agreed = Number(vendor.agreed_amount) || 0;
  const paid = Number(vendor.paid_amount) || 0;
  const remaining = Number(vendor.remaining_amount) || 0;
  const paidPercent = agreed > 0 ? Math.min(100, Math.round((paid / agreed) * 100)) : 0;

  // Contact helpers
  const cleanPhone = vendor.phone ? vendor.phone.replace(/[^0-9+]/g, '') : null;
  const cleanWhatsapp = vendor.whatsapp
    ? vendor.whatsapp.replace(/[^0-9+]/g, '')
    : cleanPhone;

  const whatsappUrl = cleanWhatsapp
    ? `https://wa.me/${cleanWhatsapp.replace('+', '')}?text=${encodeURIComponent(
        `Namaste ${vendor.contact_person || vendor.vendor_name}, regarding wedding preparations:`
      )}`
    : null;

  const handleDeletePayment = async (payment: VendorPayment) => {
    if (
      !window.confirm(
        `Are you sure you want to remove this ₹${Number(
          payment.amount
        ).toLocaleString('en-IN')} payment? The linked wedding expense will also be removed to preserve budget invariants.`
      )
    ) {
      return;
    }

    try {
      await deleteVendorPayment(payment.id);
      showToast('Payment record and linked expense removed.', 'info');
    } catch (err) {
      console.error('Failed to delete vendor payment:', err);
      showToast('Could not delete payment.', 'error');
    }
  };

  const handleDeleteDocument = async (docId: string, name: string) => {
    if (!window.confirm(`Delete document "${name}"?`)) return;
    try {
      await deleteVendorDocument(docId);
      showToast('Document detached.', 'info');
    } catch (err) {
      console.error('Failed to delete document:', err);
      showToast('Could not delete document.', 'error');
    }
  };

  const handleConfirmDeleteVendor = async () => {
    setIsDeleting(true);
    try {
      await deleteVendor(vendor.id, preserveExpenses);
      showToast(
        preserveExpenses
          ? `Vendor "${vendor.vendor_name}" removed. Historical expenses were preserved in your ledger.`
          : `Vendor "${vendor.vendor_name}" and associated records removed.`,
        'info'
      );
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error('Failed to delete vendor:', err);
      showToast('Could not delete vendor.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vendor.vendor_name}
      subtitle={`${vendor.category} • ${vendor.status}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* ATTENTION BANNER IF ACTION REQUIRED */}
        {attention !== 'All Clear' && (
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between text-xs animate-fade-in ${
              attention === 'Payment Due'
                ? 'bg-[#FFF5F5] border-[#C93B2B]/30 text-[#9E2A2B]'
                : attention === 'Follow Up'
                ? 'bg-[#FFF7E8] border-[#E89838]/40 text-[#9E5D0A]'
                : 'bg-[#F9F5F0] border-[#E8DFD5] text-[#7C6B7E]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <div>
                <span className="font-bold">{attention}</span>
                {attention === 'Payment Due' && vendor.payment_due_date && (
                  <span className="ml-1 text-[11px] opacity-80">
                    (Due: {vendor.payment_due_date})
                  </span>
                )}
                {attention === 'Follow Up' && vendor.next_follow_up_date && (
                  <span className="ml-1 text-[11px] opacity-80">
                    (Scheduled: {vendor.next_follow_up_date})
                  </span>
                )}
              </div>
            </div>
            {attention === 'Payment Due' && (
              <button
                onClick={() => onRecordPayment(vendor)}
                className="px-2.5 py-1 bg-[#641F35] text-white text-[11px] font-bold rounded-lg hover:bg-[#50182A] transition-colors"
              >
                Pay Now
              </button>
            )}
          </div>
        )}

        {/* 1. QUICK CONTACT ACTIONS */}
        <div className="p-3 bg-[#F9F5F0] border border-[#E8DFD5] rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#16162A] truncate">
              {vendor.contact_person ? `${vendor.contact_person}` : 'Vendor Contact'}
            </p>
            {vendor.phone && (
              <p className="text-[11px] text-[#7C6B7E] font-medium">{vendor.phone}</p>
            )}
            {linkedEvent && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-[#E8DFD5]/50 text-[#641F35] text-[10px] font-bold rounded-md">
                Ceremony: {linkedEvent.event_name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {cleanPhone && (
              <a
                href={`tel:${cleanPhone}`}
                className="px-2.5 py-1.5 bg-white border border-[#E8DFD5] hover:border-[#641F35] text-[#16162A] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 text-[#2C6E49]" />
                Call
              </a>
            )}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C7E] hover:bg-[#25D366]/20 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            )}
            {vendor.email && (
              <a
                href={`mailto:${vendor.email}`}
                className="px-2.5 py-1.5 bg-white border border-[#E8DFD5] hover:border-[#641F35] text-[#16162A] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Mail className="w-3.5 h-3.5 text-[#641F35]" />
                Email
              </a>
            )}
          </div>
        </div>

        {/* 2. FINANCIAL DOSSIER & PROGRESS PACING */}
        <div className="p-4 bg-white border border-[#E8DFD5] rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#641F35] flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5" />
              Contract Financials
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                paymentStatus === 'Fully Paid'
                  ? 'bg-[#2C6E49]/10 text-[#2C6E49]'
                  : paymentStatus === 'Partially Paid'
                  ? 'bg-[#E89838]/15 text-[#9E5D0A]'
                  : 'bg-[#C93B2B]/10 text-[#C93B2B]'
              }`}
            >
              {paymentStatus}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-1">
            <div className="p-2 bg-[#F9F5F0] rounded-xl">
              <p className="text-[10px] uppercase font-bold text-[#7C6B7E]">Agreed</p>
              <p className="text-sm font-bold text-[#16162A] mt-0.5">
                ₹{agreed.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-2 bg-[#F9F5F0] rounded-xl">
              <p className="text-[10px] uppercase font-bold text-[#2C6E49]">Paid</p>
              <p className="text-sm font-bold text-[#2C6E49] mt-0.5">
                ₹{paid.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-2 bg-[#F9F5F0] rounded-xl">
              <p className="text-[10px] uppercase font-bold text-[#C93B2B]">Remaining</p>
              <p className="text-sm font-bold text-[#C93B2B] mt-0.5">
                ₹{remaining.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* PACING PROGRESS BAR */}
          {agreed > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-medium text-[#7C6B7E]">
                <span>Payment Pacing</span>
                <span>{paidPercent}% settled</span>
              </div>
              <div className="w-full h-2 bg-[#E8DFD5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2C6E49] rounded-full transition-all duration-500"
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-1 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRecordPayment(vendor)}
              className="w-full text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-[#641F35]" />
              Record New Payment
            </Button>
          </div>
        </div>

        {/* 3. PAYMENT HISTORY (CHRONOLOGICAL) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#16162A]">
              Payment History ({payments.length})
            </h4>
            <span className="text-[10px] text-[#7C6B7E]">Linked 1:1 to wedding ledger</span>
          </div>

          {payments.length === 0 ? (
            <div className="p-4 bg-[#F9F5F0] rounded-xl text-center text-xs text-[#7C6B7E]">
              No payments recorded yet for {vendor.vendor_name}.
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-white border border-[#E8DFD5] rounded-xl flex items-center justify-between gap-3 text-xs shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#16162A] text-sm">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </span>
                      <span className="px-1.5 py-0.5 bg-[#F9F5F0] text-[#641F35] font-semibold text-[10px] rounded">
                        {p.payment_method}
                      </span>
                      <span className="text-[11px] text-[#7C6B7E]">
                        by <strong>{p.paid_by}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#7C6B7E]">
                      <Calendar className="w-3 h-3" />
                      <span>{p.payment_date}</span>
                      {p.notes && <span className="truncate italic">• {p.notes}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditPayment(vendor, p)}
                      title="Edit payment"
                      className="p-1.5 text-[#7C6B7E] hover:text-[#641F35] hover:bg-[#F9F5F0] rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePayment(p)}
                      title="Delete payment"
                      className="p-1.5 text-[#7C6B7E] hover:text-[#C93B2B] hover:bg-[#FFF5F5] rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. LINKED CONTRACTS & DOCUMENTS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#16162A]">
              Documents & Receipts ({documents.length})
            </h4>
            <button
              onClick={() => onAddDocument(vendor)}
              className="text-xs font-bold text-[#641F35] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Document
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="p-3 bg-[#F9F5F0] rounded-xl text-center text-xs text-[#7C6B7E]">
              No documents attached yet. Click above to attach contracts, quotes or receipts.
            </div>
          ) : (
            <div className="space-y-1.5">
              {documents.map((d) => (
                <div
                  key={d.id}
                  className="p-2.5 bg-white border border-[#E8DFD5] rounded-xl flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#641F35] flex-shrink-0" />
                    <div className="truncate">
                      <p className="font-semibold text-[#16162A] truncate">{d.document_name}</p>
                      <p className="text-[10px] text-[#7C6B7E]">
                        {d.document_type} • {d.uploaded_date}
                        {d.notes ? ` • ${d.notes}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {d.file_reference && d.file_reference.startsWith('http') && (
                      <a
                        href={d.file_reference}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-[#641F35] hover:bg-[#F9F5F0] rounded-lg transition-colors"
                        title="Open document link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteDocument(d.id, d.document_name)}
                      className="p-1.5 text-[#7C6B7E] hover:text-[#C93B2B] hover:bg-[#FFF5F5] rounded-lg transition-colors"
                      title="Detach document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. NOTES & SERVICE DESCRIPTION */}
        {(vendor.notes || vendor.service_description) && (
          <div className="p-3 bg-[#F9F5F0] rounded-xl text-xs space-y-1 text-[#7C6B7E]">
            {vendor.service_description && (
              <p className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#641F35] flex-shrink-0 mt-0.5" />
                <span>{vendor.service_description}</span>
              </p>
            )}
            {vendor.notes && (
              <p className="italic pt-1 border-t border-[#E8DFD5]/50">
                "{vendor.notes}"
              </p>
            )}
          </div>
        )}

        {/* 6. DELETE VENDOR CONFIRMATION MODAL / OVERLAY */}
        {showDeleteConfirm && (
          <div className="p-4 bg-[#FFF5F5] border border-[#C93B2B]/40 rounded-2xl space-y-3 animate-fade-in">
            <div className="flex items-start gap-2 text-[#9E2A2B]">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">Remove "{vendor.vendor_name}"?</p>
                <p className="text-[11px] text-[#7C2D37] mt-0.5">
                  Choose how you want to handle existing financial transactions recorded for this vendor.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-[#16162A]">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="deleteOption"
                  checked={preserveExpenses}
                  onChange={() => setPreserveExpenses(true)}
                  className="text-[#641F35] focus:ring-[#641F35]"
                />
                <span>Preserve expenses in wedding ledger (recommended — keeps historical spend exact)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="deleteOption"
                  checked={!preserveExpenses}
                  onChange={() => setPreserveExpenses(false)}
                  className="text-[#C93B2B] focus:ring-[#C93B2B]"
                />
                <span>Cascade delete all payments and linked expenses from total budget</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDeleteVendor}
                disabled={isDeleting}
              >
                {isDeleting ? 'Removing...' : 'Confirm Remove'}
              </Button>
            </div>
          </div>
        )}

        {/* MODAL FOOTER */}
        <div className="pt-2 flex items-center justify-between border-t border-[#E8DFD5]">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs font-semibold text-[#C93B2B] hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove Vendor
          </button>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onEditVendor(vendor)}>
              <Edit2 className="w-3.5 h-3.5 mr-1" />
              Edit Details
            </Button>
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
