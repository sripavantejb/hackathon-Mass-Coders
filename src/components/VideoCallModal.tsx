import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'english' | 'telugu' | 'hindi';
}

const labels = {
  english: {
    title: 'Video Call Feature',
    start: 'Start Video Call',
    join: 'Join Now',
    loading: 'Creating video call...',
    error: 'Failed to create video call. Please try again.',
    close: 'Close',
    meetReady: 'Your video call is ready!'
  },
  telugu: {
    title: 'వీడియో కాల్ ఫీచర్',
    start: 'వీడియో కాల్ ప్రారంభించండి',
    join: 'ప్రవేశించండి',
    loading: 'వీడియో కాల్ సృష్టిస్తోంది...',
    error: 'వీడియో కాల్ సృష్టించడంలో విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.',
    close: 'మూసివేయండి',
    meetReady: 'మీ వీడియో కాల్ సిద్ధంగా ఉంది!'
  },
  hindi: {
    title: 'वीडियो कॉल सुविधा',
    start: 'वीडियो कॉल शुरू करें',
    join: 'अब जुड़ें',
    loading: 'वीडियो कॉल बनाई जा रही है...',
    error: 'वीडियो कॉल बनाने में विफल। कृपया पुनः प्रयास करें।',
    close: 'बंद करें',
    meetReady: 'आपकी वीडियो कॉल तैयार है!'
  }
};

// TODO: Replace this with your real API key
const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY_HERE';
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE'; // For OAuth if needed

async function createGoogleMeet() {
  // This function should call your backend or Google Calendar API to create a Meet link
  // For demo, we'll simulate with a timeout and a fake link
  // In production, you must use OAuth2 and Google Calendar API to create a meeting with conferenceData
  return new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve('https://meet.google.com/new');
    }, 1500);
  });
}

const VideoCallModal = ({ isOpen, onClose, language }: VideoCallModalProps) => {
  const t = labels[language];
  const [loading, setLoading] = useState(false);
  const [meetLink, setMeetLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartCall = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with real API call using your API key
      const link = await createGoogleMeet();
      setMeetLink(link);
    } catch (e) {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = () => {
    if (meetLink) {
      window.open(meetLink, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Video className="w-6 h-6 text-purple-600" />
            </div>
            {t.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4 text-center">
          {loading && <p className="text-purple-600 font-semibold animate-pulse">{t.loading}</p>}
          {error && <p className="text-red-600 font-semibold">{error}</p>}
          {!loading && !meetLink && !error && (
            <Button
              onClick={handleStartCall}
              className="bg-purple-500 hover:bg-purple-600 text-white px-8 text-lg rounded-full shadow"
            >
              {t.start}
            </Button>
          )}
          {meetLink && (
            <div className="space-y-4">
              <p className="text-green-700 font-semibold">{t.meetReady}</p>
              <a
                href={meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 underline break-all"
              >
                {meetLink}
              </a>
              <Button
                onClick={handleJoin}
                className="bg-green-500 hover:bg-green-600 text-white px-8 text-lg rounded-full shadow"
              >
                {t.join}
              </Button>
            </div>
          )}
        </div>
        <div className="flex justify-center">
          <Button 
            onClick={onClose} 
            className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-8"
            variant="outline"
          >
            {t.close}
          </Button>
        </div>
        <div className="mt-2 text-xs text-gray-400 text-center">
          {/* Show a note about API key for devs */}
          {!meetLink && (
            <span>Set your Google API key in <b>src/components/VideoCallModal.tsx</b></span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoCallModal;
