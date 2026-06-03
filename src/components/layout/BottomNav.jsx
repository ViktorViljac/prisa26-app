import HomeIcon from '@mui/icons-material/Home';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';

const NAV_ITEMS = [
  { label: 'Početna', icon: HomeIcon },
  { label: 'Navike', icon: EmojiEventsIcon },
  { label: 'Arena', icon: SportsKabaddiIcon },
  { label: 'Rang', icon: LeaderboardIcon },
  { label: 'Izazovi', icon: MilitaryTechIcon },
];

export default function BottomNav({ navValue, setNavValue }) {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item, idx) => (
        <button
          key={idx}
          className={`bottom-nav-item ${navValue === idx ? 'active' : ''}`}
          onClick={() => setNavValue(idx)}
        >
          <item.icon />
          <span className="bottom-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
