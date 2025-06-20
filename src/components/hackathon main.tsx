import { useState, useRef } from 'react';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from "react-markdown";

interface VoiceAssistantProps {
  language: 'english' | 'telugu' | 'hindi';
}

const VoiceAssistant = ({ language }: VoiceAssistantProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  const labels = {
    english: {
      title: "Voice Assistant",
      startRecording: "Start Recording",
      stopRecording: "Stop Recording", 
      processing: "Processing...",
      playResponse: "Play Response",
      transcript: "What you said:",
      response: "AI Response:"
    },
    telugu: {
      title: "వాయిస్ అసిస్టెంట్",
      startRecording: "రికార్డింగ్ ప్రారంభించండి",
      stopRecording: "రికార్డింగ్ ఆపండి",
      processing: "ప్రాసెసింగ్...",
      playResponse: "సమాధానం వినండి", 
      transcript: "మీరు చెప్పినది:",
      response: "AI సమాధానం:"
    },
    hindi: {
      title: "वॉयस असिस्टेंट",
      startRecording: "रिकॉर्डिंग प्रारंभ करें",
      stopRecording: "रिकॉर्डिंग बंद करें",
      processing: "प्रोसेसिंग...",
      playResponse: "जवाब खोजें",
      transcript: "तुमने क्या कहा:",
      response: "एआई जवाब:"
    }
  };

  const currentLabels = labels[language];

  const startRecording = async () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('Speech recognition not supported');
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'telugu' ? 'te-IN' : language === 'hindi' ? 'hi-IN' : 'en-US';

      recognition.onresult = (event) => {
        const currentTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Recording Error",
          description: "Could not capture voice. Please try again.",
          variant: "destructive"
        });
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
      setTranscript('');
      setResponse('');

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    
    if (transcript.trim()) {
      processWithGemini(transcript);
    }
  };

  const processWithGemini = async (text: string) => {
    setIsProcessing(true);
    
    try {
      console.log('Calling Gemini with:', { text, language });
      
      const { data, error } = await supabase.functions.invoke('process-voice', {
        body: { 
          text: text.trim(),
          language: language
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to process voice input');
      }

      const aiResponse = data?.response;
      if (!aiResponse) {
        throw new Error('No response received from AI');
      }

      setResponse(aiResponse);
      
      // Auto-play response with improved Telugu support
      speakResponse(aiResponse);
      
    } catch (error) {
      console.error('Error processing with Gemini:', error);
      const fallbackMessage = language === 'english' 
        ? "Sorry, I couldn't process your request. Please try again."
        : language === 'telugu' 
          ? "క్షమించండి, మీ అభ్యర్థనను ప్రాసెస్ చేయలేకపోయాను. దయచేసి మళ్లీ ప్రయత్నించండి."
          : "क्षमा करें, आपकी अनुरोध प्रोसेस नहीं कर सकते। कृपया फिर से प्रयास करें।";
      
      setResponse(fallbackMessage);
      toast({
        title: "Processing Error",
        description: "Could not process your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsPlaying(true);
      
      // Stop any existing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Enhanced Telugu voice support
      if (language === 'telugu') {
        utterance.lang = 'te-IN';
        
        // Try to find Telugu voice
        const voices = speechSynthesis.getVoices();
        const teluguVoice = voices.find(voice => 
          voice.lang === 'te-IN' || 
          voice.lang === 'te' ||
          voice.name.toLowerCase().includes('telugu')
        );
        
        if (teluguVoice) {
          utterance.voice = teluguVoice;
        } else {
          // Fallback message if no Telugu voice available
          console.warn('Telugu voice not available');
          toast({
            title: "తెలుగు ధ్వని లభించలేదు",
            description: "Telugu voice not available on this device",
            variant: "destructive"
          });
          setIsPlaying(false);
          return;
        }
      } else if (language === 'hindi') {
        utterance.lang = 'hi-IN';
        const voices = speechSynthesis.getVoices();
        const hindiVoice = voices.find(voice => 
          voice.lang === 'hi-IN' || voice.lang === 'hi' ||
          voice.name.toLowerCase().includes('hindi')
        );
        if (hindiVoice) {
          utterance.voice = hindiVoice;
        }
      } else {
        utterance.lang = 'en-US';
        const voices = speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => 
          voice.lang === 'en-US' || voice.lang === 'en-GB'
        );
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }
      
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlaying(false);
        toast({
          title: "Voice Error",
          description: language === 'telugu' 
            ? "తెలుగు ధ్వని ప్లే చేయలేకపోయింది" 
            : language === 'hindi' 
              ? "ध्वनि खोजने में विफल हुआ"
              : "Could not play voice response",
          variant: "destructive"
        });
      };
      
      // Ensure voices are loaded before speaking
      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.addEventListener('voiceschanged', () => {
          speechSynthesis.speak(utterance);
        }, { once: true });
      } else {
        speechSynthesis.speak(utterance);
      }
    } else {
      toast({
        title: "Text-to-Speech Error",
        description: "Text-to-speech not supported in this browser.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="p-8 bg-white/90 backdrop-blur-sm">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
        {currentLabels.title}
      </h2>
      
      <div className="space-y-6">
        {/* Recording Controls */}
        <div className="text-center">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 text-lg"
              disabled={isProcessing}
            >
              <Mic className="w-6 h-6 mr-3" />
              {currentLabels.startRecording}
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              size="lg"
              variant="destructive"
              className="px-8 py-4 text-lg animate-pulse"
            >
              <MicOff className="w-6 h-6 mr-3" />
              {currentLabels.stopRecording}
            </Button>
          )}
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">{currentLabels.processing}</p>
          </div>
        )}

        {/* Transcript Display */}
        {transcript && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-2 text-blue-800">
              {currentLabels.transcript}
            </h3>
            <p className="text-gray-700">{transcript}</p>
          </Card>
        )}

        {/* Response Display */}
        {response && (
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-green-800">
                {currentLabels.response}
              </h3>
              <Button
                onClick={() => speakResponse(response)}
                variant="outline"
                size="sm"
                disabled={isPlaying}
                className="ml-2"
              >
                <Volume2 className="w-4 h-4 mr-1" />
                {isPlaying ? "Playing..." : currentLabels.playResponse}
              </Button>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{response}</p>
          </Card>
        )}
      </div>
    </Card>
  );
};

export default VoiceAssistant;
