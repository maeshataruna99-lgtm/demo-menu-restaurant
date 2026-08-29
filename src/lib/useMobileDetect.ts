import { useEffect, useState } from 'react';

/**
 * Hook untuk mendeteksi perangkat mobile dan mengatur viewport secara presisi
 */
export function useMobileDetect() {
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | undefined>(undefined);
  
  useEffect(() => {
    // Deteksi mobile berdasarkan user agent dan lebar layar
    const checkMobile = () => {
      const ua = navigator.userAgent;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileDevice = mobileRegex.test(ua) || window.innerWidth < 768;
      
      setIsMobile(isMobileDevice);
      setIsIOS(/iPad|iPhone|iPod/.test(ua));
      
      // Set custom CSS variable untuk viewport height pada mobile
      if (isMobileDevice) {
        const vh = window.innerHeight * 0.01;
        setViewportHeight(vh);
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Fix untuk iOS Safari - tambahkan class ke body
        if (/iPad|iPhone|iPod/.test(ua)) {
          document.body.classList.add('ios');
        }
      } else {
        document.documentElement.style.removeProperty('--vh');
        document.body.classList.remove('ios');
      }
    };

    // Initial check
    checkMobile();

    // Listen resize events
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkMobile, 150);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return { isMobile, isIOS, viewportHeight };
}

/**
 * Hook untuk mencegah scroll pada body saat modal/drawer terbuka
 */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) {
      // Restore scroll saat unlock
      document.body.classList.remove('scroll-locked');
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
      document.body.style.left = '';
      return;
    }

    // Simpan scroll position saat ini
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    // Lock scroll dengan class CSS
    document.body.classList.add('scroll-locked');
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = `-${scrollX}px`;
    
    // Restore scroll position ketika unlock
    return () => {
      document.body.classList.remove('scroll-locked');
      document.body.style.top = '';
      document.body.style.left = '';
      window.scrollTo(scrollX, scrollY);
    };
  }, [locked]);
}

/**
 * Hook untuk menangani safe area insets pada perangkat dengan notch
 */
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const updateInsets = () => {
      // Dapatkan nilai dari CSS env() variables
      const getEnvValue = (name: string) => {
        const value = getComputedStyle(document.documentElement)
          .getPropertyValue(name)
          .trim();
        return value ? parseInt(value, 10) : 0;
      };

      setInsets({
        top: getEnvValue('safe-area-inset-top'),
        bottom: getEnvValue('safe-area-inset-bottom'),
        left: getEnvValue('safe-area-inset-left'),
        right: getEnvValue('safe-area-inset-right'),
      });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);
    
    return () => window.removeEventListener('resize', updateInsets);
  }, []);

  return insets;
}
