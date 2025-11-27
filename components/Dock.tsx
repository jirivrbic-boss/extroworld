'use client';

import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { Children, cloneElement, useEffect, useMemo, useRef, useState } from 'react';

function DockItem({ children, className = '', onClick, mouseX, spring, distance, magnification, baseItemSize }: any) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val: number) => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
  const size = useSpring(targetSize, spring);

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={`dock-item ${className}`}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
    >
      {Children.map(children, (child: any) => cloneElement(child, { isHovered }))}
    </motion.div>
  );
}

function DockLabel({ children, className = '', ...rest }: any) {
  const { isHovered } = rest;
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const unsubscribe = isHovered.on('change', (latest: number) => setIsVisible(latest === 1));
    return () => unsubscribe();
  }, [isHovered]);
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`dock-label ${className}`}
          role="tooltip"
          style={{ x: '-50%' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className = '' }: any) {
  return <div className={`dock-icon ${className}`}>{children}</div>;
}

export default function Dock({
  items,
  className = '',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  dockHeight = 256,
  baseItemSize = 50,
  useFixedPosition = true
}: any) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);
  const maxHeight = useMemo(() => Math.max(dockHeight, magnification + magnification / 2 + 4), [magnification, dockHeight]);
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);
  return (
    <motion.div style={{ height: useFixedPosition ? height : maxHeight, scrollbarWidth: 'none' }} className="dock-outer">
      <style jsx global>{`
        .dock-outer { margin: 0 0.5rem; display:flex; max-width:100%; align-items:center; }
        .dock-panel { position: fixed; bottom: .5rem; left:50%; transform:translateX(-50%); display:flex; align-items:flex-end; width:fit-content; gap:1rem; border-radius:1rem; background-color:#060010; border:1px solid #222; padding:0 .5rem .5rem; z-index:50; }
        .dock-item { position:relative; display:inline-flex; align-items:center; justify-content:center; border-radius:10px; background-color:#060010; border:1px solid #222; box-shadow:0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -1px rgba(0,0,0,.06); cursor:pointer; outline:none; }
        .dock-icon { display:flex; align-items:center; justify-content:center; color:#fff; }
        .dock-label { position:absolute; top:-1.5rem; left:50%; width:fit-content; white-space:pre; border-radius:.375rem; border:1px solid #222; background-color:#060010; padding:.125rem .5rem; font-size:.75rem; color:#fff; transform:translateX(-50%); }
      `}</style>
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={`dock-panel ${className}`}
        style={{
          height: panelHeight,
          position: useFixedPosition ? 'fixed' as const : 'static' as const,
          bottom: useFixedPosition ? '.5rem' : 'auto',
          left: useFixedPosition ? '50%' : 'auto',
          transform: useFixedPosition ? 'translateX(-50%)' : 'none',
          margin: useFixedPosition ? undefined : '0 auto',
          justifyContent: useFixedPosition ? undefined : 'center'
        }}
        role="toolbar"
        aria-label="Application dock"
      >
        {items.map((item: any, index: number) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            className={item.className}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  );
}


