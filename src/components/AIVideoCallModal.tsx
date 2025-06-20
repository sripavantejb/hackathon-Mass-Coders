import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, X, Video, Camera, RefreshCw, Pause, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AIVideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'english' | 'telugu' | 'hindi';
}

const AVATAR_URL = 'https://api.dicebear.com/7.x/bottts/svg?seed=AI'; // Dicebear AI avatar as fallback

const labels = {
  english: {
    title: 'AI Video Call',
    speak: 'Speak',
    stop: 'Stop',
    send: 'Send',
    close: 'Close',
    ai: 'AI',
    you: 'You',
    placeholder: 'Ask your question...',
    loading: 'Thinking...',
    noSpeechSupport: 'Voice input not supported in this browser.',
    micDenied: 'Microphone access denied. Please allow mic access in your browser.',
    noSpeech: 'No speech detected. Please try again.',
    micError: 'Microphone error. Please check your device and permissions.',
    cameraDenied: 'Camera access denied. Please allow camera access in your browser.',
    cameraError: 'Camera error. Please check your device and permissions.',
    sendFrame: 'Send Frame to AI',
    analyzing: 'Analyzing video frame...',
    autoCapture: 'Auto-Capture',
    autoCapturing: 'Auto-Capturing...',
    pause: 'Pause',
    resume: 'Resume'
  },
  telugu: {
    title: 'AI వీడియో కాల్',
    speak: 'మాట్లాడండి',
    stop: 'ఆపు',
    send: 'పంపండి',
    close: 'మూసివేయండి',
    ai: 'AI',
    you: 'మీరు',
    placeholder: 'మీ ప్రశ్నను అడగండి...',
    loading: 'ఆలోచిస్తోంది...',
    noSpeechSupport: 'ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్‌కు మద్దతు లేదు.',
    micDenied: 'మైక్రోఫోన్ యాక్సెస్ నిరాకరించబడింది. దయచేసి బ్రౌజర్‌లో మైక్ యాక్సెస్ అనుమతించండి.',
    noSpeech: 'ఏ మాటలు గుర్తించబడలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.',
    micError: 'మైక్రోఫోన్ లోపం. దయచేసి మీ పరికరం మరియు అనుమతులను తనిఖీ చేయండి.',
    cameraDenied: 'కెమెరా యాక్సెస్ నిరాకరించబడింది. దయచేసి బ్రౌజర్‌లో కెమెరా యాక్సెస్ అనుమతించండి.',
    cameraError: 'కెమెరా లోపం. దయచేసి మీ పరికరం మరియు అనుమతులను తనిఖీ చేయండి.',
    sendFrame: 'ఫ్రేమ్‌ను AIకి పంపండి',
    analyzing: 'వీడియో ఫ్రేమ్‌ను విశ్లేషిస్తోంది...',
    autoCapture: 'ఆటో-క్యాప్చర్',
    autoCapturing: 'ఆటో-క్యాప్చర్ జరుగుతోంది...',
    pause: 'పాజ్',
    resume: 'పునఃప్రారంభించండి'
  },
  hindi: {
    title: 'एआई वीडियो कॉल',
    speak: 'बोलें',
    stop: 'रोकें',
    send: 'भेजें',
    close: 'बंद करें',
    ai: 'एआई',
    you: 'आप',
    placeholder: 'अपना सवाल पूछें...',
    loading: 'सोच रहा है...',
    noSpeechSupport: 'इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है।',
    micDenied: 'माइक्रोफ़ोन एक्सेस अस्वीकृत। कृपया ब्राउज़र में माइक्रोफ़ोन की अनुमति दें।',
    noSpeech: 'कोई आवाज़ नहीं मिली। कृपया पुनः प्रयास करें।',
    micError: 'माइक्रोफ़ोन त्रुटि। कृपया अपना डिवाइस और अनुमतियाँ जांचें।',
    cameraDenied: 'कैमरा एक्सेस अस्वीकृत। कृपया ब्राउज़र में कैमरा की अनुमति दें।',
    cameraError: 'कैमरा त्रुटि। कृपया अपना डिवाइस और अनुमतियाँ जांचें।',
    sendFrame: 'फ्रेम एआई को भेजें',
    analyzing: 'वीडियो फ्रेम का विश्लेषण हो रहा है...',
    autoCapture: 'ऑटो-कैप्चर',
    autoCapturing: 'ऑटो-कैप्चर हो रहा है...',
    pause: 'रोकें',
    resume: 'फिर से शुरू करें'
  }
};

const AUTO_CAPTURE_INTERVAL = 5000; // 5 seconds

const AIVideoCallModal: React.FC<AIVideoCallModalProps> = ({ isOpen, onClose, language }) => {
  const t = labels[language];
  const [messages, setMessages] = useState<{ from: 'ai' | 'user'; text: string }[]>([
    { from: 'ai', text: language === 'telugu' ? 'హాయ్! నేను మీ AI నిపుణిని. మీ ప్రశ్నను అడగండి.' : 'Hi! I am your AI expert. Ask me anything.' }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoCapture, setAutoCapture] = useState(false);
  const [autoCaptureId, setAutoCaptureId] = useState<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [isCombinedAnalyzing, setIsCombinedAnalyzing] = useState(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  // Webcam setup
  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      return;
    }
    async function getCamera() {
      setCameraError(null);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setCameraError(t.cameraDenied);
      }
    }
    getCamera();
    // Cleanup on close
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    };
    // eslint-disable-next-line
  }, [isOpen]);

  // Auto-capture interval
  useEffect(() => {
    if (autoCapture && !isAnalyzing && !cameraError && stream) {
      const id = setInterval(() => {
        analyzeFrame();
      }, AUTO_CAPTURE_INTERVAL);
      setAutoCaptureId(id);
      return () => clearInterval(id);
    } else if (!autoCapture && autoCaptureId) {
      clearInterval(autoCaptureId);
      setAutoCaptureId(null);
    }
    // eslint-disable-next-line
  }, [autoCapture, isAnalyzing, cameraError, stream]);

  // Face detection effect
  useEffect(() => {
    let faceInterval: NodeJS.Timeout | null = null;
    const detectFace = async () => {
      if (!videoRef.current) return;
      const video = videoRef.current;
      if ('FaceDetector' in window && video.readyState === 4) {
        try {
          // @ts-ignore
          const detector = new window.FaceDetector({ fastMode: true });
          const faces = await detector.detect(video);
          setFaceDetected(faces.length > 0);
        } catch {
          setFaceDetected(false);
        }
      } else {
        setFaceDetected(false);
      }
    };
    if (isOpen && stream) {
      faceInterval = setInterval(detectFace, 1000);
    }
    return () => {
      if (faceInterval) clearInterval(faceInterval);
    };
  }, [isOpen, stream]);

  // Auto start/stop speech recognition based on face detection
  useEffect(() => {
    if (faceDetected && !isRecording && speechSupported && !isCombinedAnalyzing) {
      startCombinedRecording();
    }
    // Optionally, stop recording if face is lost
    // else if (!faceDetected && isRecording) {
    //   stopRecording();
    // }
    // eslint-disable-next-line
  }, [faceDetected, isRecording, speechSupported, isCombinedAnalyzing]);

  // Call Gemini API via Supabase function
  async function getAIResponse(text: string): Promise<string> {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('process-voice', {
        body: {
          text: text.trim(),
          language: language
        }
      });
      if (error) throw new Error(error.message || 'Failed to process voice input');
      const aiResponse = data?.response;
      if (!aiResponse) throw new Error('No response received from AI');
      return aiResponse;
    } catch (err: any) {
      setError(language === 'telugu' ? 'క్షమించండి, మీ అభ్యర్థనను ప్రాసెస్ చేయలేకపోయాను. దయచేసి మళ్లీ ప్రయత్నించండి.' : "Sorry, I couldn't process your request. Please try again.");
      return language === 'telugu' ? 'క్షమించండి, మీ అభ్యర్థనను ప్రాసెస్ చేయలేకపోయాను.' : "Sorry, I couldn't process your request.";
    } finally {
      setIsLoading(false);
    }
  }

  // Analyze video frame
  async function analyzeFrame() {
    setIsAnalyzing(true);
    setCameraError(null);
    try {
      if (!videoRef.current || !canvasRef.current) throw new Error('No video/canvas');
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg');
      // Call Gemini Vision (analyze-image)
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: {
          imageData,
          fileName: 'webcam.jpg',
          language: language
        }
      });
      if (error) throw new Error(error.message || 'Failed to analyze image');
      const aiResponse = data?.response;
      if (!aiResponse) throw new Error('No response received from AI');
      setMessages((msgs) => [...msgs, { from: 'ai', text: aiResponse }]);
      speak(aiResponse);
    } catch (err: any) {
      setCameraError(language === 'telugu' ? 'ఫ్రేమ్‌ను విశ్లేషించడంలో లోపం. దయచేసి మళ్లీ ప్రయత్నించండి.' : 'Error analyzing frame. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Combined audio+video analysis
  const startCombinedRecording = () => {
    setMicError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setMicError(t.noSpeechSupport);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'telugu' ? 'te-IN' : 'en-US';
      recognition.interimResults = false;
      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsRecording(false);
        setLastTranscript(transcript);
        if (!transcript || transcript.trim() === '') {
          setMicError(t.noSpeech);
          return;
        }
        // Capture video frame
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');
        // Send both transcript and image to backend
        setIsCombinedAnalyzing(true);
        setMessages((msgs) => [...msgs, { from: 'user', text: transcript }]);
        try {
          const { data, error } = await supabase.functions.invoke('analyze-image', {
            body: {
              imageData,
              fileName: 'webcam.jpg',
              language: language,
              text: transcript
            }
          });
          if (error) throw new Error(error.message || 'Failed to analyze');
          const aiResponse = data?.response;
          if (!aiResponse) throw new Error('No response received from AI');
          setMessages((msgs) => [...msgs, { from: 'ai', text: aiResponse }]);
          speak(aiResponse);
        } catch (err: any) {
          setCameraError(language === 'telugu' ? 'విశ్లేషణలో లోపం. దయచేసి మళ్లీ ప్రయత్నించండి.' : 'Error analyzing. Please try again.');
        } finally {
          setIsCombinedAnalyzing(false);
        }
      };
      recognition.onerror = (event: any) => {
        setMicError(t.micError);
        setIsRecording(false);
      };
      recognition.onnomatch = () => {
        setMicError(t.noSpeech);
        setIsRecording(false);
      };
      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (err) {
      setMicError(t.micError);
      setIsRecording(false);
    }
  };

  // Text-to-speech
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      window.speechSynthesis.cancel();
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.lang = language === 'telugu' ? 'te-IN' : 'en-US';
      utter.onend = () => setIsPlaying(false);
      utter.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utter);
    }
  };

  // Send user message
  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { from: 'user', text: input }]);
    setInput('');
    const aiText = await getAIResponse(input);
    setMessages((msgs) => [...msgs, { from: 'ai', text: aiText }]);
    speak(aiText);
    // TODO: If D-ID/HeyGen API key is provided, call their API and show the talking avatar video here
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-white p-0 overflow-hidden rounded-3xl shadow-2xl">
        <DialogHeader className="p-6 pb-2 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Video className="w-6 h-6 text-blue-600" />
            </div>
            {t.title}
          </DialogTitle>
          <Button onClick={onClose} variant="ghost" className="rounded-full p-2">
            <X className="w-6 h-6" />
          </Button>
        </DialogHeader>
        <div className="flex flex-col md:flex-row gap-8 p-6 pt-0">
          {/* AI Avatar and Webcam */}
          <div className="flex flex-col items-center md:w-64 w-full gap-4">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center overflow-hidden shadow-lg border-4 border-white">
                <img src={AVATAR_URL} alt="AI Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="text-center text-blue-700 font-semibold mt-1 mb-2">{t.ai}</div>
            {/* Webcam video */}
            <div className="w-64 h-48 rounded-2xl bg-black flex items-center justify-center overflow-hidden relative shadow-lg border-2 border-blue-100">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-center text-xs px-2">{cameraError}</div>
              )}
              {autoCapture && !cameraError && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-lg">
                  <RefreshCw className="w-3 h-3 animate-spin" /> {t.autoCapturing}
                </div>
              )}
              {faceDetected && !isCombinedAnalyzing && (
                <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-lg animate-pulse">
                  <Mic className="w-4 h-4 animate-pulse" /> Listening...
                </div>
              )}
              {isCombinedAnalyzing && (
                <div className="absolute bottom-2 left-2 bg-purple-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-lg animate-spin">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...
                </div>
              )}
            </div>
            <div className="text-center text-gray-700 font-semibold mt-1">{t.you}</div>
            <div className="w-full flex justify-center mt-6">
              <Button
                onClick={() => setAutoCapture((v) => !v)}
                className={`px-10 py-6 text-2xl rounded-2xl shadow flex items-center gap-4 font-bold ${autoCapture ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}
                style={{ minWidth: '260px', minHeight: '64px' }}
                disabled={!!cameraError || isAnalyzing}
                title={autoCapture ? t.pause : t.autoCapture}
              >
                {autoCapture ? <Pause className="w-8 h-8" /> : <RefreshCw className="w-8 h-8" />}
                {autoCapture ? t.pause : t.autoCapture}
              </Button>
            </div>
          </div>
          {/* Chat Area */}
          <div className="flex-1 flex flex-col gap-4 max-h-[420px] overflow-y-auto bg-gradient-to-br from-blue-50 to-white rounded-2xl p-4 shadow-inner border border-blue-100">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.from === 'ai' ? 'justify-start' : 'justify-end'}`}>
                <div className={`rounded-2xl px-4 py-2 max-w-xs transition-all duration-200 shadow-md ${msg.from === 'ai' ? 'bg-blue-100 text-blue-900' : 'bg-green-100 text-green-900'}`}>
                  <span className="font-semibold mr-2">{msg.from === 'ai' ? t.ai : t.you}:</span>
                  {msg.text}
                  {msg.from === 'ai' && (
                    <Button size="icon" variant="ghost" className="ml-2 p-1" onClick={() => speak(msg.text)} disabled={isPlaying} title="Play AI response">
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-2 max-w-xs bg-blue-50 text-blue-400 animate-pulse shadow-md">
                  {t.loading}
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-2 max-w-xs bg-red-100 text-red-700 shadow-md">
                  {error}
                </div>
              </div>
            )}
            {micError && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-2 max-w-xs bg-yellow-100 text-yellow-800 shadow-md">
                  {micError}
                </div>
              </div>
            )}
          </div>
        </div>
        {lastTranscript && (
          <div className="w-full text-center text-blue-700 text-sm mt-1 animate-fade-in">
            <span className="font-semibold">Transcript:</span> {lastTranscript}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AIVideoCallModal; 