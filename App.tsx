
import React from 'react';
import VirtualPiano from './components/VirtualPiano';

const App: React.FC = () => {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-sans">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Piano Zehn
          </h1>
          <p className="mt-2 text-lg text-gray-300">
            Use suas mãos para tocar piano em frente à sua webcam.
          </p>
        </header>
        <div className="aspect-video bg-black rounded-lg shadow-2xl shadow-purple-500/20 overflow-hidden border-2 border-gray-700">
          <VirtualPiano />
        </div>
        <footer className="text-center mt-6 text-gray-500 text-sm">
          <p>Desenvolvido com React, Tailwind CSS e Google MediaPipe</p>
          <p>Passe as pontas dos dedos sobre as teclas para tocar as notas.</p>
        </footer>
      </div>
    </main>
  );
};

export default App;
