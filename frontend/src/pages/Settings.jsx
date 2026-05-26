import React, { useEffect, useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Database, 
  HardDrive, 
  User,
  Globe,
  Key,
  RefreshCw,
  Trash2,
  Mail,
  Shield,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';
import ThemeToggle from '../components/settings/ThemeToggle';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  getEmbeddingSettings,
  getLLMSettings,
  getVectorDBSettings,
  reindexDocumentLibrary,
  updateEmbeddingSettings,
  updateLLMSettings,
  updateVectorDBSettings,
  wipeVectorDatabase,
} from '../services/settingsService';
import { getDocuments, reclassifyAllDocuments } from '../services/documentService';
import { loadProfileSettings, saveProfileSettings } from '../utils/profileSettings';

const cn = (...inputs) => twMerge(clsx(inputs));

const DEFAULT_MODEL_BY_PROVIDER = {
  groq: 'llama-3.1-8b-instant',
  gemini: 'gemini-1.5-pro',
  openai: 'gpt-4o',
};

const DEFAULT_EMBEDDING_MODEL_BY_PROVIDER = {
  openai: 'text-embedding-3-small',
  cohere: 'embed-english-v3.0',
  huggingface: 'all-MiniLM-L6-v2',
  local: 'all-MiniLM-L6-v2',
};

const formatBytes = (bytes = 0) => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [llmProvider, setLlmProvider] = useState('groq');
  const [llmModel, setLlmModel] = useState('llama-3.1-8b-instant');
  const [temperature, setTemperature] = useState(0);
  const [maxTokens, setMaxTokens] = useState(512);
  const [llmStatus, setLlmStatus] = useState('');
  const [isSavingLlm, setIsSavingLlm] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('docintel_language') || 'en');

  // Embedding Model Settings
  const [embedProvider, setEmbedProvider] = useState('openai');
  const [embedModel, setEmbedModel] = useState('text-embedding-3-small');
  const [chunkSize, setChunkSize] = useState(512);
  const [chunkOverlap, setChunkOverlap] = useState(64);
  const [embeddingStatus, setEmbeddingStatus] = useState('');
  const [isSavingEmbedding, setIsSavingEmbedding] = useState(false);

  // Data Management Settings
  const [vectorDb, setVectorDb] = useState('qdrant');
  const [dbHost, setDbHost] = useState('http://localhost:6333');
  const [dbKey, setDbKey] = useState('di_sec_7x29a0b1c3d4e5f6');
  const [showDbKey, setShowDbKey] = useState(false);
  const [dbStatus, setDbStatus] = useState('');
  const [isSavingDb, setIsSavingDb] = useState(false);

  // Account Settings
  const storedProfile = loadProfileSettings();
  const [profileName, setProfileName] = useState(storedProfile.name);
  const [profileEmail, setProfileEmail] = useState(storedProfile.email);
  const [profilePhoto, setProfilePhoto] = useState(storedProfile.photo);
  const [profileStatus, setProfileStatus] = useState('');
  const [storageBytes, setStorageBytes] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  const [maintenanceStatus, setMaintenanceStatus] = useState('');
  const [isReclassifying, setIsReclassifying] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [isWipingDb, setIsWipingDb] = useState(false);
  const [devKey, setDevKey] = useState('di_live_9a8b7c6d5e4f3g2h1i0j');
  const [showDevKey, setShowDevKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    localStorage.setItem('docintel_language', language);
  }, [language]);

  useEffect(() => {
    const loadStorageUsage = async () => {
      try {
        const result = await getDocuments();
        const docs = result.success && result.data ? result.data : [];
        setDocumentCount(docs.length);
        setStorageBytes(docs.reduce((total, doc) => total + (doc.file_size_bytes || 0), 0));
      } catch (err) {
        console.error('Failed to load document storage usage:', err);
      }
    };

    loadStorageUsage();
  }, []);

  useEffect(() => {
    const loadLLMSettings = async () => {
      try {
        const settings = await getLLMSettings();
        setLlmProvider(settings.provider);
        setLlmModel(settings.model);
        setTemperature(settings.temperature);
        setMaxTokens(settings.max_tokens);
        setLlmStatus('');
      } catch (err) {
        console.error('Failed to load LLM settings:', err);
        setLlmStatus(err.response?.data?.detail || 'Failed to load backend LLM settings.');
      }
    };

    loadLLMSettings();
  }, []);

  useEffect(() => {
    const loadEmbeddingSettings = async () => {
      try {
        const settings = await getEmbeddingSettings();
        setEmbedProvider(settings.provider);
        setEmbedModel(settings.model);
        setChunkSize(settings.chunk_size);
        setChunkOverlap(settings.chunk_overlap);
        setEmbeddingStatus('');
      } catch (err) {
        console.error('Failed to load embedding settings:', err);
        setEmbeddingStatus(err.response?.data?.detail || 'Failed to load embedding settings.');
      }
    };

    loadEmbeddingSettings();
  }, []);

  useEffect(() => {
    const loadVectorDbSettings = async () => {
      try {
        const settings = await getVectorDBSettings();
        setVectorDb(settings.engine);
        setDbHost(settings.host);
        setDbKey(settings.api_key);
        setDbStatus('');
      } catch (err) {
        console.error('Failed to load vector DB settings:', err);
        setDbStatus(err.response?.data?.detail || 'Failed to load database settings.');
      }
    };

    loadVectorDbSettings();
  }, []);

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'llm', label: 'LLM Settings', icon: Cpu },
    { id: 'embedding', label: 'Embedding Model', icon: Database },
    { id: 'data', label: 'Data Management', icon: HardDrive },
    { id: 'account', label: 'Account', icon: User },
  ];

  const handleCopyKey = () => {
    navigator.clipboard.writeText(devKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleProfilePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setProfileStatus('Please upload JPG, PNG, or SVG.');
      return;
    }

    if (file.size > 800 * 1024) {
      setProfileStatus('Profile photo must be 800kB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhoto(reader.result);
      setProfileStatus('Photo ready. Save account details to keep it.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProfilePhoto = () => {
    setProfilePhoto('/profile.png');
    setProfileStatus('Photo removed. Save account details to keep this change.');
  };

  const handleSaveProfile = () => {
    saveProfileSettings({
      name: profileName,
      email: profileEmail,
      photo: profilePhoto,
    });
    setProfileStatus('Account details saved locally.');
  };

  const handleSaveLLMSettings = async () => {
    try {
      setIsSavingLlm(true);
      const settings = await updateLLMSettings({
        provider: llmProvider,
        model: llmModel,
        temperature,
        max_tokens: maxTokens,
      });
      setLlmProvider(settings.provider);
      setLlmModel(settings.model);
      setTemperature(settings.temperature);
      setMaxTokens(settings.max_tokens);
      setLlmStatus('LLM settings saved.');
    } catch (err) {
      console.error('Failed to save LLM settings:', err);
      setLlmStatus(err.response?.data?.detail || 'Failed to save LLM settings.');
    } finally {
      setIsSavingLlm(false);
    }
  };

  const handleProviderChange = (provider) => {
    setLlmProvider(provider);
    setLlmModel(DEFAULT_MODEL_BY_PROVIDER[provider] || '');
  };

  const handleSaveEmbeddingSettings = async () => {
    try {
      setIsSavingEmbedding(true);
      const settings = await updateEmbeddingSettings({
        provider: embedProvider,
        model: embedModel,
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
      });
      setEmbedProvider(settings.provider);
      setEmbedModel(settings.model);
      setChunkSize(settings.chunk_size);
      setChunkOverlap(settings.chunk_overlap);
      setEmbeddingStatus('Embedding settings saved. Re-index to apply chunking changes to existing documents.');
    } catch (err) {
      console.error('Failed to save embedding settings:', err);
      setEmbeddingStatus(err.response?.data?.detail || 'Failed to save embedding settings.');
    } finally {
      setIsSavingEmbedding(false);
    }
  };

  const handleSaveVectorDbSettings = async () => {
    try {
      setIsSavingDb(true);
      const settings = await updateVectorDBSettings({
        engine: vectorDb,
        host: dbHost,
        api_key: dbKey,
      });
      setVectorDb(settings.engine);
      setDbHost(settings.host);
      setDbKey(settings.api_key);
      setDbStatus('Database connection settings saved.');
    } catch (err) {
      console.error('Failed to save database settings:', err);
      setDbStatus(err.response?.data?.detail || 'Failed to save database settings.');
    } finally {
      setIsSavingDb(false);
    }
  };

  const handleReclassifyAllDocuments = async () => {
    try {
      setIsReclassifying(true);
      setMaintenanceStatus('');
      const result = await reclassifyAllDocuments();
      setMaintenanceStatus(result.message || 'Document categories reclassified.');
    } catch (err) {
      console.error('Failed to reclassify documents:', err);
      setMaintenanceStatus(err.response?.data?.detail || 'Failed to reclassify document categories.');
    } finally {
      setIsReclassifying(false);
    }
  };

  const handleReindexDocumentLibrary = async () => {
    if (!window.confirm('Re-index the document library? Existing vectors will be rebuilt from uploaded files.')) return;

    try {
      setIsReindexing(true);
      setMaintenanceStatus('');
      const result = await reindexDocumentLibrary();
      setMaintenanceStatus(`${result.message} ${result.data?.chunks ?? 0} chunks indexed.`);
    } catch (err) {
      console.error('Failed to re-index documents:', err);
      setMaintenanceStatus(err.response?.data?.detail || 'Failed to re-index document library.');
    } finally {
      setIsReindexing(false);
    }
  };

  const handleWipeVectorDatabase = async () => {
    if (!window.confirm('Wipe the vector database? This removes indexed metadata and vectors, but leaves uploaded files on disk.')) return;

    try {
      setIsWipingDb(true);
      setMaintenanceStatus('');
      const result = await wipeVectorDatabase();
      setMaintenanceStatus(result.message || 'Vector database wiped.');
      setDocumentCount(0);
      setStorageBytes(0);
    } catch (err) {
      console.error('Failed to wipe vector database:', err);
      setMaintenanceStatus(err.response?.data?.detail || 'Failed to wipe vector database.');
    } finally {
      setIsWipingDb(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 min-h-0">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Settings</h1>

        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
          {/* Sidebar Navigation */}
          <nav className="flex md:flex-col gap-1.5 md:w-64 overflow-x-auto pb-4 md:pb-0 shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-semibold'
                      : 'text-slate-650 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-800/40'
                  )}
                >
                  <Icon className="h-5 w-5 opacity-80" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-fadeIn">
                <Card padding="lg">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Appearance</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Interface Theme</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select or customize your dashboard theme.</p>
                    </div>
                    <ThemeToggle />
                  </div>
                </Card>

                <Card padding="lg">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Localization</h2>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">System Language</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select your preferred language.</p>
                    </div>
                    <div className="relative">
                      <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="pl-10 pr-8 py-2.5 w-full md:w-48 bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none appearance-none transition-all"
                      >
                        <option value="en">English (US)</option>
                        <option value="es">Espa&ntilde;ol</option>
                        <option value="fr">Fran&ccedil;ais</option>
                        <option value="de">Deutsch</option>
                      </select>
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* LLM Settings Tab */}
            {activeTab === 'llm' && (
              <div className="space-y-6 animate-fadeIn">
                <Card padding="lg">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">LLM Configuration</h2>
                  
                  <div className="space-y-5">
                    {/* Provider Selection */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Provider</label>
                      <select 
                        value={llmProvider}
                        onChange={(e) => handleProviderChange(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none appearance-none transition-all"
                      >
                        <option value="groq">Groq</option>
                        <option value="gemini">Gemini</option>
                        <option value="openai">OpenAI</option>
                      </select>
                      <p className="mt-2 text-xs text-slate-450 dark:text-slate-500">
                        Groq is currently connected for live RAG generation. Gemini and OpenAI are saved as preferences until provider adapters are added.
                      </p>
                    </div>

                    {/* Model Selection */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Model</label>
                      <select 
                        value={llmModel}
                        onChange={(e) => setLlmModel(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none appearance-none transition-all"
                      >
                        {llmProvider === 'groq' && (
                          <>
                            <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
                            <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
                            <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                          </>
                        )}
                        {llmProvider === 'gemini' && (
                          <>
                            <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
                            <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
                          </>
                        )}
                        {llmProvider === 'openai' && (
                          <>
                            <option value="gpt-4o">GPT-4o</option>
                            <option value="gpt-4o-mini">GPT-4o mini</option>
                          </>
                        )}
                      </select>
                      <p className="mt-2 text-xs text-slate-450 dark:text-slate-500">
                        Default model used for document intelligence and chat.
                      </p>
                    </div>

                    {/* Temperature Slider */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Temperature</label>
                        <span className="text-sm font-semibold text-indigo-650 dark:text-indigo-400">{temperature.toFixed(2)}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="2" 
                        step="0.01" 
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200/60 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                      />
                      <div className="flex justify-between text-xs text-slate-455 dark:text-slate-500 mt-2">
                        <span>Precise (0.0)</span>
                        <span>Creative (2.0)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Max Tokens</label>
                      <input
                        type="number"
                        min="1"
                        max="8192"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-border flex justify-end">
                    {llmStatus && (
                      <p className="mr-auto text-sm text-slate-500 dark:text-slate-400">{llmStatus}</p>
                    )}
                    <Button variant="primary" onClick={handleSaveLLMSettings} isLoading={isSavingLlm}>
                      Save LLM Settings
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Embedding Model Tab */}
            {activeTab === 'embedding' && (
              <div className="space-y-6 animate-fadeIn">
                <Card padding="lg">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Embedding Configuration</h2>
                  
                  <div className="space-y-5">
                    {/* Provider Selection */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Embedding Provider</label>
                      <select 
                        value={embedProvider}
                        onChange={(e) => {
                          const provider = e.target.value;
                          setEmbedProvider(provider);
                          setEmbedModel(DEFAULT_EMBEDDING_MODEL_BY_PROVIDER[provider] || '');
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none appearance-none transition-all"
                      >
                        <option value="openai">OpenAI</option>
                        <option value="cohere">Cohere</option>
                        <option value="huggingface">Hugging Face (Remote)</option>
                        <option value="local">Ollama (Local)</option>
                      </select>
                    </div>

                    {/* Model Selection */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Embedding Model</label>
                      <select 
                        value={embedModel}
                        onChange={(e) => setEmbedModel(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none appearance-none transition-all"
                      >
                        {embedProvider === 'openai' && (
                          <>
                            <option value="text-embedding-3-small">text-embedding-3-small (1536 dim)</option>
                            <option value="text-embedding-3-large">text-embedding-3-large (3072 dim)</option>
                            <option value="text-embedding-ada-002">text-embedding-ada-002 (1536 dim)</option>
                          </>
                        )}
                        {embedProvider === 'cohere' && (
                          <>
                            <option value="embed-english-v3.0">embed-english-v3.0 (1024 dim)</option>
                            <option value="embed-multilingual-v3.0">embed-multilingual-v3.0 (1024 dim)</option>
                          </>
                        )}
                        {embedProvider === 'huggingface' && (
                          <>
                            <option value="bge-large-en-v1.5">BAAI/bge-large-en-v1.5 (1024 dim)</option>
                            <option value="all-MiniLM-L6-v2">sentence-transformers/all-MiniLM-L6-v2 (384 dim)</option>
                          </>
                        )}
                        {embedProvider === 'local' && (
                          <>
                            <option value="all-MiniLM-L6-v2">all-MiniLM-L6-v2 (384 dim)</option>
                            <option value="nomic-embed-text">nomic-embed-text (768 dim)</option>
                            <option value="mxbai-embed-large">mxbai-embed-large (1024 dim)</option>
                          </>
                        )}
                      </select>
                      <p className="mt-2 text-xs text-slate-450 dark:text-slate-500">
                        This model generates mathematical vectors for semantic similarity searches. Changing models requires re-indexing existing documents.
                      </p>
                    </div>

                    {/* Chunking strategy parameters */}
                    <div className="pt-4 border-t border-border/60">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Semantic Parser (Chunking)</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Chunk Size (Tokens)</label>
                            <span className="text-sm font-semibold text-indigo-650 dark:text-indigo-400">{chunkSize}</span>
                          </div>
                          <input 
                            type="range" 
                            min="128" 
                            max="1024" 
                            step="32" 
                            value={chunkSize}
                            onChange={(e) => setChunkSize(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200/60 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Chunk Overlap (Tokens)</label>
                            <span className="text-sm font-semibold text-indigo-650 dark:text-indigo-400">{chunkOverlap}</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="256" 
                            step="8" 
                            value={chunkOverlap}
                            onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200/60 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-border flex justify-end">
                    {embeddingStatus && (
                      <p className="mr-auto text-sm text-slate-500 dark:text-slate-400">{embeddingStatus}</p>
                    )}
                    <Button variant="primary" onClick={handleSaveEmbeddingSettings} isLoading={isSavingEmbedding}>
                      Save Embedding Settings
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Data Management Tab */}
            {activeTab === 'data' && (
              <div className="space-y-6 animate-fadeIn">
                <Card padding="lg">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Vector Database Connection</h2>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Database Engine</label>
                      <select 
                        value={vectorDb}
                        onChange={(e) => setVectorDb(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none appearance-none transition-all"
                      >
                        <option value="faiss">FAISS Local</option>
                        <option value="qdrant">Qdrant Cloud / Local</option>
                        <option value="pinecone">Pinecone DB</option>
                        <option value="milvus">Milvus DB</option>
                        <option value="pgvector">PostgreSQL (pgvector)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Database Host</label>
                        <input 
                          type="text"
                          value={dbHost}
                          onChange={(e) => setDbHost(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">API Key / Secret Token</label>
                        <div className="relative">
                          <input 
                            type={showDbKey ? "text" : "password"}
                            value={dbKey}
                            onChange={(e) => setDbKey(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl pl-3 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowDbKey(!showDbKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200"
                          >
                            {showDbKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border flex justify-end">
                    {dbStatus && (
                      <p className="mr-auto text-sm text-slate-500 dark:text-slate-400">{dbStatus}</p>
                    )}
                    <Button variant="primary" onClick={handleSaveVectorDbSettings} isLoading={isSavingDb}>
                      Save DB Connection
                    </Button>
                  </div>
                </Card>

                {/* Index Maintenance Operations */}
                <Card padding="lg" className="border-red-500/10 dark:border-red-500/20">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Danger Zone
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                    Irreversible database utility commands. Proceed with extreme caution.
                  </p>

                  {maintenanceStatus && (
                    <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                      {maintenanceStatus}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-950/5 flex flex-col justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Reclassify Categories</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Re-run document classification for already uploaded files and update stored metadata without rebuilding embeddings.
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={handleReclassifyAllDocuments}
                        isLoading={isReclassifying}
                        className="w-full flex items-center justify-center gap-2 border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                      >
                        <RefreshCw size={14} />
                        Reclassify All
                      </Button>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-950/5 flex flex-col justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Re-index Document Library</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Wipe all existing vector database index chunks and fully re-parse all documents using the currently active embedding model.
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={handleReindexDocumentLibrary}
                        isLoading={isReindexing}
                        className="w-full flex items-center justify-center gap-2 border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      >
                        <RefreshCw size={14} />
                        Re-index Database
                      </Button>
                    </div>

                    <div className="p-4 rounded-xl border border-red-500/10 bg-red-50/5 dark:bg-red-950/5 flex flex-col justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Wipe Vector Database</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Deletes all document records, vectors, metadata, and active text chunks. This action cannot be undone.
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={handleWipeVectorDatabase}
                        isLoading={isWipingDb}
                        className="w-full bg-red-650 hover:bg-red-700 text-white font-medium flex items-center justify-center gap-2"
                      >
                        <Trash2 size={14} />
                        Wipe Database
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6 animate-fadeIn">
                <Card padding="lg">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-6">Profile Settings</h2>
                  
                  {/* Avatar upload section */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-border/60">
                    <div className="w-20 h-20 rounded-full border border-border overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center flex-shrink-0">
                      <img src={profilePhoto} alt="Admin Profile" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col items-center sm:items-start gap-2">
                      <div className="flex items-center gap-2.5">
                        <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-xl bg-indigo-600 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700">
                          Upload Photo
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/svg+xml"
                            className="sr-only"
                            onChange={handleProfilePhotoUpload}
                          />
                        </label>
                        <Button variant="secondary" size="sm" onClick={handleRemoveProfilePhoto}>
                          Remove
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Allowed JPG, PNG or SVG. Max size of 800kB.
                      </p>
                    </div>
                  </div>

                  {/* Profile inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Display Name</label>
                      <input 
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Email Address</label>
                      <div className="relative">
                        <input 
                          type="email"
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-900/40 border border-border rounded-xl pl-10 pr-3 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all"
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Subscription Plan details */}
                  <div className="mt-8 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/10 bg-indigo-50/30 dark:bg-indigo-500/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Current Workspace:</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400">Local MVP</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Profile settings are stored in this browser. Document usage is read from your backend.
                        </p>
                      </div>
                      
                      <div className="w-full sm:w-48">
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="text-slate-550 dark:text-slate-400">Document Storage</span>
                          <span className="text-slate-800 dark:text-slate-200">{formatBytes(storageBytes)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((storageBytes / (10 * 1024 * 1024)) * 100, 100)}%` }}></div>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-500">{documentCount} uploaded document{documentCount === 1 ? '' : 's'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border flex items-center justify-between gap-4">
                    {profileStatus && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">{profileStatus}</p>
                    )}
                    <Button variant="primary" onClick={handleSaveProfile}>
                      Save Account Details
                    </Button>
                  </div>
                </Card>

                {/* API Credentials */}
                <Card padding="lg">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-indigo-500" />
                    Developer API Access
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                    Use these secret keys to query your document stores and chat completions via REST endpoints.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Live API Token</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input 
                            type={showDevKey ? "text" : "password"}
                            readOnly
                            value={devKey}
                            className="w-full bg-slate-100 dark:bg-slate-900/60 border border-border rounded-xl pl-3 pr-10 py-2.5 text-sm font-mono text-slate-700 dark:text-slate-350 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowDevKey(!showDevKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200"
                          >
                            {showDevKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <Button 
                          variant="secondary"
                          onClick={handleCopyKey}
                          className="flex items-center gap-2 py-2.5"
                        >
                          {copiedKey ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                          {copiedKey ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
