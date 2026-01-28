import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, PartyPopper, CheckCircle2, GripVertical } from 'lucide-react';

const Confetti = ({
    isVisible,
    onClose,
}) => {
    const containerRef = useRef(null);
    const intervalRef = useRef(null);

    const colors = [
        '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
        '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
        '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
    ];

    const createConfettiPiece = useCallback(() => {
        if (!containerRef.current || !isVisible) return;

        const piece = document.createElement('div');
        const size = Math.random() * 8 + 4 + 'px';
        const color = colors[Math.floor(Math.random() * colors.length)];

        piece.style.position = 'absolute';
        piece.style.pointerEvents = 'none';
        piece.style.zIndex = '100';
        piece.style.width = size;
        piece.style.height = size;
        piece.style.backgroundColor = color;
        piece.style.left = Math.random() * 100 + 'vw';
        piece.style.top = '-20px';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        piece.style.opacity = '1';

        containerRef.current.appendChild(piece);

        const animation = piece.animate([
            { transform: `translate3d(0, 0, 0) rotate(0deg)`, opacity: 1 },
            {
                transform: `translate3d(${(Math.random() - 0.5) * 300}px, 100vh, 0) rotate(${Math.random() * 360 * 5}deg)`,
                opacity: 0
            }
        ], {
            duration: Math.random() * 2000 + 1500,
            easing: 'cubic-bezier(0, .9, .57, 1)',
        });

        animation.onfinish = () => piece.remove();
    }, [colors, isVisible]);

    useEffect(() => {
        if (isVisible) {
            // 1. Start confetti burst
            for (let i = 0; i < 100; i++) createConfettiPiece();

            // 2. Continuous sprinkle
            intervalRef.current = setInterval(createConfettiPiece, 100);

            // 3. AUTO-DISMISS after 3 seconds
            const timer = setTimeout(() => {
                onClose();
            }, 3000);

            return () => {
                clearTimeout(timer);
                if (intervalRef.current) clearInterval(intervalRef.current);
            };
        }
    }, [isVisible, onClose, createConfettiPiece]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden pointer-events-none">
            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>

            {/* Confetti Container */}
            <div ref={containerRef} className="absolute inset-0 z-10" />

            {/* Transparent Message Card */}
            {/* <main className="relative z-20 px-8 py-10 text-center bg-white/10 backdrop-blur-md border border-white/20 rounded-[3rem] shadow-2xl max-w-lg mx-4 pointer-events-auto animate-in zoom-in-90 fade-in duration-300">
                <div className="mb-6 inline-block animate-float">
                    <div className="bg-gradient-to-tr from-yellow-400 to-orange-500 p-5 rounded-full shadow-lg border-4 border-white">
                        <PartyPopper className="w-10 h-10 text-white" />
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter drop-shadow-lg">
                    {title}
                </h1>

                <p className="text-lg text-white font-semibold drop-shadow-md">
                    {message}
                </p>

                <div className="mt-6 flex items-center justify-center gap-2 text-white/80 text-xs font-bold tracking-widest uppercase">
                    <Sparkles className="w-4 h-4" />
                    Auto-closing in 3s
                    <Sparkles className="w-4 h-4" />
                </div>
            </main> */}
        </div>
    );
};
export default Confetti;
