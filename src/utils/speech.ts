let synth: SpeechSynthesis | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  synth = window.speechSynthesis;
}

export function speakText(text: string, rate: number = 0.95, onEnd?: () => void): void {
  if (!synth) return;

  // Stop any active audio
  synth.cancel();

  // Clean text for clearer speech
  const cleaned = text
    .replace(/[#*_~`]/g, '')
    .replace(/วรรคหนึ่ง|วรรคสอง|วรรคสาม/g, match => ` ${match} `);

  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.lang = 'th-TH';
  utterance.rate = rate;
  utterance.pitch = 1.0;

  // Find a Thai voice if available
  const voices = synth.getVoices();
  const thaiVoice = voices.find(v => v.lang.startsWith('th'));
  if (thaiVoice) {
    utterance.voice = thaiVoice;
  }

  if (onEnd) {
    utterance.onend = () => onEnd();
    utterance.onerror = () => onEnd();
  }

  currentUtterance = utterance;
  synth.speak(utterance);
}

export function stopSpeaking(): void {
  if (synth) {
    synth.cancel();
    currentUtterance = null;
  }
}

export function isSpeaking(): boolean {
  return synth ? synth.speaking : false;
}
