import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useWedding } from '../../context/WeddingContext';
import { useToast } from '../../context/ToastContext';
import { WeddingTask, TaskPriority, TaskStatus } from '../../types/database.types';
import { TaskFormData } from '../../types/task';
import { getTodayISODate } from '../../utils/date';
import { Calendar, User, Flag, CheckCircle2, Sparkles } from 'lucide-react';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: WeddingTask | null;
  defaultEventId?: string | null;
}

const ASSIGNEE_PRESETS = ['Groom', 'Bride', 'Dad', 'Mom', 'Sister', 'Brother'];

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultEventId,
}) => {
  const { events, addTask, updateTask } = useWedding();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventId, setEventId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('Groom');
  const [customAssignee, setCustomAssignee] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Normal');
  const [status, setStatus] = useState<TaskStatus>('Todo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setEventId(taskToEdit.event_id || '');
        setDueDate(taskToEdit.due_date || '');
        if (taskToEdit.assigned_to && ASSIGNEE_PRESETS.includes(taskToEdit.assigned_to)) {
          setAssignedTo(taskToEdit.assigned_to);
          setCustomAssignee('');
        } else if (taskToEdit.assigned_to) {
          setAssignedTo('Custom');
          setCustomAssignee(taskToEdit.assigned_to);
        } else {
          setAssignedTo('');
          setCustomAssignee('');
        }
        setPriority(taskToEdit.priority);
        setStatus(taskToEdit.status);
      } else {
        setTitle('');
        setDescription('');
        setEventId(defaultEventId || '');
        setDueDate(getTodayISODate());
        setAssignedTo('Groom');
        setCustomAssignee('');
        setPriority('Normal');
        setStatus('Todo');
      }
      setErrors({});

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, taskToEdit, defaultEventId]);

  const effectiveAssignee = assignedTo === 'Custom' ? customAssignee.trim() : assignedTo;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) {
      errs.title = 'Please enter task title.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: TaskFormData = {
        title: title.trim(),
        description: description.trim() || undefined,
        event_id: eventId || null,
        due_date: dueDate || undefined,
        assigned_to: effectiveAssignee || undefined,
        priority,
        status,
      };

      if (taskToEdit) {
        await updateTask(taskToEdit.id, payload);
        showToast('Wedding task updated! ✅', 'success');
      } else {
        await addTask(payload);
        showToast('Task added to family checklist! 📋', 'success');
      }

      onClose();
    } catch (err) {
      console.error('Failed to save task:', err);
      showToast('Could not save task. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Wedding Task' : 'Add Family Task'}
      subtitle={taskToEdit ? 'Update checklist item & family ownership' : 'Coordinate tasks across ceremonies and family members'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. TITLE */}
        <div>
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
            Task Description <span className="text-[#C93B2B]">*</span>
          </label>
          <input
            ref={inputRef}
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Finalize bridal floral jewelry order, Confirm Dhol timing"
            className={`w-full px-4 py-2.5 text-sm bg-[#FFFDF9] border rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35] focus:ring-1 focus:ring-[#641F35]/30 font-medium ${
              errors.title ? 'border-[#C93B2B] bg-[#FFF5F5]' : 'border-[#E8DFD5]'
            }`}
          />
          {errors.title && <p className="text-xs text-[#C93B2B] mt-0.5">{errors.title}</p>}
        </div>

        {/* 2. ASSOCIATED CEREMONY & DUE DATE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Ceremony (Optional)
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] font-medium focus:outline-none focus:border-[#641F35]"
            >
              <option value="">General (All Wedding)</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.event_name} ({ev.event_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Due Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] font-medium focus:outline-none focus:border-[#641F35]"
              />
            </div>
          </div>
        </div>

        {/* 3. ASSIGNED FAMILY MEMBER */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider">
            Assigned Family Member
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ASSIGNEE_PRESETS.map((person) => {
              const isSelected = assignedTo === person;
              return (
                <button
                  key={person}
                  type="button"
                  onClick={() => {
                    setAssignedTo(person);
                    setCustomAssignee('');
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-[#641F35] text-[#FFF8F0] border-[#641F35] shadow-xs'
                      : 'bg-[#FFFDF9] text-[#615163] border-[#E8DFD5] hover:border-[#D6B36A]'
                  }`}
                >
                  {person}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setAssignedTo('Custom')}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                assignedTo === 'Custom'
                  ? 'bg-[#641F35] text-[#FFF8F0] border-[#641F35]'
                  : 'bg-[#FFFDF9] text-[#615163] border-[#E8DFD5] hover:border-[#D6B36A]'
              }`}
            >
              Other...
            </button>
          </div>

          {assignedTo === 'Custom' && (
            <input
              type="text"
              autoFocus
              value={customAssignee}
              onChange={(e) => setCustomAssignee(e.target.value)}
              placeholder="e.g. Chachi, Wedding Planner, Pandit Ji"
              className="w-full px-3.5 py-2 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35] mt-1"
            />
          )}
        </div>

        {/* 4. PRIORITY & STATUS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Normal', 'Important', 'Urgent'] as TaskPriority[]).map((p) => {
                const isSelected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 px-2 text-[11px] font-bold rounded-xl border transition-all text-center ${
                      isSelected
                        ? p === 'Urgent'
                          ? 'bg-[#FFF0F0] text-[#C93B2B] border-[#C93B2B]'
                          : p === 'Important'
                          ? 'bg-[#FFF2E0] text-[#E89838] border-[#E89838]'
                          : 'bg-[#641F35] text-white border-[#641F35]'
                        : 'bg-[#FFFDF9] text-[#8C7A8E] border-[#E8DFD5]'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
              Status
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Todo', 'In Progress', 'Completed'] as TaskStatus[]).map((s) => {
                const isSelected = status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`py-1.5 px-2 text-[11px] font-bold rounded-xl border transition-all text-center ${
                      isSelected
                        ? s === 'Completed'
                          ? 'bg-[#EAF3EC] text-[#2D5A43] border-[#2D5A43]'
                          : s === 'In Progress'
                          ? 'bg-[#FFF2E0] text-[#9E5D0A] border-[#E89838]'
                          : 'bg-[#641F35] text-white border-[#641F35]'
                        : 'bg-[#FFFDF9] text-[#8C7A8E] border-[#E8DFD5]'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. NOTES */}
        <div>
          <label className="block text-[11px] font-bold text-[#16162A] uppercase tracking-wider mb-1">
            Additional Details / Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add phone numbers, vendor contacts, or specific instructions..."
            className="w-full px-3 py-2 text-xs bg-[#FFFDF9] border border-[#E8DFD5] rounded-xl text-[#16162A] focus:outline-none focus:border-[#641F35] resize-none"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2.5 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-xs">
            Cancel
          </Button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-2 py-3 px-6 rounded-xl bg-[#641F35] hover:bg-[#52172A] active:scale-[0.99] text-[#FFF8F0] font-semibold text-xs tracking-wider uppercase shadow-wine transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-[#FFF8F0] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{taskToEdit ? 'Update Task' : 'Save Task'}</span>
                <Sparkles className="w-3.5 h-3.5 text-[#E89838]" />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
