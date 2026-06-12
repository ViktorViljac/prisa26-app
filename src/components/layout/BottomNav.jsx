import HomeIcon from '@mui/icons-material/Home';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import posthog from 'posthog-js';

const NAV_ITEMS = [
  { label: 'Početna', icon: HomeIcon, index: 0 },
  { label: 'Navike', icon: EmojiEventsIcon, index: 1 },
  { label: 'Arena', icon: SportsKabaddiIcon, index: 2, isArena: true },
  { label: 'Liderbord', icon: LeaderboardIcon, index: 3 },
  { label: 'Postignuća', icon: MilitaryTechIcon, index: 4 },
];

export default function BottomNav({ navValue, setNavValue, arenaEnabled }) {
  const visibleItems = NAV_ITEMS.filter(item => !item.isArena || arenaEnabled);

  return (
    <nav className="bottom-nav">
      {visibleItems.map((item) => (
        <button
          key={item.index}
          className={`bottom-nav-item ${navValue === item.index ? 'active' : ''}`}
          onClick={() => {
            setNavValue(item.index);
            posthog.capture('screen_viewed', {
              screen_index: item.index,
              screen_name: item.label,
              source: 'bottom_nav',
            });
          }}
        >
          <item.icon />
          <span className="bottom-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

