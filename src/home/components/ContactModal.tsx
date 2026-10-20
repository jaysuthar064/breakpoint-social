import React, { useState } from 'react';
import { X, Send, CheckCircle2, Mail, Phone, MapPin } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledCampaign?: string;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  prefilledCampaign
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [brand, setBrand] = useState(prefilledCampaign || '');
  const [budget, setBudget] = useState('$10k - $25k');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-xl bg-[#fcf5e9] rounded-2xl md:rounded-3xl shadow-2xl border border-[#84572f]/20 overflow-hidden flex flex-col p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#1c1c1c]/70 hover:text-[#1c1c1c] rounded-full hover:bg-[#84572f]/10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="py-12 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#92ada4]/30 text-[#526840] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-[#141615] font-display">
              Thank You! We’ll Be In Touch.
            </h3>
            <p className="text-sm text-[#1c1c1c]/80 max-w-md mx-auto leading-relaxed">
              Your inquiry has been routed to Taylor and Nick. We typically review briefs and respond within 24 hours.
            </p>
            <div className="pt-4">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  onClose();
                }}
                className="px-6 py-2.5 text-xs uppercase tracking-wider font-semibold text-white bg-[#84572f] hover:bg-[#6c4625] rounded-full"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider font-bold text-[#84572f] mb-1">
                CONTACT BREAKPOINT SOCIAL
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#141615] font-display">
                Let’s Work Together
              </h3>
              <p className="text-xs sm:text-sm text-[#1c1c1c]/75 mt-1">
                Ready to elevate your influencer marketing and social storytelling? Tell us about your project.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#141615] mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#84572f]/20 focus:outline-none focus:border-[#84572f]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141615] mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jane@brand.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#84572f]/20 focus:outline-none focus:border-[#84572f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#141615] mb-1">
                    Brand / Organization *
                  </label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    placeholder="e.g. Brooks Running or Frankie's Burritos"
                    className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#84572f]/20 focus:outline-none focus:border-[#84572f]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141615] mb-1">
                    Campaign Scope / Budget
                  </label>
                  <select
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#84572f]/20 focus:outline-none focus:border-[#84572f]"
                  >
                    <option value="$5k - $10k">$5k – $10k (Pilot Campaign)</option>
                    <option value="$10k - $25k">$10k – $25k (Creator Seeding / Production)</option>
                    <option value="$25k - $50k">$25k – $50k (Multi-Talent Activation)</option>
                    <option value="$50k+">$50k+ (Comprehensive Full-Funnel Social)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#141615] mb-1">
                  Tell Us About Your Goals &amp; Timeline
                </label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Share details regarding your target audience, preferred channels (TikTok, Reels, YouTube), or creative inspiration..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#84572f]/20 focus:outline-none focus:border-[#84572f]"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs text-[#1c1c1c]/60">
                  <span>Direct: taylor@breakpointsocial.com</span>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 text-xs uppercase tracking-wider font-semibold text-white bg-[#84572f] hover:bg-[#6c4625] rounded-full transition-all flex items-center justify-center gap-2"
                >
                  <span>Submit Inquiry</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
