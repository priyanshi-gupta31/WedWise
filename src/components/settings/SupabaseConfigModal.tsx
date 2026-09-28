import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured, saveSupabaseConfig, clearSupabaseConfig } from '../../lib/supabase';
import { Check, Copy, Database, ExternalLink, ShieldCheck } from 'lucide-react';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [url, setUrl] = useState(supabaseUrl || '');
  const [key, setKey] = useState(supabaseAnonKey || '');
  const [copied, setCopied] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      showToast('Please enter both Supabase URL and Anon Key', 'error');
      return;
    }
    saveSupabaseConfig(url, key);
    showToast('Supabase settings saved! Reloading...', 'success');
  };

  const handleReset = () => {
    clearSupabaseConfig();
    showToast('Reset to local preview mode. Reloading...', 'info');
  };

  const copySqlSchemaPath = () => {
    navigator.clipboard.writeText('supabase/schema.sql');
    setCopied(true);
    showToast('Schema file path copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supabase Database Configuration"
      subtitle="Connect your private PostgreSQL database & Row Level Security"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Current status pill */}
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            isSupabaseConfigured
              ? 'bg-[#EDF2EE] border-[#5B8266]/30 text-[#5B8266]'
              : 'bg-[#FAF5EA] border-[#C9A45C]/30 text-[#96742E]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isSupabaseConfigured ? 'bg-[#5B8266]/15 text-[#5B8266]' : 'bg-[#C9A45C]/15 text-[#96742E]'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {isSupabaseConfigured ? 'Live Supabase Connected' : 'Local Storage Fallback Mode'}
              </p>
              <p className="text-xs opacity-80">
                {isSupabaseConfigured
                  ? 'All records and calculations are synchronized in your PostgreSQL database.'
                  : 'Currently storing wedding data in your browser local storage.'}
              </p>
            </div>
          </div>
        </div>

        {/* Form to enter/update credentials */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#77716A] uppercase tracking-wider mb-1.5">
              Project URL (VITE_SUPABASE_URL)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#E9E1D7] rounded-xl text-[#262421] focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#77716A] uppercase tracking-wider mb-1.5">
              Anon Public API Key (VITE_SUPABASE_ANON_KEY)
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#E9E1D7] rounded-xl text-[#262421] focus:border-[#C9A45C] focus:ring-1 focus:ring-[#C9A45C] focus:outline-none font-mono text-xs transition-colors"
            />
            <p className="text-[11px] text-[#77716A] mt-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#5B8266]" />
              Never use your service_role secret key on frontend applications.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" className="flex-1">
              Save & Connect
            </Button>
            {isSupabaseConfigured && (
              <Button type="button" variant="outline" onClick={handleReset}>
                Disconnect
              </Button>
            )}
          </div>
        </form>

        {/* SQL Schema helper */}
        <div className="bg-[#FAF8F5] border border-[#E9E1D7] p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#262421]">Database Schema & RLS Setup</span>
            <button
              onClick={copySqlSchemaPath}
              className="text-xs text-[#C9A45C] hover:text-[#B08D46] font-medium hover:underline flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#5B8266]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>supabase/schema.sql</span>
            </button>
          </div>
          <p className="text-xs text-[#77716A] leading-relaxed">
            The full PostgreSQL schema with Row Level Security, default categories trigger, and profile synchronization is ready in{' '}
            <code className="bg-white border border-[#E9E1D7] px-1.5 py-0.5 rounded text-[#262421] font-mono text-[11px]">supabase/schema.sql</code>. Copy its contents into your Supabase SQL Editor to initialize the tables.
          </p>
        </div>
      </div>
    </Modal>
  );
};
