// The Web Speech API's SpeechRecognition interface is supported in
// Chrome/Edge/Android (usually prefixed as webkitSpeechRecognition) but
// isn't part of TypeScript's standard DOM type library. These are minimal
// ambient declarations covering only what this app actually uses.
//
// Everything must live inside `declare global` - since this file has an
// `export`, TypeScript treats it as a module, and only declarations inside
// `declare global` actually become globally available elsewhere.

export {};

declare global {
  interface SpeechRecognitionResult {
    [index: number]: { transcript: string };
  }

  interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
  }

  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}
