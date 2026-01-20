import React, { useState, useEffect } from 'react';
import { Upload, Brain, FileText, Download, Loader2, AlertCircle, X, Play, Table, Copy, Sun, Moon, CheckCircle, TrendingUp, BarChart3, PieChart, Clock, Bell, Mail, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error
        ? (this.state.error.message || String(this.state.error))
        : 'Unknown error';

      return (
        <div className="min-h-screen bg-slate-900 p-6 flex items-center justify-center">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-8 max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <h1 className="text-2xl font-bold text-red-400">Application Error</h1>
            </div>
            <p className="text-red-300 mb-4">
              Something went wrong. Please refresh the page to try again.
            </p>
            <pre className="bg-slate-800 p-4 rounded text-sm text-red-200 overflow-auto">
              {errorMessage}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function JanusEnhanced() {
  const [sheetUrls, setSheetUrls] = useState([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [localFiles, setLocalFiles] = useState([]);
  const [rules, setRules] = useState([]);
  const [currentRule, setCurrentRule] = useState({ name: '', prompt: '' });
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState('');
  const [error, setErrorRaw] = useState('');
  const [success, setSuccessRaw] = useState('');
  const [automationAlert, setAutomationAlert] = useState('');
  const [activeTab, setActiveTab] = useState('sheets');

  // Safe setters that convert objects to strings
  const setError = (err) => {
    if (!err) {
      setErrorRaw('');
    } else if (typeof err === 'string') {
      setErrorRaw(err);
    } else if (err.message) {
      setErrorRaw(err.message);
    } else {
      setErrorRaw(String(err));
    }
  };

  const setSuccess = (msg) => {
    if (!msg) {
      setSuccessRaw('');
    } else if (typeof msg === 'string') {
      setSuccessRaw(msg);
    } else {
      setSuccessRaw(String(msg));
    }
  };
  const [darkMode, setDarkMode] = useState(true);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [exportFormat, setExportFormat] = useState('txt');
  const [recentSheets, setRecentSheets] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [showKpiBuilder, setShowKpiBuilder] = useState(false);
  const [currentKpi, setCurrentKpi] = useState({ name: '', metric: '', target: '', chartType: 'line' });
  const [automations, setAutomations] = useState([]);
  const [showAutomationBuilder, setShowAutomationBuilder] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState(null);
  const [currentAutomation, setCurrentAutomation] = useState({
    name: '',
    schedule: 'daily',
    time: '09:00',
    condition: '',
    threshold: '',
    notifyEmail: '',
    notifyMethod: 'browser'
  });

  // Load automations from backend on mount
  useEffect(() => {
    loadAutomations();
  }, []);

  // Load recent sheets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSheets');
    if (saved) {
      setRecentSheets(JSON.parse(saved));
    }

    // Request notification permission on load
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        processSheets();
      }
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        addRule();
      }
      if (e.altKey && e.key === 't') {
        e.preventDefault();
        setDarkMode(!darkMode);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [darkMode]);

  const bgClass = darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 to-blue-50';
  const cardClass = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textClass = darkMode ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = darkMode ? 'text-slate-300' : 'text-slate-700';
  const inputClass = darkMode ? 'bg-slate-900/30 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900';

  // Load automations from backend
  const loadAutomations = async () => {
    try {
      console.log('Loading automations from backend...');
      const response = await fetch('/api/automations');
      const data = await response.json();

      if (data.automations && Array.isArray(data.automations)) {
        console.log('Loaded', data.automations.length, 'automations from backend');
        setAutomations(data.automations);
        // Also save to localStorage as cache
        localStorage.setItem('janus:automations', JSON.stringify(data.automations));
      } else {
        // Fallback to localStorage if backend fails
        const cached = localStorage.getItem('janus:automations');
        if (cached) {
          console.log('Loading from localStorage fallback');
          setAutomations(JSON.parse(cached));
        }
      }
    } catch (err) {
      console.error('Failed to load automations from backend:', err);
      // Fallback to localStorage
      const cached = localStorage.getItem('janus:automations');
      if (cached) {
        console.log('Loading from localStorage after error');
        setAutomations(JSON.parse(cached));
      }
    }
  };

  // Save automations to backend
  const saveAutomations = async (newAutomations) => {
    try {
      console.log('Saving', newAutomations.length, 'automations to backend...');
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automations: newAutomations })
      });

      const data = await response.json();
      if (data.success) {
        console.log('Successfully saved to backend');
        // Also save to localStorage as cache
        localStorage.setItem('janus:automations', JSON.stringify(newAutomations));
      }
    } catch (err) {
      console.error('Failed to save automations to backend:', err);
      // Still save to localStorage
      localStorage.setItem('janus:automations', JSON.stringify(newAutomations));
    }
  };

  const ruleTemplates = [
    {
      name: 'Financial Analysis',
      rules: [
        { name: 'Revenue Breakdown', prompt: 'Calculate total revenue by category and identify top performers' },
        { name: 'Expense Analysis', prompt: 'Analyze expenses and flag unusual patterns' }
      ]
    },
    {
      name: 'Sales Report',
      rules: [
        { name: 'Sales Summary', prompt: 'Calculate total sales, average order value, and conversion rates' },
        { name: 'Top Products', prompt: 'Identify best-selling products and underperformers' }
      ]
    },
    {
      name: 'Data Cleanup',
      rules: [
        { name: 'Remove Duplicates', prompt: 'Identify and remove duplicate rows' },
        { name: 'Fix Formatting', prompt: 'Standardize date formats and clean whitespace' }
      ]
    },
    {
      name: 'Construction KPIs',
      rules: [
        { name: 'Production Rate Analysis', prompt: 'Calculate daily production rates, identify bottlenecks, and compare to targets' },
        { name: 'Labor Productivity', prompt: 'Analyze man-hours per unit, crew efficiency, and overtime trends' },
        { name: 'Schedule Performance', prompt: 'Calculate Schedule Performance Index (SPI), identify delays, and forecast completion' }
      ]
    }
  ];

  const addSheet = () => {
    if (!currentUrl.trim()) return;
    if (!currentUrl.includes('docs.google.com/spreadsheets')) {
      setError('Please enter a valid Google Sheets URL');
      return;
    }
    setSheetUrls([...sheetUrls, currentUrl.trim()]);
    
    // Add to recent
    const newRecent = [currentUrl, ...recentSheets.filter(s => s !== currentUrl)].slice(0, 5);
    setRecentSheets(newRecent);
    localStorage.setItem('recentSheets', JSON.stringify(newRecent));
    
    setCurrentUrl('');
    setError('');
  };

  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    const newFiles = [];
    
    for (const file of uploadedFiles) {
      try {
        const text = await file.text();
        newFiles.push({ name: file.name, content: text, size: file.size });
      } catch (err) {
        setError(`Failed to read ${file.name}`);
      }
    }
    setLocalFiles([...localFiles, ...newFiles]);
  };

  const addRule = () => {
    if (!currentRule.name.trim() || !currentRule.prompt.trim()) {
      setError('Please provide both a rule name and prompt');
      return;
    }
    setRules([...rules, { ...currentRule, id: Date.now() }]);
    setCurrentRule({ name: '', prompt: '' });
    setError('');
  };

  const applyTemplate = (template) => {
    setRules(template.rules.map(r => ({ ...r, id: Date.now() + Math.random() })));
    setSuccess(`Applied "${template.name}" with ${template.rules.length} rules`);
    setTimeout(() => setSuccess(''), 3000);
    setActiveTab('sheets');
  };

  const addKpi = () => {
    if (!currentKpi.name || !currentKpi.metric) {
      setError('Please provide KPI name and metric');
      return;
    }
    setKpis([...kpis, { ...currentKpi, id: Date.now() }]);
    setCurrentKpi({ name: '', metric: '', target: '', chartType: 'line' });
    setShowKpiBuilder(false);
    setSuccess('KPI added successfully');
    setTimeout(() => setSuccess(''), 2000);
  };

  const addAutomation = () => {
    if (!currentAutomation.name || !currentAutomation.condition) {
      setError('Please provide automation name and condition');
      return;
    }

    let updatedAutomations;
    if (editingAutomation) {
      // Update existing automation
      updatedAutomations = automations.map(a =>
        a.id === editingAutomation.id
          ? { ...currentAutomation, id: editingAutomation.id, active: a.active }
          : a
      );
      setSuccess('Automation updated successfully!');
    } else {
      // Create new automation
      updatedAutomations = [...automations, { ...currentAutomation, id: Date.now(), active: true }];
      setSuccess('Automation created! Note: Deploy to activate scheduled runs.');
    }

    setAutomations(updatedAutomations);
    saveAutomations(updatedAutomations);

    setCurrentAutomation({
      name: '',
      schedule: 'daily',
      time: '09:00',
      condition: '',
      threshold: '',
      notifyEmail: '',
      notifyMethod: 'browser'
    });
    setEditingAutomation(null);
    setShowAutomationBuilder(false);
    setTimeout(() => setSuccess(''), 4000);
  };

  const removeAutomation = (id) => {
    if (confirm('Are you sure you want to delete this automation? This action cannot be undone.')) {
      const updatedAutomations = automations.filter(a => a.id !== id);
      setAutomations(updatedAutomations);
      saveAutomations(updatedAutomations);
      setSuccess('Automation deleted');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const removeRule = (id) => {
    if (confirm('Delete this rule?')) {
      setRules(rules.filter(r => r.id !== id));
    }
  };

  const removeKpi = (id) => {
    if (confirm('Delete this KPI?')) {
      setKpis(kpis.filter(k => k.id !== id));
    }
  };

  const removeSheet = (index) => {
    if (confirm('Remove this Google Sheet?')) {
      setSheetUrls(sheetUrls.filter((_, i) => i !== index));
    }
  };

  const removeFile = (index) => {
    if (confirm('Remove this file?')) {
      setLocalFiles(localFiles.filter((_, i) => i !== index));
    }
  };

  const toggleAutomation = (id) => {
    const updatedAutomations = automations.map(a =>
      a.id === id ? { ...a, active: !a.active } : a
    );
    setAutomations(updatedAutomations);
    saveAutomations(updatedAutomations);
  };

  const testAutomation = () => {
    if (!currentAutomation.name || !currentAutomation.condition) {
      setError('Please fill in automation details before testing');
      return;
    }

    const title = `🧪 Test: ${currentAutomation.name}`;
    const body = `This is a test notification. Condition: ${currentAutomation.condition}`;

    if (currentAutomation.notifyMethod === 'browser') {
      sendBrowserNotification(title, body);
      setSuccess('Test notification sent! Check your desktop.');
    } else {
      setSuccess(`Test would send via ${currentAutomation.notifyMethod}`);
    }

    setTimeout(() => setSuccess(''), 3000);
  };

  const editAutomation = (automation) => {
    setEditingAutomation(automation);
    setCurrentAutomation({
      name: automation.name,
      schedule: automation.schedule,
      time: automation.time,
      condition: automation.condition,
      threshold: automation.threshold || '',
      notifyEmail: automation.notifyEmail || '',
      notifyMethod: automation.notifyMethod
    });
    setShowAutomationBuilder(true);
  };

  const cancelEdit = () => {
    setEditingAutomation(null);
    setCurrentAutomation({
      name: '',
      schedule: 'daily',
      time: '09:00',
      condition: '',
      threshold: '',
      notifyEmail: '',
      notifyMethod: 'browser'
    });
    setShowAutomationBuilder(false);
  };

  const sendBrowserNotification = (title, body) => {
    console.log('sendBrowserNotification called:', { title, body });

    if (!('Notification' in window)) {
      console.error('Browser does not support notifications');
      setError('Browser notifications are not supported in your browser');
      return;
    }

    console.log('Notification permission status:', Notification.permission);

    if (Notification.permission === 'granted') {
      console.log('Sending notification...');
      try {
        new Notification(title, {
          body: body,
          icon: '🔔',
          badge: '🔔',
          tag: 'janus-notification',
          requireInteraction: false
        });
        console.log('Notification sent successfully!');
      } catch (err) {
        console.error('Failed to send notification:', err);
        setError(`Failed to send notification: ${err.message}`);
      }
    } else if (Notification.permission === 'denied') {
      console.warn('Notifications are blocked. Please enable them in your browser settings.');
      setError('Notifications are blocked. Check your browser settings to enable them for this site.');
    } else {
      console.log('Requesting notification permission...');
      Notification.requestPermission().then(permission => {
        console.log('Permission response:', permission);
        if (permission === 'granted') {
          new Notification(title, { body: body, icon: '🔔' });
          console.log('Notification sent after permission granted!');
        } else {
          console.warn('Notification permission denied by user');
        }
      });
    }
  };

  const checkAutomations = (resultText, sources = [], rulesApplied = []) => {
    console.log('Checking automations. Active automations:', automations.filter(a => a.active).length);

    if (automations.length === 0) {
      console.log('No automations configured');
      return;
    }

    let triggeredCount = 0;

    // Format sources for email
    const sourcesInfo = sources.map((s, i) =>
      s.url ? `${i + 1}. ${s.source}: ${s.url}` : `${i + 1}. ${s.source}: ${s.name}`
    ).join('\n');

    // Format rules for email
    const rulesInfo = rulesApplied.map((r, i) =>
      `${i + 1}. ${r.name}: ${r.prompt}`
    ).join('\n');

    automations.forEach(auto => {
      if (!auto.active) {
        console.log(`Skipping inactive automation: ${auto.name}`);
        return;
      }

      console.log(`Checking automation: "${auto.name}" for condition: "${auto.condition}"`);

      // Simple keyword matching for conditions
      const conditionMet = resultText.toLowerCase().includes(auto.condition.toLowerCase());

      // Check if threshold is mentioned or condition appears to be met
      if (conditionMet || (auto.threshold && resultText.includes(auto.threshold))) {
        console.log(`✅ Condition MET for: ${auto.name}`);
        triggeredCount++;

        const title = `🚨 Janus Alert: ${auto.name}`;
        const body = `Condition detected: ${auto.condition}${auto.threshold ? ` (${auto.threshold})` : ''}`;

        // Send browser notification
        if (auto.notifyMethod === 'browser') {
          console.log('Sending browser notification...');
          sendBrowserNotification(title, body);
        }

        // Send email notification with full details
        if (auto.notifyMethod === 'email' && auto.notifyEmail) {
          console.log('Sending email notification to:', auto.notifyEmail);
          fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: auto.notifyEmail,
              automationName: auto.name,
              condition: auto.condition,
              threshold: auto.threshold || null,
              aiResults: resultText,
              sources: sourcesInfo || 'No sources specified',
              rulesUsed: rulesInfo || 'No rules specified',
              timestamp: new Date().toISOString()
            })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              console.log('Email sent successfully!');
              setSuccess(`Alert sent via email to ${auto.notifyEmail}`);
              setTimeout(() => setSuccess(''), 3000);
            } else {
              console.error('Email send failed:', data);
              setError(`Failed to send email: ${data.error}`);
            }
          })
          .catch(err => {
            console.error('Email send error:', err);
            setError(`Email error: ${err.message}`);
          });
        }

        // Show prominent in-app alert banner
        setAutomationAlert(`🔔 Alert triggered: ${auto.name} - Condition "${auto.condition}" detected!`);
        setTimeout(() => setAutomationAlert(''), 5000);
      } else {
        console.log(`❌ Condition NOT met for: ${auto.name}. "${auto.condition}" not found in results.`);
      }
    });

    if (triggeredCount === 0) {
      console.log('No automation conditions were met in this run.');
    } else {
      console.log(`${triggeredCount} automation(s) triggered!`);
    }
  };

  const extractKpiData = (resultText) => {
    // Try to extract numeric data from the result for visualization
    const lines = resultText.split('\n');
    const dataPoints = [];
    
    lines.forEach(line => {
      // Look for patterns like "Day 1: 50 units" or "Week 1: $5000"
      const match = line.match(/(\w+\s*\d+)[:\s]+(\d+(?:\.\d+)?)/i);
      if (match) {
        dataPoints.push({
          label: match[1],
          value: parseFloat(match[2])
        });
      }
    });
    
    return dataPoints.length > 0 ? dataPoints : null;
  };

  const processSheets = async () => {
    const totalSources = sheetUrls.length + localFiles.length;
    if (totalSources === 0 || rules.length === 0) {
      setError('Please add data sources and rules');
      return;
    }

    setProcessing(true);
    setError('');
    setResult('');
    setProgress(0);

    try {
      setProgress(20);
      setProgressText('Fetching data...');
      
      const allData = [];
      
      for (let i = 0; i < sheetUrls.length; i++) {
        const sheetId = sheetUrls[i].match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
        if (!sheetId) throw new Error(`Invalid sheet URL: ${sheetUrls[i]}`);
        
        const response = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`);
        if (!response.ok) throw new Error('Unable to access sheet. Check sharing settings.');
        
        const csvText = await response.text();
        allData.push({ source: `Google Sheet ${i + 1}`, url: sheetUrls[i], data: csvText });
      }

      localFiles.forEach((file, i) => {
        allData.push({ source: `Local File ${i + 1}`, name: file.name, data: file.content });
      });

      setProgress(50);
      setProgressText('Processing with AI...');

      const rulesPrompt = rules.map((rule, idx) => `RULE ${idx + 1}: ${rule.name}\n${rule.prompt}\n`).join('\n');
      const sourcesContent = allData.map((source, idx) => {
        const header = source.url ? `SOURCE ${idx + 1}: ${source.source}\nURL: ${source.url}` : `SOURCE ${idx + 1}: ${source.source} (${source.name})`;
        return `${header}\nDATA:\n${source.data.slice(0, 20000)}\n\n`;
      }).join('\n');

      console.log('Sending request to API with', allData.length, 'sources and', rules.length, 'rules');

      let response;
      try {
        // Available models (try in this order if one fails):
        // - 'claude-3-opus-20240229' (most capable, requires higher-tier API key)
        // - 'claude-3-sonnet-20240229' (balanced)
        // - 'claude-3-haiku-20240307' (fastest, most accessible)
        response = await fetch('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 4096,
            messages: [{
              role: 'user',
              content: `You are Janus, a data processing agent. Process ${allData.length} source(s) with these rules:\n\n${rulesPrompt}\n\nDATA SOURCES:\n${sourcesContent}\n\nFor each rule, provide: 1) What you're doing 2) Results 3) Insights\n\n${kpis.length > 0 ? `\nIMPORTANT: Also calculate these KPIs and format data for visualization:\n${kpis.map(k => `- ${k.name}: ${k.metric} (Target: ${k.target || 'N/A'})`).join('\n')}\n\nFor each KPI, provide data in format: "Label: Value" on separate lines for easy parsing.` : ''}`
            }]
          })
        });
      } catch (fetchError) {
        throw new Error(`Network error: ${fetchError.message}. Make sure the API endpoint is deployed.`);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error(`Failed to parse API response: ${parseError.message}`);
      }

      // Handle API errors
      if (!response.ok) {
        console.error('API Error Response:', data);
        // Extract error message from Anthropic API response structure
        let errorMessage = `API error: ${response.status}`;
        if (data.error && typeof data.error === 'object') {
          errorMessage = data.error.message || JSON.stringify(data.error);
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        }
        setError(errorMessage);
        return;
      }

      console.log('API Response received:', { hasContent: !!data.content, contentLength: data.content?.length });

      setProgress(100);
      setProgressText('Complete!');

      // Validate response structure
      if (data.content && Array.isArray(data.content) && data.content[0]?.text) {
        const resultText = data.content[0].text;
        console.log('Successfully extracted result text, length:', resultText.length);
        setResult(resultText);

        // Check automations and send notifications if conditions met
        checkAutomations(resultText, allData, rules);
      } else {
        console.error('Unexpected response format:', data);
        setError(`Unexpected response format. Expected content array but got: ${JSON.stringify(data).slice(0, 200)}`);
      }
    } catch (err) {
      console.error('processSheets error:', err);
      const errorMessage = err?.message || err?.toString() || 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setProcessing(false);
      setProgressText('');
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const downloadResult = () => {
    const formats = {
      txt: 'text/plain',
      csv: 'text/csv',
      json: 'application/json'
    };
    const blob = new Blob([result], { type: formats[exportFormat] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `janus_results.${exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={`min-h-screen ${bgClass} p-6 transition-colors`}>
      <div className="max-w-5xl mx-auto">
        <div className={`${cardClass} rounded-lg shadow-2xl p-8 border transition-colors`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-4xl font-bold ${textClass}`}>Janus v2.1</h1>
              <span className="text-sm text-teal-400">AI Data Processing Agent</span>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition" title="Toggle theme (Alt+T)">
              {darkMode ? <Sun className="w-6 h-6 text-slate-300" /> : <Moon className="w-6 h-6 text-slate-600" />}
            </button>
          </div>

          <p className={`${textSecondary} mb-6`}>
            Connect Google Sheets or upload files, define rules, and let Janus process your data intelligently.
          </p>

          {/* Progress Bar */}
          {progress > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-teal-400">{progressText}</span>
                <span className="text-sm text-slate-400">{progress}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-teal-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-900/20 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-sm text-green-300">{typeof success === 'string' ? success : JSON.stringify(success)}</p>
            </div>
          )}

          {/* Automation Alert Banner */}
          {automationAlert && (
            <div className="mb-6 bg-amber-900/30 border-2 border-amber-500 rounded-lg p-4 flex items-center gap-3 animate-pulse shadow-lg">
              <Bell className="w-6 h-6 text-amber-400 animate-bounce" />
              <div className="flex-1">
                <p className="text-base font-bold text-amber-300">{automationAlert}</p>
                <p className="text-xs text-amber-400 mt-1">Browser notification sent (check if tab is in background)</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-700 overflow-x-auto">
            <button onClick={() => setActiveTab('sheets')} className={`px-4 py-2 font-medium transition whitespace-nowrap ${activeTab === 'sheets' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-400'}`}>Google Sheets</button>
            <button onClick={() => setActiveTab('files')} className={`px-4 py-2 font-medium transition whitespace-nowrap ${activeTab === 'files' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-400'}`}>Local Files</button>
            <button onClick={() => setActiveTab('templates')} className={`px-4 py-2 font-medium transition whitespace-nowrap ${activeTab === 'templates' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-400'}`}>Templates</button>
            <button onClick={() => setActiveTab('kpis')} className={`px-4 py-2 font-medium transition whitespace-nowrap ${activeTab === 'kpis' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-400'}`}>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                KPIs
              </div>
            </button>
            <button onClick={() => setActiveTab('automations')} className={`px-4 py-2 font-medium transition whitespace-nowrap ${activeTab === 'automations' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-400'}`}>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Automations
                {automations.filter(a => a.active).length > 0 && (
                  <span className="bg-teal-500 text-slate-900 text-xs px-1.5 py-0.5 rounded-full">{automations.filter(a => a.active).length}</span>
                )}
              </div>
            </button>
          </div>

          {/* Google Sheets Tab */}
          {activeTab === 'sheets' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-teal-400 mb-2">Google Sheets URLs</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentUrl}
                    onChange={(e) => setCurrentUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSheet()}
                    placeholder="Paste Google Sheets URL"
                    className={`flex-1 px-4 py-2 ${inputClass} border rounded-lg focus:ring-2 focus:ring-teal-400`}
                  />
                  <button onClick={addSheet} className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-medium rounded-lg transition">Add</button>
                </div>
                {recentSheets.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs text-slate-500">Recent:</span>
                    {recentSheets.slice(0, 3).map((url, i) => (
                      <button key={i} onClick={() => setCurrentUrl(url)} className="text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded">
                        Sheet {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {sheetUrls.length > 0 && (
                <div className="mb-6 space-y-2">
                  {sheetUrls.map((url, i) => (
                    <div key={i} className={`flex items-center justify-between ${inputClass} border rounded-lg p-3`}>
                      <div className="flex items-center gap-3">
                        <Table className="w-5 h-5 text-teal-400" />
                        <p className="text-sm truncate max-w-md">{url}</p>
                      </div>
                      <button onClick={() => removeSheet(i)} className="text-slate-500 hover:text-red-400">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Local Files Tab */}
          {activeTab === 'files' && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-teal-400 mb-2">Upload Files</label>
                <div className="border-2 border-dashed border-teal-500/40 rounded-lg p-6 text-center cursor-pointer hover:border-teal-400/60 transition">
                  <input type="file" onChange={handleFileUpload} accept=".csv,.json,.txt,.tsv" multiple className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-teal-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-300">Click to upload CSV, JSON, or TXT files</p>
                  </label>
                </div>
              </div>
              {localFiles.length > 0 && (
                <div className="space-y-2">
                  {localFiles.map((file, i) => (
                    <div key={i} className={`flex items-center justify-between ${inputClass} border rounded-lg p-3`}>
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-teal-400" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button onClick={() => removeFile(i)} className="text-slate-500 hover:text-red-400">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {ruleTemplates.map((template, i) => (
                <div key={i} onClick={() => applyTemplate(template)} className={`${inputClass} border rounded-lg p-4 cursor-pointer hover:border-teal-500 transition`}>
                  <h4 className="text-sm font-medium text-teal-400 mb-1">{template.name}</h4>
                  <p className="text-xs text-slate-500">{template.rules.length} rules</p>
                </div>
              ))}
            </div>
          )}

          {/* KPIs Tab */}
          {activeTab === 'kpis' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-300">Define custom KPIs to track and visualize</p>
                <button onClick={() => setShowKpiBuilder(!showKpiBuilder)} className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-medium rounded-lg transition text-sm">
                  {showKpiBuilder ? 'Cancel' : '+ New KPI'}
                </button>
              </div>

              {showKpiBuilder && (
                <div className={`${inputClass} border rounded-lg p-4 mb-4`}>
                  <h4 className="text-sm font-medium text-teal-400 mb-3">Create Custom KPI</h4>
                  <input
                    type="text"
                    value={currentKpi.name}
                    onChange={(e) => setCurrentKpi({ ...currentKpi, name: e.target.value })}
                    placeholder="KPI Name (e.g., Daily Production Rate)"
                    className={`w-full px-4 py-2 ${inputClass} border rounded-lg focus:ring-2 focus:ring-teal-400 mb-2`}
                  />
                  <textarea
                    value={currentKpi.metric}
                    onChange={(e) => setCurrentKpi({ ...currentKpi, metric: e.target.value })}
                    placeholder="What to measure (e.g., Units completed per day)"
                    className={`w-full h-20 px-4 py-2 ${inputClass} border rounded-lg focus:ring-2 focus:ring-teal-400 mb-2`}
                  />
                  <input
                    type="text"
                    value={currentKpi.target}
                    onChange={(e) => setCurrentKpi({ ...currentKpi, target: e.target.value })}
                    placeholder="Target value (optional)"
                    className={`w-full px-4 py-2 ${inputClass} border rounded-lg focus:ring-2 focus:ring-teal-400 mb-2`}
                  />
                  <div className="mb-3">
                    <label className="block text-xs text-slate-400 mb-2">Chart Type</label>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrentKpi({ ...currentKpi, chartType: 'line' })} className={`flex-1 px-3 py-2 rounded-lg transition ${currentKpi.chartType === 'line' ? 'bg-teal-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
                        <div className="flex items-center justify-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Line
                        </div>
                      </button>
                      <button onClick={() => setCurrentKpi({ ...currentKpi, chartType: 'bar' })} className={`flex-1 px-3 py-2 rounded-lg transition ${currentKpi.chartType === 'bar' ? 'bg-teal-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
                        <div className="flex items-center justify-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Bar
                        </div>
                      </button>
                      <button onClick={() => setCurrentKpi({ ...currentKpi, chartType: 'pie' })} className={`flex-1 px-3 py-2 rounded-lg transition ${currentKpi.chartType === 'pie' ? 'bg-teal-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
                        <div className="flex items-center justify-center gap-2">
                          <PieChart className="w-4 h-4" />
                          Pie
                        </div>
                      </button>
                    </div>
                  </div>
                  <button onClick={addKpi} className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition">
                    Add KPI
                  </button>
                </div>
              )}

              {kpis.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Active KPIs ({kpis.length}):</p>
                  {kpis.map((kpi) => (
                    <div key={kpi.id} className={`${inputClass} border rounded-lg p-3`}>
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          {kpi.chartType === 'line' && <TrendingUp className="w-4 h-4 text-teal-400" />}
                          {kpi.chartType === 'bar' && <BarChart3 className="w-4 h-4 text-teal-400" />}
                          {kpi.chartType === 'pie' && <PieChart className="w-4 h-4 text-teal-400" />}
                          <h4 className="text-sm font-medium text-teal-400">{kpi.name}</h4>
                        </div>
                        <button onClick={() => removeKpi(kpi.id)} className="text-slate-500 hover:text-red-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400">{kpi.metric}</p>
                      {kpi.target && <p className="text-xs text-slate-500 mt-1">Target: {kpi.target}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`${inputClass} border border-dashed rounded-lg p-8 text-center`}>
                  <TrendingUp className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No KPIs defined yet</p>
                  <p className="text-xs text-slate-500 mt-1">Create custom KPIs to track metrics and visualize data</p>
                </div>
              )}
            </div>
          )}

          {/* Automations Tab */}
          {activeTab === 'automations' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-300">Set up automatic monitoring and alerts</p>
                <button onClick={() => editingAutomation ? cancelEdit() : setShowAutomationBuilder(!showAutomationBuilder)} className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-medium rounded-lg transition text-sm">
                  {showAutomationBuilder ? 'Cancel' : '+ New Automation'}
                </button>
              </div>

              {showAutomationBuilder && (
                <div className={`${inputClass} border rounded-lg p-4 mb-4`}>
                  <h4 className="text-sm font-medium text-teal-400 mb-3">
                    {editingAutomation ? 'Edit Automation' : 'Create Automation'}
                  </h4>
                  
                  <input
                    type="text"
                    value={currentAutomation.name}
                    onChange={(e) => setCurrentAutomation({ ...currentAutomation, name: e.target.value })}
                    placeholder="Automation name (e.g., Daily Production Alert)"
                    className={`w-full px-4 py-2 ${inputClass} border rounded-lg focus:ring-2 focus:ring-teal-400 mb-3`}
                  />

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Schedule</label>
                      <select
                        value={currentAutomation.schedule}
                        onChange={(e) => setCurrentAutomation({ ...currentAutomation, schedule: e.target.value })}
                        className={`w-full px-3 py-2 ${inputClass} border rounded-lg`}
                      >
                        <option value="hourly">Every Hour</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="realtime">Real-time (on change)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Time</label>
                      <input
                        type="time"
                        value={currentAutomation.time}
                        onChange={(e) => setCurrentAutomation({ ...currentAutomation, time: e.target.value })}
                        className={`w-full px-3 py-2 ${inputClass} border rounded-lg`}
                      />
                    </div>
                  </div>

                  <textarea
                    value={currentAutomation.condition}
                    onChange={(e) => setCurrentAutomation({ ...currentAutomation, condition: e.target.value })}
                    placeholder="When to notify (e.g., Production rate drops below target)"
                    className={`w-full h-20 px-4 py-2 ${inputClass} border rounded-lg focus:ring-2 focus:ring-teal-400 mb-3`}
                  />

                  <input
                    type="text"
                    value={currentAutomation.threshold}
                    onChange={(e) => setCurrentAutomation({ ...currentAutomation, threshold: e.target.value })}
                    placeholder="Threshold value (e.g., < 80 units/day)"
                    className={`w-full px-4 py-2 ${inputClass} border rounded-lg focus:ring-2 focus:ring-teal-400 mb-3`}
                  />

                  <div className="mb-3">
                    <label className="block text-xs text-slate-400 mb-2">Notification Method</label>
                    <div className="grid grid-cols-4 gap-2">
                      <button 
                        onClick={() => setCurrentAutomation({ ...currentAutomation, notifyMethod: 'browser' })}
                        className={`px-3 py-2 rounded-lg transition ${currentAutomation.notifyMethod === 'browser' ? 'bg-teal-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Bell className="w-4 h-4" />
                          <span className="text-xs">Browser</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => setCurrentAutomation({ ...currentAutomation, notifyMethod: 'email' })}
                        className={`px-3 py-2 rounded-lg transition ${currentAutomation.notifyMethod === 'email' ? 'bg-teal-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Mail className="w-4 h-4" />
                          <span className="text-xs">Email</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => setCurrentAutomation({ ...currentAutomation, notifyMethod: 'slack' })}
                        className={`px-3 py-2 rounded-lg transition ${currentAutomation.notifyMethod === 'slack' ? 'bg-teal-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Bell className="w-4 h-4" />
                          <span className="text-xs">Slack</span>
                        </div>
                      </button>
                      <button 
                        onClick={() => setCurrentAutomation({ ...currentAutomation, notifyMethod: 'sms' })}
                        className={`px-3 py-2 rounded-lg transition ${currentAutomation.notifyMethod === 'sms' ? 'bg-teal-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Bell className="w-4 h-4" />
                          <span className="text-xs">SMS</span>
                        </div>
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {currentAutomation.notifyMethod === 'browser' && '✅ No setup required - works immediately'}
                      {currentAutomation.notifyMethod === 'email' && '⚠️ Requires email service setup'}
                      {currentAutomation.notifyMethod === 'slack' && '⚠️ Requires Slack webhook URL'}
                      {currentAutomation.notifyMethod === 'sms' && '⚠️ Requires SMS service setup'}
                    </p>
                  </div>

                  {currentAutomation.notifyMethod === 'email' && (
                    <input
                      type="email"
                      value={currentAutomation.notifyEmail}
                      onChange={(e) => setCurrentAutomation({ ...currentAutomation, notifyEmail: e.target.value })}
                      placeholder="Email address for notifications"
                      className={`w-full px-4 py-2 ${inputClass} border rounded-lg focus:ring-2 focus:ring-teal-400 mb-3`}
                    />
                  )}

                  <button onClick={addAutomation} className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition">
                    {editingAutomation ? 'Update Automation' : 'Create Automation'}
                  </button>
                  <button 
                    onClick={testAutomation} 
                    className="w-full mt-2 px-4 py-2 bg-blue-900/20 hover:bg-blue-900/30 text-blue-400 font-medium rounded-lg transition border border-blue-500/30"
                  >
                    🧪 Test Notification
                  </button>
                  {editingAutomation && (
                    <button onClick={cancelEdit} className="w-full mt-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/30 text-red-400 font-medium rounded-lg transition border border-red-500/30">
                      Cancel Edit
                    </button>
                  )}
                </div>
              )}

              {automations.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-400">Active Automations ({automations.filter(a => a.active).length}/{automations.length}):</p>
                  {automations.map((auto) => (
                    <div key={auto.id} className={`${inputClass} border rounded-lg p-4`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={() => toggleAutomation(auto.id)}
                            className={`mt-1 w-10 h-6 rounded-full transition-colors ${auto.active ? 'bg-teal-500' : 'bg-slate-600'} relative flex-shrink-0`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${auto.active ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Clock className="w-4 h-4 text-teal-400 flex-shrink-0" />
                              <h4 className="text-sm font-medium text-teal-400 break-words">{auto.name}</h4>
                              {auto.active && (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded flex-shrink-0">Active</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mb-1 break-words">{auto.condition}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                              <span className="flex-shrink-0">📅 {auto.schedule} at {auto.time}</span>
                              <span className="break-words">📊 {auto.threshold || 'No threshold'}</span>
                              <span className="flex-shrink-0">
                                {auto.notifyMethod === 'browser' && '🔔 Browser'}
                                {auto.notifyMethod === 'email' && '📧 Email'}
                                {auto.notifyMethod === 'slack' && '💬 Slack'}
                                {auto.notifyMethod === 'sms' && '📱 SMS'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          <button 
                            onClick={() => editAutomation(auto)} 
                            className="text-slate-400 hover:text-teal-400 transition"
                            title="Edit automation"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => removeAutomation(auto.id)} 
                            className="text-slate-500 hover:text-red-400 transition"
                            title="Delete automation"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`${inputClass} border border-dashed rounded-lg p-8 text-center`}>
                  <Zap className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No automations configured</p>
                  <p className="text-xs text-slate-500 mt-1">Set up automatic monitoring to get notified when conditions are met</p>
                </div>
              )}

              {automations.length > 0 && (
                <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-xs text-blue-300 mb-1">💡 <strong>How Automations Work:</strong></p>
                  <ul className="text-xs text-blue-300 space-y-1">
                    <li>• Automations check conditions when you click "Run Janus"</li>
                    <li>• If your condition keyword appears in results, you'll get a notification</li>
                    <li>• Check browser console (F12) to see detailed automation logs</li>
                    <li>• Make sure browser notifications are enabled for this site</li>
                    <li>• Note: Schedule/time fields are stored but not currently used for automatic runs</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Rules */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-teal-400 mb-2">Rules & Prompts</label>
            <input
              type="text"
              value={currentRule.name}
              onChange={(e) => setCurrentRule({ ...currentRule, name: e.target.value })}
              placeholder="Rule name"
              className={`w-full px-4 py-2 ${inputClass} border rounded-lg focus:ring-2 focus:ring-teal-400 mb-2`}
            />
            <textarea
              value={currentRule.prompt}
              onChange={(e) => setCurrentRule({ ...currentRule, prompt: e.target.value })}
              placeholder="What should Janus do?"
              className={`w-full h-24 px-4 py-2 ${inputClass} border rounded-lg focus:ring-2 focus:ring-teal-400 mb-2`}
            />
            <button onClick={addRule} className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition">
              Add Rule (Ctrl+Enter)
            </button>

            {rules.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-slate-400">Active Rules ({rules.length}):</p>
                {rules.map((rule) => (
                  <div key={rule.id} className={`${inputClass} border rounded-lg p-3`}>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-medium text-teal-400">{rule.name}</h4>
                      <button onClick={() => setRules(rules.filter(r => r.id !== rule.id))} className="text-slate-500 hover:text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">{rule.prompt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Run Button */}
          <button
            onClick={processSheets}
            disabled={processing || (sheetUrls.length === 0 && localFiles.length === 0) || rules.length === 0}
            className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-slate-700 text-slate-900 disabled:text-slate-600 font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><Play className="w-5 h-5" /> Run Janus (Ctrl+R)</>}
          </button>

          {/* Error */}
          {error && (
            <div className="mt-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{typeof error === 'string' ? error : JSON.stringify(error)}</p>
            </div>
          )}

          {/* Result with KPI Visualizations */}
          {result && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-teal-400">Results</label>
                <div className="flex gap-2">
                  <button onClick={copyToClipboard} className="flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300">
                    <Copy className="w-4 h-4" /> Copy
                  </button>
                  <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="text-sm bg-slate-700 text-slate-200 rounded px-2 py-1">
                    <option value="txt">TXT</option>
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                  </select>
                  <button onClick={downloadResult} className="flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300">
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>

              {/* KPI Visualizations */}
              {kpis.length > 0 && extractKpiData(result) && (
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {kpis.map((kpi) => {
                    const data = extractKpiData(result);
                    if (!data) return null;

                    const COLORS = ['#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

                    return (
                      <div key={kpi.id} className={`${inputClass} border rounded-lg p-4`}>
                        <h4 className="text-sm font-medium text-teal-400 mb-3">{kpi.name}</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          {kpi.chartType === 'line' && (
                            <LineChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#cbd5e1'} />
                              <XAxis dataKey="label" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
                              <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
                              <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: '1px solid #334155' }} />
                              <Line type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={2} dot={{ fill: '#14b8a6' }} />
                            </LineChart>
                          )}
                          {kpi.chartType === 'bar' && (
                            <BarChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#cbd5e1'} />
                              <XAxis dataKey="label" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
                              <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
                              <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: '1px solid #334155' }} />
                              <Bar dataKey="value" fill="#14b8a6" />
                            </BarChart>
                          )}
                          {kpi.chartType === 'pie' && (
                            <RePieChart>
                              <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={70} label>
                                {data.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', border: '1px solid #334155' }} />
                            </RePieChart>
                          )}
                        </ResponsiveContainer>
                        {kpi.target && (
                          <p className="text-xs text-slate-500 mt-2">Target: {kpi.target}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className={`${inputClass} border rounded-lg p-4 max-h-96 overflow-auto`}>
                <pre className="text-sm whitespace-pre-wrap font-mono">{result}</pre>
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts */}
          <div className={`mt-6 ${inputClass} border rounded-lg p-4`}>
            <h3 className="text-sm font-medium text-teal-400 mb-2">Keyboard Shortcuts:</h3>
            <div className="text-xs text-slate-400 grid grid-cols-2 gap-2">
              <div>• Ctrl+R - Run Janus</div>
              <div>• Ctrl+Enter - Add Rule</div>
              <div>• Alt+T - Toggle Theme</div>
              <div>• Ctrl+C - Copy Results</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap with Error Boundary and export
export default function App() {
  return (
    <ErrorBoundary>
      <JanusEnhanced />
    </ErrorBoundary>
  );
}
