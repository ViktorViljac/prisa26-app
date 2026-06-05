const fs = require('fs');
const css = `
/* ---------------------------------------------------- */
/* ARENA PREMIUM REDESIGN */
/* ---------------------------------------------------- */

.arena-premium-container {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  padding: 32px 24px;
  background: linear-gradient(145deg, #1e293b, #0f172a);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  text-align: center;
}

.arena-premium-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
  animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.7; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.7; }
}

.arena-boss-image {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  animation: float-boss 4s ease-in-out infinite;
  z-index: 2;
}

@keyframes float-boss {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

.arena-hp-bar-bg {
  width: 100%;
  height: 28px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  backdrop-filter: blur(4px);
}

.arena-hp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #dc2626, #f97316, #fbbf24);
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
  transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
  border-radius: 14px;
  box-shadow: 0 0 10px rgba(249, 115, 22, 0.5);
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.arena-victory-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fade-in-victory 1s ease-out forwards;
}

@keyframes fade-in-victory {
  from { opacity: 0; transform: scale(1.1); }
  to { opacity: 1; transform: scale(1); }
}

.victory-title {
  font-family: var(--font-heading);
  font-size: 3rem;
  font-weight: 900;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 16px 0;
  text-shadow: 0 4px 20px rgba(245, 158, 11, 0.4);
}

.victory-message {
  font-size: 1.1rem;
  color: #e2e8f0;
  line-height: 1.6;
  max-width: 400px;
  text-align: center;
}

.arena-timer {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 800;
  font-size: 0.9rem;
  margin-bottom: 24px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.arena-damage-log {
  background: #ffffff;
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  margin-top: 24px;
  border: 1px solid #f1f5f9;
}
`;

fs.appendFileSync('/Users/vikrot/Desktop/Projekti/Prisa-app/src/index.css', css);
console.log('Appended to index.css');
