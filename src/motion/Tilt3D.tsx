import React, { useState } from 'react';

export interface Tilt3DProps extends React.HTMLAttributes<HTMLDivElement> { maxTilt?: number; }
export const Tilt3D: React.FC<Tilt3DProps> = ({ children, maxTilt = 5, style, onPointerMove, onPointerLeave, ...props }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  return <div {...props} style={{ ...style, transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transformStyle: 'preserve-3d', transition: 'transform 200ms ease-out', willChange: tilt.x || tilt.y ? 'transform' : undefined }} onPointerMove={(event) => { onPointerMove?.(event); if (event.pointerType === 'touch') return; const rect = event.currentTarget.getBoundingClientRect(); setTilt({ x: ((0.5 - (event.clientY - rect.top) / rect.height) * maxTilt), y: (((event.clientX - rect.left) / rect.width - 0.5) * maxTilt) }); }} onPointerLeave={(event) => { onPointerLeave?.(event); setTilt({ x: 0, y: 0 }); }}>{children}</div>;
};
