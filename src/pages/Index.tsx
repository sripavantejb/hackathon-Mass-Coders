import React, { useState, useEffect, useRef, useCallback } from "react";
import VoiceAssistant from "../components/VoiceAssistant";
import ImageAnalysis from "../components/ImageAnalysis";
// import VideoCallModal from "../components/VideoCallModal";
import AIVideoCallModal from "../components/AIVideoCallModal";
import { RefreshCw, MapPin } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LabelList } from 'recharts';
import { motion, AnimatePresence } from "framer-motion";
import { slideUp, fadeInOut } from "../lib/animations";

const navItems = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'voice', label: 'Voice', icon: '🎤' },
  { key: 'camera', label: 'Camera', icon: '📷' },
  { key: 'stats', label: 'Stats', icon: '📊' },
  { key: 'help', label: 'Help', icon: '❓' },
];

const labels = {
  english: {
    greeting: "Hello, User!",
    weather: "Today's Weather",
    partlyCloudy: "Partly Cloudy",
    humidity: "Humidity",
    wind: "Wind",
    cropStats: "Crop Statistics",
    rice: "Rice",
    wheat: "Wheat",
    avgYield: "Avg Yield",
    marketPrice: "Market Price",
    voiceAssistant: "Voice Assistant",
    voiceDesc: "Ask farming questions",
    diseaseDetection: "Disease Detection",
    diseaseDesc: "Scan crop diseases",
    expertCall: "Expert Call",
    expertDesc: "Talk to experts",
    language: "Language",
    home: "Home",
    camera: "Camera",
    stats: "Stats",
    help: "Help",
    production: "Production",
    applyNow: "Apply Now",
    reset: "Reset",
    loading: "Loading...",
    selectState: "Select State:",
    go: "Go",
    next2DaysForecast: "Next 2 Days Forecast:",
    bankName: "Bank Name",
    estimatedLoan: "Estimated Loan",
    apply: "Apply",
    landArea: "Land Area (in acres)",
    placeholderLandArea: "e.g. 2.5",
    source: "Source: Ministry of Agriculture, 3rd Adv. Est. 2022-23"
  },
  telugu: {
    greeting: "హలో, వినియోగదారుడు!",
    weather: "ఈరోజు వాతావరణం",
    partlyCloudy: "భాగంగా మేఘావృతం",
    humidity: "ఆర్ద్రత",
    wind: "గాలి",
    cropStats: "పంట గణాంకాలు",
    rice: "బియ్యం",
    wheat: "గోధుమలు",
    avgYield: "సగటు దిగుబడి",
    marketPrice: "మార్కెట్ ధర",
    voiceAssistant: "వాయిస్ అసిస్టెంట్",
    voiceDesc: "వ్యవసాయ ప్రశ్నలు అడగండి",
    diseaseDetection: "వ్యాధి గుర్తింపు",
    diseaseDesc: "పంట వ్యాధులను స్కాన్ చేయండి",
    expertCall: "నిపుణుల కాల్",
    expertDesc: "నిపుణులతో మాట్లాడండి",
    language: "భాష",
    home: "హోమ్",
    camera: "కెమెరా",
    stats: "గణాంకాలు",
    help: "సహాయం",
    production: "ఉత్పత్తి",
    applyNow: "ఇప్పుడు దరఖాస్తు చేయండి",
    reset: "రిసెట్",
    loading: "లోడవుతోంది...",
    selectState: "రాష్ట్రాన్ని ఎంచుకోండి:",
    go: "వెళ్ళు",
    next2DaysForecast: "తదుపరి 2 రోజుల వాతావరణం:",
    bankName: "బ్యాంక్ పేరు",
    estimatedLoan: "అంచనా రుణం",
    apply: "దరఖాస్తు",
    landArea: "భూమి విస్తీర్ణం (ఎకరాల్లో)",
    placeholderLandArea: "ఉదా: 2.5",
    source: "మూలం: వ్యవసాయ మంత్రిత్వ శాఖ, 3వ ముందస్తు అంచనా 2022-23"
  },
  hindi: {
    greeting: "नमस्ते, किसान मित्र!",
    weather: "आज का मौसम",
    partlyCloudy: "आंशिक रूप से बादल",
    humidity: "नमी",
    wind: "हवा",
    cropStats: "फसल सांख्यिकी",
    rice: "चावल",
    wheat: "गेहूं",
    avgYield: "औसत उपज",
    marketPrice: "बाजार मूल्य",
    voiceAssistant: "वॉयस असिस्टेंट",
    voiceDesc: "खेती से जुड़े सवाल पूछें",
    diseaseDetection: "रोग पहचान",
    diseaseDesc: "फसल रोग की जांच करें",
    expertCall: "विशेषज्ञ से बात करें",
    expertDesc: "कृषि विशेषज्ञ से सलाह लें",
    language: "भाषा",
    home: "होम",
    camera: "कैमरा",
    stats: "सांख्यिकी",
    help: "सहायता",
    production: "उत्पादन",
    applyNow: "अभी आवेदन करें",
    reset: "रीसेट",
    loading: "लोड हो रहा है...",
    selectState: "राज्य चुनें:",
    go: "जाएँ",
    next2DaysForecast: "अगले 2 दिनों का पूर्वानुमान:",
    bankName: "बैंक का नाम",
    estimatedLoan: "अनुमानित ऋण",
    apply: "आवेदन करें",
    landArea: "भूमि क्षेत्र (एकड़ में)",
    placeholderLandArea: "जैसे 2.5",
    source: "स्रोत: कृषि मंत्रालय, 3रा अग्रिम अनुमान 2022-23"
  }
};

const OPENWEATHER_API_KEY = "b9163689328a323247edb207772b70b9"; // <-- User's real API key
const DEFAULT_COORDS = { lat: 17.385044, lon: 78.486671 }; // Hyderabad as fallback

// Latest available state-wise rice and wheat stats (2022-23, 3rd Advance Estimates, Ministry of Agriculture)
const stateCropStats = {
  'All India': {
    rice: { yield: 2.79, production: 135.5 },
    wheat: { yield: 3.51, production: 112.7 },
  },
  'West Bengal': {
    rice: { yield: 2.97, production: 16.1 },
    wheat: { yield: 0, production: 0 },
  },
  'Uttar Pradesh': {
    rice: { yield: 2.62, production: 13.2 },
    wheat: { yield: 3.12, production: 34.1 },
  },
  'Punjab': {
    rice: { yield: 4.02, production: 12.4 },
    wheat: { yield: 5.10, production: 17.5 },
  },
  'Andhra Pradesh': {
    rice: { yield: 3.38, production: 8.1 },
    wheat: { yield: 0, production: 0 },
  },
  'Telangana': {
    rice: { yield: 3.77, production: 7.5 },
    wheat: { yield: 0, production: 0 },
  },
  'Odisha': {
    rice: { yield: 2.44, production: 8.1 },
    wheat: { yield: 0, production: 0 },
  },
  'Chhattisgarh': {
    rice: { yield: 2.41, production: 7.7 },
    wheat: { yield: 0, production: 0 },
  },
  'Tamil Nadu': {
    rice: { yield: 3.12, production: 6.7 },
    wheat: { yield: 0, production: 0 },
  },
  'Bihar': {
    rice: { yield: 2.36, production: 7.0 },
    wheat: { yield: 2.44, production: 5.6 },
  },
  'Madhya Pradesh': {
    rice: { yield: 1.98, production: 3.5 },
    wheat: { yield: 3.44, production: 18.0 },
  },
  'Haryana': {
    rice: { yield: 3.80, production: 4.0 },
    wheat: { yield: 4.80, production: 11.7 },
  },
  'Rajasthan': {
    rice: { yield: 2.00, production: 1.5 },
    wheat: { yield: 3.13, production: 12.1 },
  },
  'Gujarat': {
    rice: { yield: 2.20, production: 1.2 },
    wheat: { yield: 3.10, production: 4.1 },
  },
  'Maharashtra': {
    rice: { yield: 1.80, production: 2.0 },
    wheat: { yield: 1.80, production: 1.5 },
  },
};

const stateList = [
  'All India',
  'West Bengal',
  'Uttar Pradesh',
  'Punjab',
  'Andhra Pradesh',
  'Telangana',
  'Odisha',
  'Chhattisgarh',
  'Tamil Nadu',
  'Bihar',
  'Madhya Pradesh',
  'Haryana',
  'Rajasthan',
  'Gujarat',
  'Maharashtra',
];

// Prepare chart data for rice and wheat production across states
const chartData = stateList.filter(s => s !== 'All India').map(state => ({
  state,
  Rice: stateCropStats[state].rice.production,
  Wheat: stateCropStats[state].wheat.production,
}));

interface WeatherData {
  name: string;
  sys: { country: string };
  main: { temp: number; humidity: number };
  weather: { description: string; icon: string }[];
  wind: { speed: number };
}

interface ForecastDay {
  date: string;
  avgTemp: number;
  description: string;
  icon: string;
}

interface ForecastItem {
  dt: number;
  main: { temp: number };
  weather: { description: string; icon: string }[];
}

// Loan Estimator Card Component
const bankLoanData = [
  { name: "HDFC", icon: "🏦", rate: 120000 },
  { name: "SBI", icon: "🏛️", rate: 115000 },
  { name: "ICICI", icon: "💳", rate: 118000 },
  { name: "Axis Bank", icon: "🏢", rate: 117000 },
  { name: "Punjab National Bank", icon: "🏤", rate: 116000 },
];

// Bank URLs for Apply Now
const bankUrls: Record<string, string> = {
  HDFC: "https://www.hdfcbank.com",
  SBI: "https://sbi.co.in",
  ICICI: "https://www.icicibank.com",
  "Axis Bank": "https://www.axisbank.com",
  "Punjab National Bank": "https://www.pnbindia.in",
};

// Cursor context for Loan Estimator
const CursorTypes = {
  DEFAULT: "default",
  BANK: "bank",
  APPLY: "apply",
  INPUT: "input",
  RESET: "reset",
};

const CursorContext = React.createContext({
  setCursor: (type: string, tooltip?: string) => {},
});

function CustomCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [cursorType, setCursorType] = useState(CursorTypes.DEFAULT);
  const [tooltip, setTooltip] = useState<string | undefined>(undefined);
  const [clicked, setClicked] = useState(false);
  const [trailing, setTrailing] = useState({ x: 0, y: 0 });
  const requestRef = useRef<number>();

  // Trailing effect
  const animateTrailing = useCallback(() => {
    setTrailing((prev) => ({
      x: prev.x + (pos.x - prev.x) * 0.18,
      y: prev.y + (pos.y - prev.y) * 0.18,
    }));
    requestRef.current = requestAnimationFrame(animateTrailing);
  }, [pos]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animateTrailing);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [animateTrailing]);

  useEffect(() => {
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // Ripple on click
  useEffect(() => {
    const handleClick = () => {
      setClicked(true);
      setTimeout(() => setClicked(false), 350);
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);

  // Accessibility: fallback to default cursor
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return null;

  // Cursor visuals
  let cursorStyle = "";
  let cursorIcon = null;
  let auraColor = "rgba(34,197,94,0.18)";
  let showCaret = false;
  switch (cursorType) {
    case CursorTypes.BANK:
      cursorStyle = "border-2 border-blue-400 animate-pulse shadow-blue-200";
      auraColor = "rgba(59,130,246,0.18)";
      cursorIcon = (
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#60a5fa" strokeWidth="2" /><circle cx="12" cy="12" r="5" fill="#60a5fa" opacity="0.2" /></svg>
      );
      break;
    case CursorTypes.APPLY:
      cursorStyle = "border-2 border-green-400 shadow-green-200";
      auraColor = "rgba(34,197,94,0.18)";
      cursorIcon = (
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M7 12l5 5 5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      );
      break;
    case CursorTypes.INPUT:
      cursorStyle = "border-2 border-yellow-400 shadow-yellow-200";
      auraColor = "rgba(253,224,71,0.18)";
      showCaret = true;
      break;
    case CursorTypes.RESET:
      cursorStyle = "border-2 border-amber-400 animate-spin shadow-amber-200";
      auraColor = "rgba(251,191,36,0.18)";
      cursorIcon = (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M4 4v5h5" stroke="#f59e42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 20v-5h-5" stroke="#f59e42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 19A9 9 0 1 1 19 5" stroke="#f59e42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      );
      break;
    default:
      cursorStyle = "border-2 border-gray-300 shadow-gray-200";
      auraColor = "rgba(156,163,175,0.12)";
  }

  return (
    <>
      {/* Trailing aura */}
      <motion.div
        className="pointer-events-none fixed z-50"
        style={{ left: trailing.x - 24, top: trailing.y - 24 }}
        animate={{ opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 24, background: auraColor, filter: "blur(8px)",
        }} />
      </motion.div>
      {/* Main cursor */}
      <motion.div
        className={`pointer-events-none fixed z-50 transition-all duration-200 ${cursorStyle}`}
        style={{
          left: pos.x - 16,
          top: pos.y - 16,
          width: 32,
          height: 32,
          borderRadius: 16,
          background: "#fff",
          boxShadow: clicked ? "0 0 0 8px rgba(34,197,94,0.18)" : undefined,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        animate={{ scale: clicked ? 1.2 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {showCaret ? (
          <span className="block w-1 h-6 bg-yellow-400 animate-pulse rounded" style={{ marginLeft: 14 }} />
        ) : cursorIcon}
      </motion.div>
      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            className="pointer-events-none fixed z-50 px-3 py-1 rounded-xl bg-black/80 text-white text-xs font-medium shadow-lg"
            style={{ left: pos.x + 24, top: pos.y - 8 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            {tooltip}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function LoanEstimatorCard() {
  const [area, setArea] = useState<string>("");
  const [results, setResults] = useState<{ name: string; icon: string; loan: number }[] | null>(null);
  const [inputTouched, setInputTouched] = useState(false);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setArea(e.target.value.replace(/[^\d.]/g, ""));
    setInputTouched(true);
  };

  useEffect(() => {
    if (area && !isNaN(Number(area))) {
      const areaNum = parseFloat(area);
      setResults(
        bankLoanData.map((bank) => ({
          name: bank.name,
          icon: bank.icon,
          loan: Math.round(bank.rate * areaNum),
        }))
      );
    } else {
      setResults(null);
    }
  }, [area]);

  const handleReset = () => {
    setArea("");
    setResults(null);
    setInputTouched(false);
  };

  return (
    <motion.div
      className="rounded-3xl p-8 shadow-xl backdrop-blur-lg bg-gradient-to-br from-yellow-100/80 to-green-200/80 border border-white/40 flex flex-col gap-4 relative"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">📦</span>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Loan Estimator</h2>
      </div>
      <label className="block font-medium text-gray-700 mb-1" htmlFor="land-area">Land Area (in acres)</label>
      <div className="flex gap-2 items-center mb-2">
        <input
          id="land-area"
          type="number"
          min="0"
          step="0.01"
          className="rounded-xl px-4 py-2 border border-green-200 focus:ring-2 focus:ring-green-300 outline-none text-base w-40 text-green-900 font-semibold bg-white/80 shadow-sm"
          placeholder="e.g. 2.5"
          value={area}
          onChange={handleInput}
        />
        <button
          type="button"
          className="ml-2 bg-white/80 hover:bg-white/90 text-green-700 rounded-full px-4 py-2 font-semibold shadow border border-green-200 transition-all"
          onClick={handleReset}
          disabled={!area && !inputTouched}
        >
          Reset
        </button>
      </div>
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full bg-white/70 rounded-xl shadow border border-green-100">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-green-900 font-bold text-base">Bank Name</th>
                  <th className="px-4 py-2 text-left text-green-900 font-bold text-base">Estimated Loan</th>
                  <th className="px-4 py-2 text-left text-green-900 font-bold text-base">Apply</th>
                </tr>
              </thead>
              <tbody>
                {results.map((bank) => (
                  <tr key={bank.name} className="border-t border-green-100">
                    <td
                      className="px-4 py-2 flex items-center gap-2 text-green-900 font-medium cursor-pointer"
                      onClick={() => window.open(bankUrls[bank.name] || "#", "_blank")}
                      tabIndex={0}
                      aria-label={`Visit ${bank.name} official site`}
                    >
                      <span className="text-xl">{bank.icon}</span> {bank.name}
                    </td>
                    <td className="px-4 py-2 text-green-800 font-semibold">₹ {bank.loan.toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white rounded-full px-5 py-2 font-semibold shadow transition-all duration-200"
                        onClick={() => window.open(bankUrls[bank.name] || "#", "_blank")}
                      >
                        Apply Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function Index() {
  const [activeFeature, setActiveFeature] = useState<null | 'voice' | 'image' | 'video'>(null);
  const [isAIVideoModalOpen, setIsAIVideoModalOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [language, setLanguage] = useState<'english' | 'telugu' | 'hindi'>('english');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const t = labels[language];
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [customCity, setCustomCity] = useState<string>("");
  const [showCityInput, setShowCityInput] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [cropPrices, setCropPrices] = useState({ rice: null, wheat: null });
  const [cropLoading, setCropLoading] = useState(true);
  const [cropError, setCropError] = useState(null);

  // Add state selection
  const [selectedState, setSelectedState] = useState('All India');

  const cropStats = stateCropStats[selectedState] || stateCropStats['All India'];

  const handleCardClick = (feature: 'voice' | 'image' | 'video') => {
    if (feature === 'video') {
      setIsAIVideoModalOpen(true);
    } else {
      setActiveFeature(feature);
      setActiveNav(feature === 'voice' ? 'voice' : feature === 'image' ? 'camera' : 'home');
    }
  };

  const handleCloseAIVideoModal = () => {
    setIsAIVideoModalOpen(false);
  };

  const handleBack = () => {
    setActiveFeature(null);
    setActiveNav('home');
  };

  // Cupertino glassmorphism card style
  const cardClass =
    "rounded-3xl p-8 shadow-xl backdrop-blur-lg bg-white/70 border border-white/40 transition-transform hover:scale-[1.03] hover:bg-white/80 focus:outline-none focus:ring-4 focus:ring-blue-200";

  // Cupertino gradient background
  const gradientBg =
    "min-h-screen font-sans bg-gradient-to-br from-[#e0e7ef] via-[#f8fafc] to-[#e3e9f7] p-0 sm:p-0 flex flex-col pb-36";

  // Cupertino nav bar style
  const navClass =
    "fixed bottom-0 left-0 w-full z-50 flex justify-center";
  const navInnerClass =
    "mx-auto max-w-2xl w-full rounded-t-3xl shadow-2xl bg-white/80 border-t border-white/40 flex justify-around py-3 px-2 backdrop-blur-lg";

  // System font stack for iOS look
  const fontClass = "font-sans";

  // Nav items with translation
  const navTranslated = [
    { key: 'home', label: t.home, icon: '🏠' },
    { key: 'voice', label: t.voiceAssistant, icon: '🎤' },
    { key: 'camera', label: t.camera, icon: '📷' },
    { key: 'stats', label: t.stats, icon: '📊' },
    { key: 'help', label: t.help, icon: '❓' },
  ];

  const [isPlaying, setIsPlaying] = useState(false);

  const playTeluguTTS = async (text: string) => {
    setIsPlaying(true);
    const res = await fetch('http://localhost:5002/api/tts-telugu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return setIsPlaying(false);
    const audioBlob = await res.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    audio.play();
  };

  async function fetchWeather(lat: number, lon: number) {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      // Fetch current weather
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
      const weatherRes = await fetch(weatherUrl);
      if (!weatherRes.ok) throw new Error("Failed to fetch weather");
      const weatherData: WeatherData = await weatherRes.json();
      setWeather(weatherData);

      // Fetch forecast
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
      const forecastRes = await fetch(forecastUrl);
      if (!forecastRes.ok) throw new Error("Failed to fetch forecast");
      const forecastData = await forecastRes.json();
      // Group by day, get next 2 days (excluding today)
      const today = new Date().getDate();
      const daily: { [date: string]: ForecastItem[] } = {};
      (forecastData.list as ForecastItem[]).forEach((item) => {
        const date = new Date(item.dt * 1000);
        const day = date.getDate();
        if (day !== today) {
          const key = date.toISOString().split('T')[0];
          if (!daily[key]) daily[key] = [];
          daily[key].push(item);
        }
      });
      // Get next 2 days
      const next2Days: ForecastDay[] = Object.keys(daily).slice(0, 2).map(key => {
        const temps = daily[key].map(i => i.main.temp);
        const avgTemp = temps.reduce((a: number, b: number) => a + b, 0) / temps.length;
        const weatherCounts: { [desc: string]: number } = {};
        daily[key].forEach(i => {
          const desc = i.weather[0].description;
          weatherCounts[desc] = (weatherCounts[desc] || 0) + 1;
        });
        const mainDesc = Object.entries(weatherCounts).sort((a, b) => b[1] - a[1])[0][0];
        const icon = daily[key][0].weather[0].icon;
        return {
          date: key,
          avgTemp: Math.round(avgTemp),
          description: mainDesc,
          icon,
        };
      });
      setForecast(next2Days);
    } catch (err: unknown) {
      setWeatherError("Could not fetch weather data.");
      setForecast([]);
    } finally {
      setWeatherLoading(false);
    }
  }

  async function fetchWeatherByCity(city: string) {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      // Fetch current weather
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
      const weatherRes = await fetch(weatherUrl);
      if (!weatherRes.ok) throw new Error("City not found");
      const weatherData: WeatherData = await weatherRes.json();
      setWeather(weatherData);
      setCustomCity(city);
      setShowCityInput(false);

      // Fetch forecast
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
      const forecastRes = await fetch(forecastUrl);
      if (!forecastRes.ok) throw new Error("Failed to fetch forecast");
      const forecastData = await forecastRes.json();
      // Group by day, get next 2 days (excluding today)
      const today = new Date().getDate();
      const daily: { [date: string]: ForecastItem[] } = {};
      (forecastData.list as ForecastItem[]).forEach((item) => {
        const date = new Date(item.dt * 1000);
        const day = date.getDate();
        if (day !== today) {
          const key = date.toISOString().split('T')[0];
          if (!daily[key]) daily[key] = [];
          daily[key].push(item);
        }
      });
      // Get next 2 days
      const next2Days: ForecastDay[] = Object.keys(daily).slice(0, 2).map(key => {
        const temps = daily[key].map(i => i.main.temp);
        const avgTemp = temps.reduce((a: number, b: number) => a + b, 0) / temps.length;
        const weatherCounts: { [desc: string]: number } = {};
        daily[key].forEach(i => {
          const desc = i.weather[0].description;
          weatherCounts[desc] = (weatherCounts[desc] || 0) + 1;
        });
        const mainDesc = Object.entries(weatherCounts).sort((a, b) => b[1] - a[1])[0][0];
        const icon = daily[key][0].weather[0].icon;
        return {
          date: key,
          avgTemp: Math.round(avgTemp),
          description: mainDesc,
          icon,
        };
      });
      setForecast(next2Days);
    } catch (err: unknown) {
      setWeatherError("City not found. Please try again.");
      setForecast([]);
    } finally {
      setWeatherLoading(false);
    }
  }

  function handleRefresh() {
    setWeatherError(null);
    setCustomCity("");
    setShowCityInput(false);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          fetchWeather(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon);
        },
        { timeout: 5000 }
      );
    } else {
      fetchWeather(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon);
    }
  }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          fetchWeather(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon);
        },
        { timeout: 5000 }
      );
    } else {
      fetchWeather(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon);
    }
  }, []);

  useEffect(() => {
    setCropLoading(true);
    setCropError(null);
    setTimeout(() => {
      setCropPrices({
        rice: { yield: cropStats.rice.yield * 100, production: cropStats.rice.production * 1000000 },
        wheat: { yield: cropStats.wheat.yield * 100, production: cropStats.wheat.production * 1000000 },
      });
      setCropLoading(false);
    }, 300); // Simulate loading
  }, [selectedState, cropStats.rice.yield, cropStats.rice.production, cropStats.wheat.yield, cropStats.wheat.production]);

  return (
    <div
      className="min-h-screen w-full bg-gray-100/50 text-gray-800 transition-colors duration-500 relative flex flex-col items-center justify-center py-12"
      style={{
        backgroundImage: `url('https://res.cloudinary.com/dzn5zamaf/image/upload/v1750483111/terraces-5568679_zqfwvp.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/30 z-0" />
      <div className="relative z-10 w-full">
        <header className="fixed top-0 left-0 right-0 z-50 p-4">
          <div className="flex justify-end items-center">
            <div className="relative">
              <button
                className="bg-white/80 rounded-full px-6 py-2 shadow-md flex items-center text-gray-700 font-semibold text-lg border border-white/40 hover:bg-white/90 transition-all duration-200"
                onClick={() => setShowLangDropdown((v) => !v)}
              >
                <span className="mr-2">🌐</span> {t.language}
              </button>
              {showLangDropdown && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-lg border border-gray-200 z-50">
                  <button
                    className={`w-full text-left px-4 py-2 rounded-t-2xl hover:bg-blue-50 ${language === 'english' ? 'font-bold text-blue-600' : ''}`}
                    onClick={() => { setLanguage('english'); setShowLangDropdown(false); }}
                  >
                    English
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 hover:bg-blue-50 ${language === 'telugu' ? 'font-bold text-blue-600' : ''}`}
                    onClick={() => { setLanguage('telugu'); setShowLangDropdown(false); }}
                  >
                    తెలుగు
                  </button>
                  <button
                    className={`w-full text-left px-4 py-2 rounded-b-2xl hover:bg-blue-50 ${language === 'hindi' ? 'font-bold text-blue-600' : ''}`}
                    onClick={() => { setLanguage('hindi'); setShowLangDropdown(false); }}
                  >
                    हिंदी
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={fadeInOut}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="min-h-screen"
          >
            <div className={gradientBg + ' ' + fontClass} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
              {/* Header */}
              <div className="flex justify-between items-center mb-10 mt-8 px-6 relative">
                <h1 className="text-5xl font-extrabold text-gray-900 drop-shadow-lg tracking-tight" style={{letterSpacing: '-0.01em'}}>{t.greeting}</h1>
              </div>

              {/* Main Content: Dashboard or Feature */}
              {activeFeature === null && (
                <div className="max-w-5xl mx-auto w-full flex flex-col gap-10 px-4 md:px-0">
                  {/* Move Action Cards Row to Top */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                    <motion.div
                      variants={slideUp}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className={`${cardClass} bg-gradient-to-br from-blue-100/80 to-blue-400/80 text-blue-900 flex flex-col items-center active:scale-95`}
                      onClick={() => handleCardClick('voice')}
                      style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)' }}
                    >
                      <div className="text-5xl mb-3">🎤</div>
                      <div className="font-extrabold text-2xl mb-1">{t.voiceAssistant}</div>
                      <div className="text-base font-medium opacity-80">{t.voiceDesc}</div>
                    </motion.div>
                    <motion.div
                      variants={slideUp}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className={`${cardClass} bg-gradient-to-br from-green-100/80 to-green-400/80 text-green-900 flex flex-col items-center active:scale-95`}
                      onClick={() => handleCardClick('image')}
                      style={{ boxShadow: '0 8px 32px 0 rgba(31, 135, 38, 0.10)' }}
                    >
                      <div className="text-5xl mb-3">📷</div>
                      <div className="font-extrabold text-2xl mb-1">{t.diseaseDetection}</div>
                      <div className="text-base font-medium opacity-80">{t.diseaseDesc}</div>
                    </motion.div>
                    <motion.div
                      variants={slideUp}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className={`${cardClass} bg-gradient-to-br from-purple-100/80 to-purple-400/80 text-purple-900 flex flex-col items-center active:scale-95`}
                      onClick={() => handleCardClick('video')}
                      style={{ boxShadow: '0 8px 32px 0 rgba(135, 31, 135, 0.10)' }}
                    >
                      <div className="text-5xl mb-3">🎥</div>
                      <div className="font-extrabold text-2xl mb-1">{t.expertCall}</div>
                      <div className="text-base font-medium opacity-80">{t.expertDesc}</div>
                    </motion.div>
                  </div>
                  {/* Move Weather and Crop Stats Cards Row to Bottom */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                    {/* Weather Card */}
                    <motion.div
                      variants={slideUp}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className={`${cardClass} bg-gradient-to-br from-blue-100/80 to-blue-300/60 text-blue-900 relative`}
                    >
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          className="bg-white/70 hover:bg-white/90 rounded-full p-2 shadow border border-blue-100 transition-all"
                          title="Refresh Weather"
                          onClick={handleRefresh}
                          disabled={weatherLoading}
                        >
                          <RefreshCw className={`w-5 h-5 ${weatherLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          className="bg-white/70 hover:bg-white/90 rounded-full p-2 shadow border border-blue-100 transition-all"
                          title="Change Location"
                          onClick={() => { setShowCityInput(v => !v); setTimeout(() => cityInputRef.current?.focus(), 100); }}
                          disabled={weatherLoading}
                        >
                          <MapPin className="w-5 h-5" />
                        </button>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">🌤️ {t.weather}</h2>
                        {showCityInput && (
                          <form
                            className="flex gap-2 mb-2"
                            onSubmit={e => { e.preventDefault(); if (cityInputRef.current?.value) fetchWeatherByCity(cityInputRef.current.value); }}
                          >
                            <input
                              ref={cityInputRef}
                              type="text"
                              placeholder="Enter city name"
                              className="rounded-xl px-3 py-1 border border-blue-200 focus:ring-2 focus:ring-blue-300 outline-none text-base"
                              disabled={weatherLoading}
                            />
                            <button
                              type="submit"
                              className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-4 py-1 font-semibold"
                              disabled={weatherLoading}
                            >Go</button>
                          </form>
                        )}
                        {weatherLoading ? (
                          <div className="flex items-center gap-2 text-lg animate-pulse"><span className="w-8 h-8 rounded-full bg-blue-200 animate-pulse"></span> Loading...</div>
                        ) : weatherError ? (
                          <div className="text-red-500">{weatherError}</div>
                        ) : weather ? (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-blue-600">📍</span>
                              <span className="font-semibold text-base">{weather.name}{weather.sys && weather.sys.country ? `, ${weather.sys.country}` : ''}</span>
                            </div>
                            <div className="text-5xl font-extrabold">{Math.round(weather.main.temp)}°C</div>
                            <div className="text-lg font-medium capitalize">{weather.weather[0].description}</div>
                            {/* Forecast for next 2 days */}
                            {forecast.length > 0 && (
                              <div className="mt-4">
                                <div className="font-semibold mb-1">Next 2 Days Forecast:</div>
                                <div className="flex gap-4">
                                  {forecast.map(day => (
                                    <div key={day.date} className="flex flex-col items-center bg-blue-50/80 rounded-xl px-3 py-2 shadow border border-blue-100 min-w-[90px]">
                                      <span className="text-sm font-medium">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                      <img src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`} alt={day.description} className="w-10 h-10" />
                                      <span className="text-lg font-bold">{day.avgTemp}°C</span>
                                      <span className="text-xs capitalize text-blue-700">{day.description}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : null}
                      </div>
                      <div className="mt-6 flex justify-between text-base font-medium">
                        {weather && !weatherLoading && !weatherError ? (
                          <>
                            <span>💧 {t.humidity}: {weather.main.humidity}%</span>
                            <span>💨 {t.wind}: {Math.round(weather.wind.speed)} km/h</span>
                          </>
                        ) : (
                          <>
                            <span>💧 {t.humidity}: --</span>
                            <span>💨 {t.wind}: --</span>
                          </>
                        )}
                      </div>
                    </motion.div>
                    {/* Crop Stats Card */}
                    <motion.div
                      variants={slideUp}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className={`${cardClass} bg-gradient-to-br from-green-100/80 to-green-300/60 text-green-900`}
                    >
                      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"> {t.cropStats}</h2>
                      <div className="mb-4">
                        <label className="block mb-2 font-medium">Select State:</label>
                        <div className="relative">
                          <select
                            className="rounded-xl px-4 py-2 border border-green-200 focus:ring-2 focus:ring-green-300 outline-none text-base appearance-none pr-10 w-full text-green-900 font-semibold"
                            value={selectedState}
                            onChange={e => setSelectedState(e.target.value)}
                          >
                            {stateList.map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute right-4 top-1/2 transform -translate-y-1/2 text-green-700">
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </span>
                        </div>
                      </div>
                      <div className="mb-4 bg-green-50/80 rounded-2xl p-6 shadow-sm border border-green-100">
                        <div className="font-extrabold text-xl mb-2 text-green-900">{t.rice}</div>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-base">
                          <div className="text-green-800 font-medium">{t.avgYield}</div>
                          <div className="text-green-900 font-semibold">{cropLoading ? 'Loading...' : cropError ? 'N/A' : cropPrices.rice ? `${(cropPrices.rice.yield/100).toFixed(2)} tons/ha` : 'N/A'}</div>
                          <div className="text-green-800 font-medium">{t.production}</div>
                          <div className="text-green-900 font-semibold">{cropLoading ? 'Loading...' : cropError ? 'N/A' : cropPrices.rice ? `${(cropPrices.rice.production/1000000).toFixed(1)} million t` : 'N/A'}</div>
                        </div>
                        <div className="text-xs text-right text-green-700 mt-4 opacity-80">{t.source}</div>
                      </div>
                      <div className="bg-green-50/80 rounded-2xl p-6 shadow-sm border border-green-100">
                        <div className="font-extrabold text-xl mb-2 text-green-900">{t.wheat}</div>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-base">
                          <div className="text-green-800 font-medium">{t.avgYield}</div>
                          <div className="text-green-900 font-semibold">{cropLoading ? 'Loading...' : cropError ? 'N/A' : cropPrices.wheat ? `${(cropPrices.wheat.yield/100).toFixed(2)} tons/ha` : 'N/A'}</div>
                          <div className="text-green-800 font-medium">{t.production}</div>
                          <div className="text-green-900 font-semibold">{cropLoading ? 'Loading...' : cropError ? 'N/A' : cropPrices.wheat ? `${(cropPrices.wheat.production/1000000).toFixed(1)} million t` : 'N/A'}</div>
                        </div>
                        <div className="text-xs text-right text-green-700 mt-4 opacity-80">{t.source}</div>
                      </div>
                    </motion.div>
                    {/* Loan Estimator Card: Make full width */}
                    <div className="w-full mt-8">
                      <LoanEstimatorCard />
                    </div>
                    {/* Animated Bar Chart: Rice & Wheat Production by State */}
                    <motion.div
                      variants={slideUp}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="md:col-span-2 rounded-3xl shadow-2xl border border-green-200 bg-gradient-to-br from-green-50/80 via-white/90 to-green-100/80 p-8 relative overflow-hidden w-full"
                    >
                      <h3 className="text-3xl font-extrabold mb-2 text-green-900 tracking-tight text-center drop-shadow-lg">🌾 Statewise Production Comparison</h3>
                      <div className="flex justify-center mb-4">
                        <Legend layout="horizontal" align="center" iconType="rect" wrapperStyle={{ fontSize: '1.1rem', fontWeight: 600, color: '#166534' }} />
                      </div>
                      <div className="w-full overflow-x-auto">
                        <div style={{ minWidth: 900 }}>
                          <ResponsiveContainer width="100%" height={380}>
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }} barGap={8}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis
                                dataKey="state"
                                interval={0}
                                height={80}
                                tick={props => (
                                  <text
                                    x={props.x}
                                    y={props.y}
                                    dy={16}
                                    textAnchor="end"
                                    transform={`rotate(-30,${props.x},${props.y})`}
                                    fill="#166534"
                                    fontSize={14}
                                    fontWeight={500}
                                  >
                                    {props.payload.value}
                                  </text>
                                )}
                              />
                              <YAxis label={{ value: 'Production (million t)', angle: -90, position: 'insideLeft', fontSize: 16, fontWeight: 600, fill: '#166534' }} tick={{ fontSize: 16, fontWeight: 500, fill: '#166534' }} axisLine={false} />
                              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 16, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }} formatter={(value) => value === 0 ? 'N/A' : value} />
                              <Bar dataKey="Rice" fill="#38bdf8" radius={[8, 8, 0, 0]} isAnimationActive>
                                <LabelList dataKey="Rice" position="top" formatter={v => v === 0 ? '' : v} style={{ fontWeight: 700, fill: '#0ea5e9', fontSize: 14 }} />
                              </Bar>
                              <Bar dataKey="Wheat" fill="#22c55e" radius={[8, 8, 0, 0]} isAnimationActive>
                                <LabelList dataKey="Wheat" position="top" formatter={v => v === 0 ? '' : v} style={{ fontWeight: 700, fill: '#16a34a', fontSize: 14 }} />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="text-xs text-right text-green-700 mt-4 opacity-80">{t.source}</div>
                      {/* Optional: faint background icon for extra flair */}
                      <svg className="absolute -bottom-8 -right-8 opacity-10" width="120" height="120" viewBox="0 0 120 120" fill="none"><circle cx="60" cy="60" r="60" fill="#22c55e" /></svg>
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Feature Views */}
              {activeFeature === 'voice' && (
                <div className="max-w-2xl mx-auto px-4">
                  <button
                    onClick={handleBack}
                    className="mb-8 bg-white/90 px-6 py-2 rounded-full shadow text-gray-700 hover:bg-white/95 font-semibold text-lg border border-white/40 transition-all duration-200"
                  >
                    ← {t.home}
                  </button>
                  <VoiceAssistant language={language} />
                </div>
              )}
              {activeFeature === 'image' && (
                <div className="max-w-2xl mx-auto px-4">
                  <button
                    onClick={handleBack}
                    className="mb-8 bg-white/90 px-6 py-2 rounded-full shadow text-gray-700 hover:bg-white/95 font-semibold text-lg border border-white/40 transition-all duration-200"
                  >
                    ← {t.home}
                  </button>
                  <ImageAnalysis language={language} />
                </div>
              )}
              {/* AI Video Call Modal (Expert Call) */}
              <AIVideoCallModal isOpen={isAIVideoModalOpen} onClose={handleCloseAIVideoModal} language={language} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
