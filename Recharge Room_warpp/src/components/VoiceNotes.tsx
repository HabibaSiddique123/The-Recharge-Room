import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause,
  Save, 
  Trash2, 
  Copy, 
  Download,
  FileText,
  Search,
  Volume2,
  Square
} from 'lucide-react';
import { ManualInputModal } from './ManualInputModal';
import { userStorage } from '../utils/userStorage';

export function VoiceNotes() {
  const [notes, setNotes] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPlaying, setIsPlaying] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [micPermission, setMicPermission] = useState('unknown');
  const [permissionError, setPermissionError] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    // Load notes from user-specific storage
    const savedNotes = userStorage.getItem('recharge_voices') || [];
    setNotes(savedNotes);
    
    // Check microphone permission status
    checkMicrophonePermission();
    
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            
            // Add confidence indicator for final transcript
            if (confidence && confidence < 0.8) {
              console.log('Low confidence transcription detected:', transcript);
            }
          } else {
            interimTranscript += transcript;
          }
        }
        
        // For final results, append to existing transcript
        if (finalTranscript) {
          setCurrentTranscript(prev => prev + finalTranscript + ' ');
          setLiveTranscript(''); // Clear interim transcript
        }
        
        // For interim results, show live typing
        if (interimTranscript) {
          setLiveTranscript(interimTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setIsTranscribing(false);
        setLiveTranscript('');
        if (event.error === 'not-allowed') {
          setPermissionError('Microphone access was denied. Please enable microphone permissions in your browser settings.');
          setMicPermission('denied');
        }
      };
      
      recognitionRef.current.onend = () => {
        if (isRecording) {
          recognitionRef.current.start();
        } else {
          setIsTranscribing(false);
          setLiveTranscript('');
        }
      };
    }
  }, [isRecording]);

  const checkMicrophonePermission = async () => {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'microphone' });
        setMicPermission(permission.state);
        
        permission.onchange = () => {
          setMicPermission(permission.state);
        };
      }
    } catch (error) {
      console.log('Permission API not supported');
    }
  };

  // Auto-save draft functionality
  useEffect(() => {
    if (currentTranscript.trim()) {
      const draftNote = {
        id: 'draft',
        title: draftTitle || `Draft - ${new Date().toLocaleDateString()}`,
        transcript: currentTranscript,
        isDraft: true,
        createdAt: new Date().toISOString()
      };
      
      const drafts = userStorage.getItem('recharge_voice_drafts') || [];
      const updatedDrafts = drafts.filter(d => d.id !== 'draft').concat(draftNote);
      userStorage.setItem('recharge_voice_drafts', updatedDrafts);
    }
  }, [currentTranscript, draftTitle]);

  const startRecording = async () => {
    setPermissionError('');
    
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start audio recording
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.start();
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
      setIsRecording(true);
      setIsTranscribing(true);
      setCurrentTranscript('');
      setLiveTranscript('');
      setMicPermission('granted');
    } catch (error) {
      console.error('Error starting recording:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionError('Microphone access was denied. Please enable microphone permissions and try again.');
        setMicPermission('denied');
      } else if (error.name === 'NotFoundError') {
        setPermissionError('No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotReadableError') {
        setPermissionError('Microphone is already in use by another application.');
      } else {
        setPermissionError('Unable to access microphone. Please check your browser settings.');
      }
      setIsRecording(false);
      setIsTranscribing(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setIsRecording(false);
  };

  const saveNote = (manualTranscript = null) => {
    const transcriptToSave = manualTranscript || currentTranscript;
    if (!transcriptToSave.trim()) return;
    
    const note = {
      id: Date.now(),
      title: draftTitle.trim() || `Voice Note - ${new Date().toLocaleDateString()}`,
      transcript: transcriptToSave.trim(),
      createdAt: new Date().toISOString(),
      audioBlob: audioChunksRef.current.length > 0 ? new Blob(audioChunksRef.current, { type: 'audio/wav' }) : null,
      isManual: !!manualTranscript
    };
    
    const updatedNotes = [...notes, note];
    setNotes(updatedNotes);
    userStorage.setItem('recharge_voices', updatedNotes);
    
    // Clear draft
    setCurrentTranscript('');
    setDraftTitle('');
    setShowManualInput(false);
    userStorage.removeItem('recharge_voice_drafts');
    
    // Check for achievements
    checkVoiceAchievements(updatedNotes);
  };

  const checkVoiceAchievements = (notesList) => {
    const badges = userStorage.getItem('recharge_badges') || [];
    
    // First voice note badge
    if (notesList.length === 1 && !badges.find(b => b.id === 'first_voice')) {
      const newBadge = {
        id: 'first_voice',
        name: 'Voice Explorer',
        description: 'Recorded your first voice note',
        emoji: '🎤',
        unlockedAt: new Date().toISOString()
      };
      badges.push(newBadge);
      userStorage.setItem('recharge_badges', badges);
      
      // Show celebration
      import('./Confetti').then(({ showConfetti }) => {
        showConfetti();
      });
    }
    
    // Voice enthusiast badge
    if (notesList.length >= 10 && !badges.find(b => b.id === 'voice_enthusiast')) {
      const newBadge = {
        id: 'voice_enthusiast',
        name: 'Voice Enthusiast',
        description: 'Recorded 10 voice notes',
        emoji: '🗣️',
        unlockedAt: new Date().toISOString()
      };
      badges.push(newBadge);
      userStorage.setItem('recharge_badges', badges);
    }
  };

  const deleteNote = (noteId) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);
    userStorage.setItem('recharge_voices', updatedNotes);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
    });
  };

  const downloadTranscript = (note) => {
    const blob = new Blob([note.transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${note.title}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.transcript.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Voice Notes 🎤
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Record your thoughts and convert speech to text in real-time.
        </p>
      </div>

      {/* Permission and Support Warnings */}
      {!isRecognitionSupported && (
        <Card className="mb-8 border-yellow-200 bg-yellow-50 dark:bg-yellow-900 dark:border-yellow-700">
          <CardContent className="p-4">
            <p className="text-yellow-800 dark:text-yellow-200">
              ⚠️ Speech recognition is not supported in your browser. You can still create text notes manually.
            </p>
          </CardContent>
        </Card>
      )}

      {permissionError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="border-red-200 bg-red-50 dark:bg-red-900 dark:border-red-700">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="text-red-500">🎤</div>
                <div>
                  <h4 className="text-red-800 dark:text-red-200 font-medium mb-2">
                    Microphone Access Required
                  </h4>
                  <p className="text-red-700 dark:text-red-300 text-sm mb-3">
                    {permissionError}
                  </p>
                  <div className="text-red-700 dark:text-red-300 text-sm">
                    <p className="mb-2">To enable microphone access:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Click the 🔒 or 🎤 icon in your browser's address bar</li>
                      <li>Select "Allow" for microphone permissions</li>
                      <li>Refresh the page and try again</li>
                    </ul>
                  </div>
                  <Button
                    onClick={() => setShowManualInput(true)}
                    variant="outline"
                    size="sm"
                    className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Create Text Note Instead
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {micPermission === 'denied' && !permissionError && (
        <Card className="mb-8 border-orange-200 bg-orange-50 dark:bg-orange-900 dark:border-orange-700">
          <CardContent className="p-4">
            <p className="text-orange-800 dark:text-orange-200">
              🔒 Microphone access is currently blocked. You can still create text notes manually.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recording Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Voice Recorder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-red-500" />
                Voice Recorder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recording Controls */}
              <div className="flex items-center justify-center space-x-6">
                {isRecognitionSupported && micPermission !== 'denied' ? (
                  <motion.div
                    className="relative"
                    animate={isRecording ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                    transition={{ repeat: isRecording ? Infinity : 0, duration: 2 }}
                  >
                    {/* Pulsing Ring Animation */}
                    {isRecording && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-red-400"
                        animate={{
                          scale: [1, 2, 1],
                          opacity: [1, 0, 1]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        size="lg"
                        className={`w-20 h-20 rounded-full shadow-2xl border-4 border-white/20 backdrop-blur-sm transition-all duration-300 ${
                          isRecording 
                            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/30' 
                            : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-purple-500/30'
                        }`}
                      >
                        <motion.div
                          animate={isRecording ? { rotate: 360 } : { rotate: 0 }}
                          transition={isRecording ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
                        >
                          {isRecording ? (
                            <Square className="w-8 h-8" />
                          ) : (
                            <Mic className="w-8 h-8" />
                          )}
                        </motion.div>
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => setShowManualInput(true)}
                      size="lg"
                      className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-2xl border-4 border-white/20 backdrop-blur-sm"
                    >
                      <FileText className="w-8 h-8" />
                    </Button>
                  </motion.div>
                )}
              </div>
              
              {/* Status Indicator */}
              <div className="text-center">
                <AnimatePresence>
                  {isRecording ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-center space-x-2 text-red-500"
                    >
                      <motion.div
                        className="w-2 h-2 bg-red-500 rounded-full"
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span className="font-medium">Listening... Speak now! 🎤</span>
                    </motion.div>
                  ) : (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-gray-600 dark:text-gray-400 font-medium"
                    >
                      {isRecognitionSupported && micPermission !== 'denied' 
                        ? 'Click the microphone to start recording ✨' 
                        : 'Click to create a text note 📝'
                      }
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isRecording 
                    ? 'Recording... Click to stop' 
                    : isRecognitionSupported && micPermission !== 'denied'
                      ? 'Click to start recording'
                      : 'Click to create a text note'
                  }
                </p>
                {isRecording && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    className="h-1 bg-red-500 rounded-full mt-2"
                  />
                )}
              </div>

              {/* Draft Title */}
              <Input
                placeholder="Note title (optional)"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="mt-4"
              />

              {/* Live Transcript Display */}
              <motion.div 
                className={`min-h-48 p-6 border-2 rounded-2xl backdrop-blur-sm transition-all duration-500 relative overflow-hidden ${
                  isRecording 
                    ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900/30 dark:via-green-900/30 dark:to-teal-900/30 border-emerald-300 dark:border-emerald-600 shadow-2xl shadow-emerald-500/20' 
                    : 'bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 border-gray-300 dark:border-gray-600'
                }`}
                animate={isRecording ? {
                  boxShadow: [
                    "0 0 20px rgba(16, 185, 129, 0.2)",
                    "0 0 40px rgba(16, 185, 129, 0.4)",
                    "0 0 20px rgba(16, 185, 129, 0.2)"
                  ]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {/* Header with animated indicator */}
                <motion.div 
                  className="flex items-center justify-between mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
                        isRecording 
                          ? 'bg-emerald-500 text-white shadow-lg' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                      animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {isRecording ? (
                        <>
                          <motion.div
                            className="w-2 h-2 bg-white rounded-full"
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          Live Transcription
                        </>
                      ) : (
                        <>
                          <Mic className="w-3 h-3" />
                          Transcript Preview
                        </>
                      )}
                    </motion.div>
                    
                    {/* Real-time typing indicator */}
                    {isRecording && currentTranscript && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1 text-emerald-600 text-xs font-medium"
                      >
                        <motion.span
                          animate={{ y: [-2, 2, -2] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          🎤
                        </motion.span>
                        Processing speech...
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Word/Character Counter */}
                  <AnimatePresence>
                    {currentTranscript && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-right space-y-1"
                      >
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {currentTranscript.split(/\s+/).filter(word => word.length > 0).length} words
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {currentTranscript.length} chars
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                {/* Transcript Content */}
                <div className="relative">
                  <AnimatePresence>
                    {currentTranscript ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="prose prose-lg dark:prose-invert max-w-none"
                      >
                        <motion.p 
                          className="text-gray-800 dark:text-gray-200 leading-relaxed text-lg font-medium tracking-wide whitespace-pre-wrap"
                          initial={{ y: 20 }}
                          animate={{ y: 0 }}
                        >
                          {currentTranscript.split(' ').map((word, index) => (
                            <motion.span
                              key={index}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="inline-block mr-1"
                            >
                              {word}
                            </motion.span>
                          ))}
                          {/* Live transcript display */}
                          {liveTranscript && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="inline-block mr-1 text-emerald-600 dark:text-emerald-400 font-medium"
                            >
                              {liveTranscript}
                            </motion.span>
                          )}
                          {isRecording && (
                            <motion.span
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 1.2, repeat: Infinity }}
                              className="inline-block w-0.5 h-6 bg-emerald-500 ml-1 align-text-bottom"
                            />
                          )}
                        </motion.p>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-12 text-center space-y-4"
                      >
                        <motion.div
                          animate={isRecording ? { 
                            scale: [1, 1.2, 1],
                            rotate: [0, 5, -5, 0]
                          } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-6xl opacity-50"
                        >
                          {isRecording ? '🎤' : '📝'}
                        </motion.div>
                        
                        <div className="space-y-2">
                          <p className="text-gray-500 dark:text-gray-400 font-medium">
                            {isRecording 
                              ? 'Listening for your voice...' 
                              : 'Your transcription will appear here'
                            }
                          </p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            {isRecording 
                              ? 'Speak clearly for best results ✨' 
                              : 'Start recording to see real-time transcription'
                            }
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Floating completion celebration */}
                <AnimatePresence>
                  {!isRecording && currentTranscript && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0, rotate: -180 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute top-2 right-2"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="text-2xl"
                      >
                        ✨
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Actions */}
              <motion.div 
                className="flex justify-between items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentTranscript('');
                      setDraftTitle('');
                      // Add gentle feedback
                    }}
                    disabled={!currentTranscript.trim()}
                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </motion.div>
                
                <div className="flex gap-3">
                  {!isRecording && (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        onClick={() => setShowManualInput(true)}
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Text Input
                      </Button>
                    </motion.div>
                  )}
                  
                  <motion.div 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                    animate={currentTranscript.trim() ? {
                      boxShadow: [
                        "0 4px 20px rgba(34, 197, 94, 0.2)",
                        "0 8px 30px rgba(34, 197, 94, 0.4)",
                        "0 4px 20px rgba(34, 197, 94, 0.2)"
                      ]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Button
                      onClick={() => {
                        saveNote();
                        // Trigger celebration animation
                      }}
                      disabled={!currentTranscript.trim()}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                    >
                      <motion.div
                        animate={currentTranscript.trim() ? { rotate: 360 } : {}}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Save className="w-4 h-4 mr-2" />
                      </motion.div>
                      Save Note ✨
                      
                      {/* Shimmer effect on hover */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </CardContent>
          </Card>

          {/* Manual Text Input Modal */}
          <AnimatePresence>
            {showManualInput && (
              <ManualInputModal
                onSave={saveNote}
                onClose={() => setShowManualInput(false)}
                draftTitle={draftTitle}
                setDraftTitle={setDraftTitle}
              />
            )}
          </AnimatePresence>

          {/* Search */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search voice notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-500">{notes.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Voice Notes</p>
              </div>
              
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-500">
                  {notes.reduce((acc, note) => acc + note.transcript.split(' ').length, 0)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Words</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Voice Notes List */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Your Voice Notes ({filteredNotes.length})
        </h3>
        
        <AnimatePresence>
          {filteredNotes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <Mic className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
                {searchTerm ? 'No notes found' : 'No voice notes yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Start recording to capture your thoughts'
                }
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotes
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <Card className="h-full hover:shadow-lg transition-all duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-lg mb-1 line-clamp-1">
                              {note.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {note.isManual ? (
                              <>
                                <FileText className="w-3 h-3 mr-1" />
                                Text
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3 mr-1" />
                                Voice
                              </>
                            )}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-gray-600 dark:text-gray-300 line-clamp-4 mb-4">
                          {note.transcript}
                        </p>
                        
                        <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(note.transcript)}
                              className="text-blue-500 hover:text-blue-600"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadTranscript(note)}
                              className="text-green-500 hover:text-green-600"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNote(note.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Manual Input Modal Component
function ManualInputModal({ onSave, onClose, draftTitle, setDraftTitle }) {
  const [manualText, setManualText] = useState('');

  const handleSave = () => {
    if (manualText.trim()) {
      onSave(manualText.trim());
      setManualText('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              Create Text Note
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Note title (optional)"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
            />
            
            <Textarea
              placeholder="Type your note here..."
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className="min-h-48 resize-none"
              autoFocus
            />
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!manualText.trim()}
                className="bg-purple-500 hover:bg-purple-600"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Note
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}