import React, { useEffect, useRef } from 'react';

export function showConfetti() {
  try {
    // Create confetti element
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.top = '0';
    confetti.style.left = '0';
    confetti.style.width = '100%';
    confetti.style.height = '100%';
    confetti.style.pointerEvents = 'none';
    confetti.style.zIndex = '9999';
    confetti.style.overflow = 'hidden';
    
    // Create multiple confetti pieces
    for (let i = 0; i < 50; i++) {
      const piece = document.createElement('div');
      piece.style.position = 'absolute';
      
      // Random shapes and sizes
      const size = Math.random() * 8 + 6; // 6-14px
      const shape = Math.random();
      
      if (shape < 0.33) {
        // Square
        piece.style.width = size + 'px';
        piece.style.height = size + 'px';
        piece.style.borderRadius = '2px';
      } else if (shape < 0.66) {
        // Circle
        piece.style.width = size + 'px';
        piece.style.height = size + 'px';
        piece.style.borderRadius = '50%';
      } else {
        // Rectangle
        piece.style.width = size + 'px';
        piece.style.height = (size * 1.5) + 'px';
        piece.style.borderRadius = '1px';
      }
      
      piece.style.backgroundColor = getRandomColor();
      piece.style.left = Math.random() * 100 + '%';
      piece.style.top = '-20px';
      piece.style.animationDuration = (Math.random() * 3 + 2) + 's';
      piece.style.animationTimingFunction = 'ease-out';
      piece.style.animationName = 'confetti-fall';
      piece.style.animationFillMode = 'forwards';
      piece.style.animationDelay = (Math.random() * 0.5) + 's';
      piece.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
      
      confetti.appendChild(piece);
    }
    
    // Add CSS animation
    if (!document.getElementById('confetti-styles')) {
      const style = document.createElement('style');
      style.id = 'confetti-styles';
      style.textContent = `
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(confetti);
    
    // Remove confetti after animation
    setTimeout(() => {
      try {
        if (confetti && confetti.parentNode) {
          document.body.removeChild(confetti);
        }
      } catch (error) {
        console.log('Confetti cleanup error:', error);
      }
    }, 5000);
    
    console.log('Confetti triggered successfully!');
  } catch (error) {
    console.error('Error showing confetti:', error);
  }
}

function getRandomColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#FFD93D', '#6BCF7F', '#4D96FF', '#9F7AEA', '#F687B3',
    '#38B2AC', '#FC8181', '#68D391', '#63B3ED', '#B794F6'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function ConfettiComponent() {
  return null; // This is just a utility component
}