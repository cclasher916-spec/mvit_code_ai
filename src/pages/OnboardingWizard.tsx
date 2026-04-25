import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Send, Search } from 'lucide-react';
import { useToast } from '../components/ui/Toaster';

const GOOGLE_SHEETS_API_URL = import.meta.env.VITE_GOOGLE_SHEETS_API_URL || '';

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    roll_number: '',
    student_email_address: '',
    batch: '',
    department: '',
    section: '',
    mobile_number: '',
    team_name: '',
    team_role: 'member',
    leetcode_username: '',
    github_username: '',
    codechef_username: '',
    codeforces_username: '',
    hackerrank_username: '',
    skillrack_username: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchExistingData = async () => {
    if (!formData.roll_number || !formData.student_email_address) {
      addToast('Please enter both Roll Number and Email to fetch your application.', 'error');
      return;
    }

    setIsFetching(true);
    try {
      const response = await fetch(`${GOOGLE_SHEETS_API_URL}?roll_no=${formData.roll_number}&email=${formData.student_email_address}`);
      const result = await response.json();

      if (result.success && result.data) {
        setFormData(result.data);
        setIsEditMode(true);
        addToast('Application loaded successfully! You can now edit your details.', 'success');
      } else {
        addToast(result.error || 'No existing application found with these credentials.', 'error');
      }
    } catch (error) {
      console.error(error);
      addToast('Failed to connect to the server.', 'error');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!GOOGLE_SHEETS_API_URL) {
      addToast('System Error: Google Sheets API URL is not configured.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(GOOGLE_SHEETS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();

      if (result.success) {
        addToast('Welcome to MVIT Coding Team! Your application is in review.', 'success');
        setStep(4); // Success screen
      } else {
        addToast(result.error || 'Failed to submit application.', 'error');
      }
    } catch (error) {
      console.error(error);
      addToast('Network error while submitting. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const slideVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Progress Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 text-center mb-6">
          MVIT Coding Team Portal
        </h1>
        {step < 4 && (
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg transition-all ${
                  step >= num ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-surface border border-border text-textMuted'
                }`}>
                  {step > num ? <CheckCircle className="w-6 h-6" /> : num}
                </div>
                {num < 3 && (
                  <div className={`w-16 h-1 rounded-full mx-2 ${step > num ? 'bg-blue-600' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Form Area */}
      <div className="bg-surface rounded-2xl shadow-xl border border-border overflow-hidden backdrop-blur-sm relative min-h-[400px]">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-50"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full filter blur-[100px] opacity-10"></div>
        
        <div className="p-8 relative z-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" variants={slideVariants} initial="hidden" animate="visible" exit="exit">
                <h2 className="text-2xl font-bold text-textMain mb-2">Personal Information</h2>
                <p className="text-textMuted mb-8">Let's start with your academic details.</p>
                
                {/* Editing fetcher */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-8 flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-1 font-medium">Already applied? Enter Roll No & Email to edit your response.</p>
                  </div>
                  <button type="button" onClick={fetchExistingData} disabled={isFetching} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50">
                    {isFetching ? 'Searching...' : <><Search className="w-4 h-4 mr-2" /> Load Application</>}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-1">Full Name *</label>
                    <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange} className="w-full bg-background border border-border text-textMain rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-1">Roll Number *</label>
                    <input type="text" name="roll_number" required value={formData.roll_number} onChange={handleChange} className="w-full bg-background border border-border text-textMain rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="23TN0027" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-1">Student Email Address *</label>
                    <input type="email" name="student_email_address" required value={formData.student_email_address} onChange={handleChange} className="w-full bg-background border border-border text-textMain rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="john@mvit.edu.in" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-1">Mobile Number</label>
                    <input type="text" name="mobile_number" value={formData.mobile_number} onChange={handleChange} className="w-full bg-background border border-border text-textMain rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="10-digit number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-1">Batch *</label>
                    <input type="text" name="batch" required value={formData.batch} onChange={handleChange} className="w-full bg-background border border-border text-textMain rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="2023-2027" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-textMuted mb-1">Department *</label>
                      <input type="text" name="department" required value={formData.department} onChange={handleChange} className="w-full bg-background border border-border text-textMain rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="CSE" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-textMuted mb-1">Section *</label>
                      <input type="text" name="section" required value={formData.section} onChange={handleChange} className="w-full bg-background border border-border text-textMain rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="A" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={slideVariants} initial="hidden" animate="visible" exit="exit">
                <h2 className="text-2xl font-bold text-textMain mb-2">Team Configuration</h2>
                <p className="text-textMuted mb-8">Are you joining a coding squad? Fill this out.</p>
                
                <div className="space-y-6 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium text-textMuted mb-1">Team Name (Optional)</label>
                    <input type="text" name="team_name" value={formData.team_name} onChange={handleChange} className="w-full bg-background border border-border text-textMain rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Leave blank if unassigned" />
                  </div>
                  
                  {formData.team_name && (
                    <div>
                      <label className="block text-sm font-medium text-textMuted mb-2">Your Role</label>
                      <div className="flex gap-4">
                        <label className={`flex-1 flex items-center justify-center px-4 py-3 border rounded-lg cursor-pointer transition-colors ${formData.team_role === 'leader' ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:text-blue-400' : 'bg-background border-border text-textMuted hover:border-gray-400 dark:hover:border-white/30'}`}>
                          <input type="radio" name="team_role" value="leader" checked={formData.team_role === 'leader'} onChange={handleChange} className="sr-only" />
                          <span className="font-medium">Team Leader</span>
                        </label>
                        <label className={`flex-1 flex items-center justify-center px-4 py-3 border rounded-lg cursor-pointer transition-colors ${formData.team_role === 'member' ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:text-blue-400' : 'bg-background border-border text-textMuted hover:border-gray-400 dark:hover:border-white/30'}`}>
                          <input type="radio" name="team_role" value="member" checked={formData.team_role === 'member'} onChange={handleChange} className="sr-only" />
                          <span className="font-medium">Team Member</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={slideVariants} initial="hidden" animate="visible" exit="exit">
                <h2 className="text-2xl font-bold text-textMain mb-2">Coding Profiles</h2>
                <p className="text-textMuted mb-8">Connect your platforms. The AI agent will parse your stats nightly.</p>
                
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">LeetCode Username (Mandatory)</h4>
                      <p className="text-xs text-red-700 dark:text-red-300/70 mt-1">Provide just the username, not the full URL. If this is incorrect, your ELO rank will not calculate.</p>
                      <input type="text" name="leetcode_username" required value={formData.leetcode_username} onChange={handleChange} className="w-full mt-3 bg-background border border-red-500/50 text-textMain rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none" placeholder="e.g. agilesh_s" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-textMuted mb-1">GitHub Username</label>
                      <input type="text" name="github_username" value={formData.github_username} onChange={handleChange} className="w-full bg-background border border-border text-textMain rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-textMuted mb-1">CodeChef Username</label>
                      <input type="text" name="codechef_username" value={formData.codechef_username} onChange={handleChange} className="w-full bg-background border border-border text-textMain rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-textMuted mb-1">HackerRank Username</label>
                      <input type="text" name="hackerrank_username" value={formData.hackerrank_username} onChange={handleChange} className="w-full bg-background border border-border text-textMain rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-textMuted mb-1">SkillRack Username</label>
                      <input type="text" name="skillrack_username" value={formData.skillrack_username} onChange={handleChange} className="w-full bg-background border border-border text-textMain rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="text-center py-12">
                <div className="w-20 h-20 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold text-textMain mb-4">Application Secured!</h2>
                <p className="text-textMuted max-w-md mx-auto mb-8">
                  Your data has been securely saved to the pending queue. The AI tracking agent will process it during the next batch sync.
                </p>
                <button onClick={() => window.location.href = '/'} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20">
                  Return to Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        {step < 4 && (
          <div className="bg-subtle border-t border-border p-6 flex justify-between relative z-10">
            <button 
              type="button" 
              onClick={prevStep} 
              disabled={step === 1}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${step === 1 ? 'opacity-0 cursor-default' : 'text-textMuted hover:text-textMain hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>
            
            {step < 3 ? (
              <button 
                type="button" 
                onClick={nextStep}
                className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
              >
                Next Step <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50"
              >
                {isSubmitting ? 'Securing...' : (isEditMode ? 'Update Application' : 'Submit Application')} 
                {!isSubmitting && <Send className="w-4 h-4 ml-2" />}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
