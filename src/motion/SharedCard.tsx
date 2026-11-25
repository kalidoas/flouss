import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export type SharedCardProps = HTMLMotionProps<'div'> & { sharedId?: string };
export const SharedCard = React.forwardRef<HTMLDivElement, SharedCardProps>(function SharedCard({ sharedId, children, ...props }, ref) {
  return <motion.div ref={ref} layout layoutId={sharedId} {...props}>{children}</motion.div>;
});
