import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Save, AlertCircle, CheckCircle2, MapPin } from 'lucide-react';

interface SettingsPanelProps {
  onStationUpdate?: (name: string) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onStationUpdate }) => {
  // User Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [userMessage, setUserMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userLoading, setUserLoading] = useState(false);

  // Station Form State
  const [stationId, setStationId] = useState('');
  const [stationName, setStationName] = useState('');
  const [stationMessage, setStationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stationLoading, setStationLoading] = useState(false);

  useEffect(() => {
    // Initial fetch of current station constraints
    axios.get('/auth/station/').then(res => {
      setStationId(res.data.station_id || '');
      setStationName(res.data.station_name || '');
    }).catch(e => console.error("Err fetching station", e));
  }, []);

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserLoading(true);
    setUserMessage(null);

    try {
      const response = await axios.post('/auth/register/', {
        email,
        password,
        superusercheck: isSuperuser,
      });

      if (response.data.status === 'success') {
        setUserMessage({ type: 'success', text: 'New user created successfully.' });
        setEmail('');
        setPassword('');
        setIsSuperuser(false);
      } else {
        setUserMessage({ type: 'error', text: response.data.message || 'Error creating user.' });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to create user.';
      setUserMessage({ type: 'error', text: errorMsg });
    } finally {
      setUserLoading(false);
    }
  };

  const handleStationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStationLoading(true);
    setStationMessage(null);

    try {
      const response = await axios.post('/auth/station/', {
        station_id: stationId,
        station_name: stationName,
      });

      if (response.data.status === 'success') {
        setStationMessage({ type: 'success', text: 'Station profile automatically synced.' });
        if (onStationUpdate) onStationUpdate(stationName);
      } else {
        setStationMessage({ type: 'error', text: response.data.message || 'Error updating station.' });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to update system configs.';
      setStationMessage({ type: 'error', text: errorMsg });
    } finally {
      setStationLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8 bg-slate-50 min-h-full">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-display font-medium text-slate-900 tracking-tight flex items-center gap-2">
            System Settings
          </h2>
          <p className="text-sm text-slate-500 font-medium">Manage platform configurations and access controls.</p>
        </div>

        <div className="bg-white border border-slate-200">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-primary-50 text-primary-600 rounded">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">User Management</h3>
              <p className="text-xs text-slate-500 mt-0.5">Provision new accounts. This action is restricted to superusers.</p>
            </div>
          </div>

          <form onSubmit={handleUserSubmit} className="p-6 space-y-5">
            {userMessage && (
              <div className={`p-4 text-sm flex items-start gap-3 ${userMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {userMessage.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5" /> : <AlertCircle size={16} className="mt-0.5" />}
                <p className="font-medium">{userMessage.text}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary-500 focus:bg-white"
                  placeholder="user@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary-500 focus:bg-white"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isSuperuser}
                    onChange={(e) => setIsSuperuser(e.target.checked)}
                    className="appearance-none w-5 h-5 border-2 border-slate-300 rounded-sm outline-none cursor-pointer transition-all checked:bg-primary-500 checked:border-primary-500 group-hover:border-primary-400"
                  />
                  {isSuperuser && <div className="absolute inset-0 flex items-center justify-center text-white pointer-events-none">
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>}
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-700 block transition-colors group-hover:text-primary-600">Grant Superuser Privileges</span>
                  <span className="text-xs text-slate-500 mt-0.5 block">Allow this user to manage settings and create other accounts</span>
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={userLoading}
                className="bg-primary-900 hover:bg-primary-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
              >
                {userLoading ? 'Creating...' : (
                   <>
                     <Save size={14} />
                     Create User
                   </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-slate-200">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Station Configuration</h3>
              <p className="text-xs text-slate-500 mt-0.5">Define node identification tags broadcast globally across the platform interface.</p>
            </div>
          </div>

          <form onSubmit={handleStationSubmit} className="p-6 space-y-5">
            {stationMessage && (
              <div className={`p-4 text-sm flex items-start gap-3 ${stationMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {stationMessage.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5" /> : <AlertCircle size={16} className="mt-0.5" />}
                <p className="font-medium">{stationMessage.text}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Station ID</label>
                <input
                  type="text"
                  required
                  value={stationId}
                  onChange={(e) => setStationId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary-500 focus:bg-white"
                  placeholder="RS485-PROD-01"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Station Alias Name</label>
                <input
                  type="text"
                  required
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary-500 focus:bg-white"
                  placeholder="Sikka (Jamnagar)"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={stationLoading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
              >
                {stationLoading ? 'Syncing...' : (
                   <>
                     <Save size={14} />
                     Save Station
                   </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
