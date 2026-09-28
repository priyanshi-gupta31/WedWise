import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  Vendor,
  VendorFormData,
  VendorPayment,
  VendorPaymentFormData,
  VendorDocument,
  VendorDocumentFormData,
} from '../types/vendor';
import { Expense } from '../types/database.types';
import { localStore } from './localStore';
import { mapVendorCategoryToExpenseCategoryId } from '../utils/vendorUtils';

export const vendorService = {
  // -------------------------------------------------------------
  // VENDORS CRUD
  // -------------------------------------------------------------
  async getVendors(weddingId: string): Promise<Vendor[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_vendors')
          .select('*')
          .eq('wedding_id', weddingId)
          .order('vendor_name', { ascending: true });

        if (!error && data) {
          return data as Vendor[];
        }
      } catch (err) {
        console.warn('Supabase fetch vendors error, falling back to local storage:', err);
      }
    }

    return localStore.getVendors(weddingId);
  },

  async addVendor(
    weddingId: string,
    formData: VendorFormData
  ): Promise<Vendor> {
    const agreedAmount = Number(formData.agreed_amount) || 0;
    const initialAdvance = Number(formData.advance_amount) || 0;

    const payload = {
      wedding_id: weddingId,
      vendor_name: formData.vendor_name.trim(),
      category: formData.category,
      event_id: formData.event_id || null,
      contact_person: formData.contact_person ? formData.contact_person.trim() : null,
      phone: formData.phone ? formData.phone.trim() : null,
      whatsapp: formData.whatsapp ? formData.whatsapp.trim() : null,
      email: formData.email ? formData.email.trim() : null,
      service_description: formData.service_description ? formData.service_description.trim() : null,
      status: formData.status || 'Contacted',
      agreed_amount: agreedAmount,
      advance_amount: initialAdvance,
      paid_amount: 0,
      remaining_amount: agreedAmount,
      next_follow_up_date: formData.next_follow_up_date || null,
      contract_due_date: formData.contract_due_date || null,
      payment_due_date: formData.payment_due_date || null,
      notes: formData.notes ? formData.notes.trim() : null,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: newVendor, error } = await supabase
          .from('wedding_vendors')
          .insert(payload)
          .select()
          .single();

        if (!error && newVendor) {
          if (initialAdvance > 0) {
            await this.addVendorPayment(
              weddingId,
              newVendor.id,
              {
                amount: initialAdvance,
                payment_date: new Date().toISOString().split('T')[0],
                paid_by: 'Host Family',
                payment_method: 'UPI',
                notes: `Advance token deposit for ${newVendor.vendor_name}`,
              }
            );
            newVendor.paid_amount = initialAdvance;
            newVendor.remaining_amount = Math.max(0, agreedAmount - initialAdvance);
          }
          return newVendor as Vendor;
        }
      } catch (err) {
        console.warn('Supabase add vendor error, using local fallback:', err);
      }
    }

    return localStore.addVendor(payload);
  },

  async updateVendor(
    vendorId: string,
    formData: Partial<VendorFormData>
  ): Promise<Vendor | null> {
    const updates: Partial<Vendor> = {};
    if (formData.vendor_name !== undefined) updates.vendor_name = formData.vendor_name.trim();
    if (formData.category !== undefined) updates.category = formData.category;
    if (formData.event_id !== undefined) updates.event_id = formData.event_id || null;
    if (formData.contact_person !== undefined)
      updates.contact_person = formData.contact_person ? formData.contact_person.trim() : null;
    if (formData.phone !== undefined)
      updates.phone = formData.phone ? formData.phone.trim() : null;
    if (formData.whatsapp !== undefined)
      updates.whatsapp = formData.whatsapp ? formData.whatsapp.trim() : null;
    if (formData.email !== undefined)
      updates.email = formData.email ? formData.email.trim() : null;
    if (formData.service_description !== undefined)
      updates.service_description = formData.service_description ? formData.service_description.trim() : null;
    if (formData.status !== undefined) updates.status = formData.status;
    if (formData.agreed_amount !== undefined)
      updates.agreed_amount = Number(formData.agreed_amount) || 0;
    if (formData.next_follow_up_date !== undefined)
      updates.next_follow_up_date = formData.next_follow_up_date || null;
    if (formData.contract_due_date !== undefined)
      updates.contract_due_date = formData.contract_due_date || null;
    if (formData.payment_due_date !== undefined)
      updates.payment_due_date = formData.payment_due_date || null;
    if (formData.notes !== undefined)
      updates.notes = formData.notes ? formData.notes.trim() : null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('wedding_vendors')
          .update(updates)
          .eq('id', vendorId)
          .select()
          .single();

        if (!error && data) {
          return data as Vendor;
        }
      } catch (err) {
        console.warn('Supabase update vendor error, using local fallback:', err);
      }
    }

    return localStore.updateVendor(vendorId, updates);
  },

  async deleteVendor(
    vendorId: string,
    preserveExpenses: boolean = true
  ): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        if (preserveExpenses) {
          // Unlink expenses rather than deleting financial history
          await supabase
            .from('expenses')
            .update({ vendor_id: null })
            .eq('vendor_id', vendorId);
        } else {
          await supabase.from('vendor_payments').delete().eq('vendor_id', vendorId);
          await supabase.from('expenses').delete().eq('vendor_id', vendorId);
        }
        await supabase.from('vendor_documents').delete().eq('vendor_id', vendorId);
        const { error } = await supabase
          .from('wedding_vendors')
          .delete()
          .eq('id', vendorId);

        if (!error) return true;
      } catch (err) {
        console.warn('Supabase delete vendor error, using local fallback:', err);
      }
    }

    const res = localStore.deleteVendor(vendorId, preserveExpenses);
    return res.success;
  },

  // -------------------------------------------------------------
  // VENDOR PAYMENTS (1-TO-1 IDEMPOTENT EXPENSE INTEGRATION)
  // -------------------------------------------------------------
  async getVendorPayments(vendorId?: string, weddingId?: string): Promise<VendorPayment[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('vendor_payments').select('*');
        if (weddingId) query = query.eq('wedding_id', weddingId);
        if (vendorId) query = query.eq('vendor_id', vendorId);
        const { data, error } = await query.order('payment_date', { ascending: false });

        if (!error && data) {
          return data as VendorPayment[];
        }
      } catch (err) {
        console.warn('Supabase fetch vendor payments error, falling back to local storage:', err);
      }
    }

    return localStore.getVendorPayments(vendorId, weddingId);
  },

  async addVendorPayment(
    weddingId: string,
    vendorId: string,
    formData: VendorPaymentFormData
  ): Promise<{ payment: VendorPayment; expense: Expense }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: vendor } = await supabase
          .from('wedding_vendors')
          .select('*')
          .eq('id', vendorId)
          .single();

        const amount = Number(formData.amount);
        const paymentDate = formData.payment_date || new Date().toISOString().split('T')[0];
        const vendorName = vendor?.vendor_name || 'Vendor';

        const paymentPayload = {
          wedding_id: weddingId,
          vendor_id: vendorId,
          amount,
          payment_date: paymentDate,
          paid_by: formData.paid_by || 'Family',
          payment_method: formData.payment_method || 'Bank Transfer',
          notes: formData.notes ? formData.notes.trim() : null,
        };

        const { data: newPayment, error: paymentError } = await supabase
          .from('vendor_payments')
          .insert(paymentPayload)
          .select()
          .single();

        if (!paymentError && newPayment) {
          const { data: allCategories } = await supabase
            .from('categories')
            .select('*')
            .eq('wedding_id', weddingId);

          const matchedCatId = vendor?.category && allCategories
            ? mapVendorCategoryToExpenseCategoryId(vendor.category, allCategories)
            : null;

          const expensePayload = {
            wedding_id: weddingId,
            vendor_id: vendorId,
            vendor_payment_id: newPayment.id,
            category_id: matchedCatId,
            event_id: vendor?.event_id || null,
            expense_name: formData.custom_title || `${vendorName} Payment`,
            amount,
            paid_by: newPayment.paid_by,
            payment_method: newPayment.payment_method,
            payment_status: 'Paid',
            expense_date: paymentDate,
            notes: formData.notes || `Vendor payment to ${vendorName}`,
          };

          const { data: newExpense, error: expError } = await supabase
            .from('expenses')
            .insert(expensePayload)
            .select()
            .single();

          if (!expError && newExpense) {
            await supabase
              .from('vendor_payments')
              .update({ expense_id: newExpense.id })
              .eq('id', newPayment.id);
            newPayment.expense_id = newExpense.id;

            const { data: allVPayments } = await supabase
              .from('vendor_payments')
              .select('amount')
              .eq('vendor_id', vendorId);
            const totalPaid = (allVPayments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
            const agreed = Number(vendor?.agreed_amount) || 0;
            await supabase
              .from('wedding_vendors')
              .update({
                paid_amount: totalPaid,
                remaining_amount: Math.max(0, agreed - totalPaid),
              })
              .eq('id', vendorId);

            return { payment: newPayment as VendorPayment, expense: newExpense as Expense };
          }
        }
      } catch (err) {
        console.warn('Supabase add vendor payment error, using local fallback:', err);
      }
    }

    return localStore.addVendorPayment({
      wedding_id: weddingId,
      vendor_id: vendorId,
      amount: Number(formData.amount),
      payment_date: formData.payment_date || new Date().toISOString().split('T')[0],
      paid_by: formData.paid_by || 'Family',
      payment_method: formData.payment_method || 'Bank Transfer',
      notes: formData.notes ? formData.notes.trim() : null,
    });
  },

  async updateVendorPayment(
    paymentId: string,
    formData: Partial<VendorPaymentFormData>
  ): Promise<{ payment: VendorPayment; expense: Expense } | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const paymentUpdates: Partial<VendorPayment> = {};
        if (formData.amount !== undefined) paymentUpdates.amount = Number(formData.amount);
        if (formData.payment_date !== undefined) paymentUpdates.payment_date = formData.payment_date;
        if (formData.paid_by !== undefined) paymentUpdates.paid_by = formData.paid_by;
        if (formData.payment_method !== undefined)
          paymentUpdates.payment_method = formData.payment_method;
        if (formData.notes !== undefined)
          paymentUpdates.notes = formData.notes ? formData.notes.trim() : null;

        const { data: updatedPayment, error: pError } = await supabase
          .from('vendor_payments')
          .update(paymentUpdates)
          .eq('id', paymentId)
          .select()
          .single();

        if (!pError && updatedPayment) {
          const expenseUpdates: Partial<Expense> = {};
          if (formData.amount !== undefined) expenseUpdates.amount = Number(formData.amount);
          if (formData.payment_date !== undefined) expenseUpdates.expense_date = formData.payment_date;
          if (formData.paid_by !== undefined) expenseUpdates.paid_by = formData.paid_by;
          if (formData.payment_method !== undefined)
            expenseUpdates.payment_method = formData.payment_method;
          if (formData.notes !== undefined)
            expenseUpdates.notes = formData.notes ? formData.notes.trim() : null;

          const { data: updatedExpense } = await supabase
            .from('expenses')
            .update(expenseUpdates)
            .eq('vendor_payment_id', paymentId)
            .select()
            .single();

          const { data: allVPayments } = await supabase
            .from('vendor_payments')
            .select('amount')
            .eq('vendor_id', updatedPayment.vendor_id);
          const totalPaid = (allVPayments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
          const { data: vendor } = await supabase
            .from('wedding_vendors')
            .select('agreed_amount')
            .eq('id', updatedPayment.vendor_id)
            .single();
          const agreed = Number(vendor?.agreed_amount) || 0;
          await supabase
            .from('wedding_vendors')
            .update({
              paid_amount: totalPaid,
              remaining_amount: Math.max(0, agreed - totalPaid),
            })
            .eq('id', updatedPayment.vendor_id);

          return {
            payment: updatedPayment as VendorPayment,
            expense: updatedExpense as Expense,
          };
        }
      } catch (err) {
        console.warn('Supabase update vendor payment error, using local fallback:', err);
      }
    }

    return localStore.updateVendorPayment(paymentId, formData);
  },

  async deleteVendorPayment(
    paymentId: string
  ): Promise<{ success: boolean; deletedExpenseId?: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: payment } = await supabase
          .from('vendor_payments')
          .select('*')
          .eq('id', paymentId)
          .single();

        if (payment) {
          const { data: deletedExpenses } = await supabase
            .from('expenses')
            .delete()
            .eq('vendor_payment_id', paymentId)
            .select('id');

          const deletedExpenseId = deletedExpenses?.[0]?.id || payment.expense_id || undefined;

          await supabase.from('vendor_payments').delete().eq('id', paymentId);

          const { data: allVPayments } = await supabase
            .from('vendor_payments')
            .select('amount')
            .eq('vendor_id', payment.vendor_id);
          const totalPaid = (allVPayments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
          const { data: vendor } = await supabase
            .from('wedding_vendors')
            .select('agreed_amount')
            .eq('id', payment.vendor_id)
            .single();
          const agreed = Number(vendor?.agreed_amount) || 0;
          await supabase
            .from('wedding_vendors')
            .update({
              paid_amount: totalPaid,
              remaining_amount: Math.max(0, agreed - totalPaid),
            })
            .eq('id', payment.vendor_id);

          return { success: true, deletedExpenseId };
        }
      } catch (err) {
        console.warn('Supabase delete vendor payment error, using local fallback:', err);
      }
    }

    return localStore.deleteVendorPayment(paymentId);
  },

  // -------------------------------------------------------------
  // VENDOR DOCUMENTS CRUD
  // -------------------------------------------------------------
  async getVendorDocuments(vendorId?: string, weddingId?: string): Promise<VendorDocument[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('vendor_documents').select('*');
        if (weddingId) query = query.eq('wedding_id', weddingId);
        if (vendorId) query = query.eq('vendor_id', vendorId);
        const { data, error } = await query.order('uploaded_date', { ascending: false });

        if (!error && data) {
          return data as VendorDocument[];
        }
      } catch (err) {
        console.warn('Supabase fetch vendor documents error, falling back to local storage:', err);
      }
    }

    return localStore.getVendorDocuments(vendorId, weddingId);
  },

  async addVendorDocument(
    weddingId: string,
    vendorId: string,
    formData: VendorDocumentFormData
  ): Promise<VendorDocument> {
    const payload = {
      wedding_id: weddingId,
      vendor_id: vendorId,
      document_name: formData.document_name.trim(),
      document_type: formData.document_type || 'Contract',
      file_reference: formData.file_reference ? formData.file_reference.trim() : null,
      notes: formData.notes ? formData.notes.trim() : null,
      uploaded_date: new Date().toISOString().split('T')[0],
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('vendor_documents')
          .insert(payload)
          .select()
          .single();

        if (!error && data) {
          return data as VendorDocument;
        }
      } catch (err) {
        console.warn('Supabase add vendor document error, using local fallback:', err);
      }
    }

    return localStore.addVendorDocument(payload);
  },

  async deleteVendorDocument(documentId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('vendor_documents')
          .delete()
          .eq('id', documentId);

        if (!error) return true;
      } catch (err) {
        console.warn('Supabase delete vendor document error, using local fallback:', err);
      }
    }

    return localStore.deleteVendorDocument(documentId);
  },
};
