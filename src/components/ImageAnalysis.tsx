import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Image as ImageIcon, Loader2, X, Plant, Virus, SprayCan, Leaf, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImageAnalysisProps {
  language: 'english' | 'telugu' | 'hindi';
}

const ImageAnalysis = ({ language: initialLanguage }: ImageAnalysisProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [language, setLanguage] = useState<'english' | 'telugu' | 'hindi'>(initialLanguage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const labels = {
    english: {
      title: "Crop Disease Analysis",
      uploadButton: "Upload Farm Image",
      dropZone: "Drop farming image here or click to browse",
      processing: "Analyzing crop condition...",
      analysis: "Analysis Result:",
      analysisTitle: "Analysis & Diagnosis",
      clear: "Clear",
      supportedFormats: "Supported: JPG, PNG, GIF, WEBP",
      farmingOnly: "Please upload only farming-related images (crops, soil, plants, diseases)"
    },
    telugu: {
      title: "వ్యాధి గుర్తింపు", 
      uploadButton: "వ్యవసాయ చిత్రం అప్‌లోడ్ చేయండి",
      dropZone: "వ్యవసాయ చిత్రాన్ని ఇక్కడ వదలండి లేదా బ్రౌజ్ చేయడానికి క్లిక్ చేయండి",
      processing: "పంట పరిస్థితిని విశ్లేషిస్తోంది...",
      analysis: "విశ్లేషణ ఫలితం:",
      analysisTitle: "విశ్లేషణ & నిర్ధారణ",
      clear: "క్లియర్",
      supportedFormats: "మద్దతు: JPG, PNG, GIF, WEBP",
      farmingOnly: "దయచేసి వ్యవసాయానికి సంబంధించిన చిత్రాలను మాత్రమే అప్‌లోడ్ చేయండి (పంటలు, మట్టి, మొక్కలు, వ్యాధులు)"
    },
    hindi: {
      title: "फसल रोग विश्लेषण",
      uploadButton: "खेती की छवि अपलोड करें",
      dropZone: "खेती की छवि यहाँ छोड़ें या ब्राउज़ करने के लिए क्लिक करें",
      processing: "फसल की स्थिति का विश्लेषण हो रहा है...",
      analysis: "विश्लेषण परिणाम:",
      analysisTitle: "विश्लेषण और निदान",
      clear: "साफ़ करें",
      supportedFormats: "समर्थित: JPG, PNG, GIF, WEBP",
      farmingOnly: "कृपया केवल खेती से संबंधित छवियाँ अपलोड करें (फसलें, मिट्टी, पौधे, रोग)"
    }
  };

  const currentLabels = labels[language];

  const analyzeImage = useCallback(async (file: File, imageData: string) => {
    setIsProcessing(true);
    setAnalysis('');
    try {
      console.log('Analyzing farming image with Gemini Vision:', { fileName: file.name, language });
      
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: { 
          imageData: imageData,
          fileName: file.name,
          language: language
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to analyze image');
      }

      const aiResponse = data?.response;
      if (!aiResponse) {
        throw new Error('No response received from AI');
      }

      // Check for non-agriculture warning in all supported languages
      const nonAgriMessages = [
        'Please upload only farming-related images (crops, soil, plants, diseases).',
        'దయచేసి వ్యవసాయానికి సంబంధించిన చిత్రం మాత్రమే ఎంచుకోండి.',
        'कृपया केवल खेती से संबंधित छवियाँ अपलोड करें (फसलें, मिट्टी, पौधे, रोग)'
      ];
      if (nonAgriMessages.some(msg => aiResponse.trim().includes(msg))) {
        toast({
          title: language === 'telugu' ? 'చిత్రం సరిపోలలేదు' : language === 'hindi' ? 'अमान्य छवि' : 'Invalid Image',
          description: currentLabels.farmingOnly,
          variant: 'destructive'
        });
        setAnalysis('');
        setSelectedImage(null);
        setImagePreview('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsProcessing(false);
        return;
      }

      setAnalysis(aiResponse);
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      const fallbackMessage = language === 'english' 
        ? "Sorry, I couldn't analyze this image. Please try again with a different farming image."
        : language === 'telugu' 
        ? "క్షమించండి, ఈ చిత్రాన్ని విశ్లేషించలేకపోయాను. దయచేసి వేరే వ్యవసాయ చిత్రంతో మళ్లీ ప్రయత్నించండి."
        : "माफ़ कीजिए, मैं इस छवि का विश्लेषण नहीं कर सका। कृपया एक अलग खेती की छवि के साथ पुनः प्रयास करें।";
      
      setAnalysis(fallbackMessage);
      toast({
        title: "Analysis Error",
        description: "Could not analyze the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [language, currentLabels.farmingOnly, toast]);

  useEffect(() => {
    // When language changes, re-analyze if an image is already present
    if (selectedImage && imagePreview) {
      analyzeImage(selectedImage, imagePreview);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      // Start analysis immediately
      analyzeImage(file, result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setAnalysis('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="p-8 bg-white/90 backdrop-blur-sm">
      <div className="flex justify-end mb-4">
        <select
          className="rounded-lg border px-3 py-1"
          value={language}
          onChange={e => setLanguage(e.target.value as 'english' | 'telugu' | 'hindi')}
        >
          <option value="english">English</option>
          <option value="telugu">తెలుగు</option>
          <option value="hindi">हिंदी</option>
        </select>
      </div>
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
        {currentLabels.title}
      </h2>
      
      <div className="space-y-6">
        {/* Upload Area */}
        {!selectedImage && (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragOver 
                ? 'border-green-400 bg-green-50' 
                : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <p className="text-xl mb-2 text-gray-600">
              {currentLabels.dropZone}
            </p>
            <p className="text-sm text-gray-500 mb-2">
              {currentLabels.supportedFormats}
            </p>
            <p className="text-xs text-orange-600 font-medium">
              {currentLabels.farmingOnly}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
          </div>
        )}

        {/* Image Preview */}
        {imagePreview && (
          <Card className="p-4 relative">
            <Button
              onClick={clearImage}
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 z-10 bg-white/90"
            >
              <X className="w-4 h-4" />
              {currentLabels.clear}
            </Button>
            <img
              src={imagePreview}
              alt="Selected for analysis"
              className="w-full max-h-96 object-contain rounded-lg"
            />
          </Card>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-green-500" />
            <p className="text-gray-600">{currentLabels.processing}</p>
          </div>
        )}

        {/* Analysis Result */}
        {analysis && (
          <div className="flex flex-col gap-6">
            {/* Section 1: Analysis & Diagnosis */}
            <div className="rounded-2xl bg-[#ECFDF5] border border-green-100 p-6" style={{ fontFamily: 'Inter, Poppins, sans-serif' }}>
              <h3 className="font-bold text-xl mb-4 text-[#065F46] flex items-center gap-2">🧾 {currentLabels.analysisTitle}</h3>
              <div className="text-gray-700 text-base whitespace-pre-wrap">{analysis}</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ImageAnalysis;
