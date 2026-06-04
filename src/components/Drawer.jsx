import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from '@mui/icons-material/Close';

export default function Drawer({ isOpen, onClose, title, children }) {
  const [isClosing, setIsClosing] = useState(false);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsClosing(false);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250); // Matches the CSS animation duration
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    touchDeltaX.current = currentX - touchStartX.current;
    
    // Only allow swiping to the right (closing direction)
    if (touchDeltaX.current > 0 && drawerRef.current) {
      drawerRef.current.style.transform = `translateX(${touchDeltaX.current}px)`;
      drawerRef.current.style.transition = 'none';
    }
  };

  const handleTouchEnd = () => {
    if (drawerRef.current) {
      drawerRef.current.style.transition = 'transform 0.25s ease';
      if (touchDeltaX.current > 100) {
        // Swiped far enough to close
        drawerRef.current.style.transform = `translateX(100%)`;
        setTimeout(onClose, 250);
      } else {
        // Snap back
        drawerRef.current.style.transform = `translateX(0)`;
      }
    }
  };

  if (!isOpen && !isClosing) return null;

  const content = (
    <div className="drawer-overlay" onClick={handleClose}>
      <div 
        ref={drawerRef}
        className={`drawer-panel ${isClosing ? 'drawer-closing' : ''}`} 
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="drawer-header">
          <h2>{title}</h2>
          <button className="drawer-close-btn" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>
        <div className="drawer-body">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
