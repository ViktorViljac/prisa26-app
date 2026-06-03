export default function XpRing({ level, xpInto, xpTotal, animatedXp }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = xpTotal > 0 ? xpInto / xpTotal : 0;
  const dashOffset = circumference - (progress * circumference);

  return (
    <div className="xp-ring-wrap">
      <svg className="xp-ring-svg" viewBox="0 0 100 100">
        {/* Track */}
        <circle className="xp-ring-track" cx="50" cy="50" r={radius} />
        {/* Glow */}
        <circle
          className="xp-ring-glow"
          cx="50" cy="50" r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
        {/* Fill */}
        <circle
          className="xp-ring-fill"
          cx="50" cy="50" r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="xp-ring-center">
        <span className="xp-ring-level">{level}</span>
        <span className="xp-ring-label">razina</span>
      </div>
    </div>
  );
}
