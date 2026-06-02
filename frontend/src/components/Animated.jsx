import { useEffect, useRef, useState } from 'react';
import { animate, stagger, set } from 'animejs';

/**
 * Generic Enter Transition Component
 * Fades and glides elements into place using high-quality easing curves.
 */
export const Animated = ({
  children,
  type = 'slide-up',
  delay = 0,
  duration = 1000,
  easing = 'outExpo',
  className = '',
  style = {},
  ...props
}) => {
  const elementRef = useRef(null);

  useEffect(() => {
    if (!elementRef.current) return;

    let initialStyles = {};
    let animationParams = {
      duration,
      delay,
      ease: easing,
    };

    switch (type) {
      case 'slide-up':
        initialStyles = { opacity: 0, translateY: 30 };
        animationParams = { ...animationParams, opacity: [0, 1], translateY: [30, 0] };
        break;
      case 'slide-down':
        initialStyles = { opacity: 0, translateY: -30 };
        animationParams = { ...animationParams, opacity: [0, 1], translateY: [-30, 0] };
        break;
      case 'slide-left':
        initialStyles = { opacity: 0, translateX: 30 };
        animationParams = { ...animationParams, opacity: [0, 1], translateX: [30, 0] };
        break;
      case 'slide-right':
        initialStyles = { opacity: 0, translateX: -30 };
        animationParams = { ...animationParams, opacity: [0, 1], translateX: [-30, 0] };
        break;
      case 'zoom-in':
        initialStyles = { opacity: 0, scale: 0.9 };
        animationParams = { ...animationParams, opacity: [0, 1], scale: [0.9, 1] };
        break;
      case 'fade':
        initialStyles = { opacity: 0 };
        animationParams = { ...animationParams, opacity: [0, 1] };
        break;
      case 'bounce':
        initialStyles = { opacity: 0, scale: 0.4 };
        animationParams = {
          ...animationParams,
          opacity: [0, 1],
          scale: [0.4, 1],
          ease: 'outElastic(1, .7)'
        };
        break;
      default:
        break;
    }

    // Set starting position using v4 set utility
    set(elementRef.current, initialStyles);

    // Trigger animation using v4 animate
    const anim = animate(elementRef.current, animationParams);

    return () => {
      anim.pause();
    };
  }, [type, delay, duration, easing]);

  return (
    <div ref={elementRef} className={className} style={style} {...props}>
      {children}
    </div>
  );
};

/**
 * Generic Stagger Entrance Component
 * Sequentially animates direct children to create a premium flow.
 */
export const AnimatedStagger = ({
  children,
  type = 'slide-up',
  interval = 80,
  delay = 0,
  duration = 900,
  easing = 'outExpo',
  className = '',
  style = {},
  ...props
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const childNodes = Array.from(containerRef.current.children);
    if (childNodes.length === 0) return;

    let initialStyles = {};
    let animationParams = {
      duration,
      delay: stagger(interval, { start: delay }),
      ease: easing,
    };

    switch (type) {
      case 'slide-up':
        initialStyles = { opacity: 0, translateY: 25 };
        animationParams = { ...animationParams, opacity: [0, 1], translateY: [25, 0] };
        break;
      case 'slide-down':
        initialStyles = { opacity: 0, translateY: -25 };
        animationParams = { ...animationParams, opacity: [0, 1], translateY: [-25, 0] };
        break;
      case 'zoom-in':
        initialStyles = { opacity: 0, scale: 0.92 };
        animationParams = { ...animationParams, opacity: [0, 1], scale: [0.92, 1] };
        break;
      case 'fade':
        initialStyles = { opacity: 0 };
        animationParams = { ...animationParams, opacity: [0, 1] };
        break;
      default:
        break;
    }

    set(childNodes, initialStyles);
    const anim = animate(childNodes, animationParams);

    return () => {
      anim.pause();
    };
  }, [type, interval, delay, duration, easing]);

  return (
    <div ref={containerRef} className={className} style={style} {...props}>
      {children}
    </div>
  );
};

/**
 * Generic Shake Animation Component
 * Wobbles element horizontally to denote validation failures or system blocks.
 */
export const Shake = ({
  children,
  trigger,
  active = true,
  className = '',
  style = {},
  ...props
}) => {
  const elementRef = useRef(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!elementRef.current || !active || !trigger) return;

    set(elementRef.current, { translateX: 0 });

    const anim = animate(elementRef.current, {
      keyframes: [
        { translateX: -12, duration: 50 },
        { translateX: 12, duration: 50 },
        { translateX: -10, duration: 60 },
        { translateX: 10, duration: 60 },
        { translateX: -6, duration: 70 },
        { translateX: 6, duration: 70 },
        { translateX: 0, duration: 80 }
      ],
      ease: 'inOutSine'
    });

    return () => {
      anim.pause();
    };
  }, [trigger, active]);

  return (
    <div
      ref={elementRef}
      className={className}
      style={{ display: 'block', width: '100%', ...style }}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Generic Hover & Click Micro-Animation Hook/Wrapper
 * Implements a modern dynamic pop scale effect for premium interactive buttons.
 */
export const PopInteractive = ({
  children,
  scale = 0.97,
  hoverScale = 1.02,
  duration = 300,
  className = '',
  style = {},
  ...props
}) => {
  const elementRef = useRef(null);

  const handleMouseEnter = () => {
    if (!elementRef.current) return;
    animate(elementRef.current, {
      scale: hoverScale,
      duration,
      ease: 'outQuad'
    });
  };

  const handleMouseLeave = () => {
    if (!elementRef.current) return;
    animate(elementRef.current, {
      scale: 1.0,
      duration,
      ease: 'outQuad'
    });
  };

  const handleMouseDown = () => {
    if (!elementRef.current) return;
    animate(elementRef.current, {
      scale: scale,
      duration: 100,
      ease: 'outQuad'
    });
  };

  const handleMouseUp = () => {
    if (!elementRef.current) return;
    animate(elementRef.current, {
      scale: hoverScale,
      duration: 150,
      ease: 'outQuad'
    });
  };

  return (
    <div
      ref={elementRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className={className}
      style={{ display: 'inline-block', width: '100%', ...style }}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Generic Background Floating & Orbiting Component
 * Shifts and oscillates vector decorations in real-time.
 */
export const Floating = ({
  children,
  duration = 7000,
  translateY = [-8, 8],
  translateX = [-4, 4],
  rotate = [-3, 3],
  delay = 0,
  className = '',
  style = {},
  ...props
}) => {
  const elementRef = useRef(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const anim = animate(elementRef.current, {
      translateY,
      translateX,
      rotate,
      duration,
      delay,
      alternate: true,
      loop: true,
      ease: 'inOutSine'
    });

    return () => {
      anim.pause();
    };
  }, [duration, translateY, translateX, rotate, delay]);

  return (
    <div ref={elementRef} className={className} style={{ display: 'block', ...style }} {...props}>
      {children}
    </div>
  );
};

/**
 * Generic Numeric Count-Up Component
 * Animates numbers dynamically for dashboard counters or tickers.
 */
export const CountUp = ({
  value,
  duration = 2000,
  delay = 0,
  easing = 'outExpo',
  formatter = (v) => Math.floor(v).toLocaleString(),
  className = '',
  style = {},
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const obj = { val: prevValue.current };
    
    const anim = animate(obj, {
      val: value,
      duration,
      delay,
      ease: easing,
      onRender: () => {
        setDisplayValue(obj.val);
      }
    });

    return () => {
      anim.pause();
    };
  }, [value, duration, delay, easing]);

  useEffect(() => {
    prevValue.current = value;
  }, [value]);

  return (
    <span className={className} style={style}>
      {formatter(displayValue)}
    </span>
  );
};
