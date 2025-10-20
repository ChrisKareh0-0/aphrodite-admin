import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '../utils/cn';

const NavbarMenu = ({ className, children, ...props }) => {
  const [active, setActive] = useState(null);
  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      onMouseLeave={() => setActive(null)}
      {...props}
    >
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          onMouseEnter: () => setActive(child.props.href),
          setActive,
          active,
        })
      )}
    </div>
  );
};

const NavbarMenuItem = ({ children, href, setActive, active, className, isActive }) => {
  const isItemActive = isActive || active === href;
  
  return (
    <motion.div
      onMouseEnter={() => setActive && setActive(href)}
      className="relative"
    >
      <Link to={href} className="block">
        <motion.p
          className={cn(
            "relative z-10 flex items-center space-x-1 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 px-3 py-2 rounded-lg",
            className
          )}
          animate={{
            color: isItemActive ? "#000000" : "#6B7280",
          }}
        >
          {children}
        </motion.p>
      </Link>
      {isItemActive && (
        <motion.div
          className="absolute inset-0 -z-10 rounded-lg bg-gray-100"
          layoutId="activeBackground"
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: "spring",
            bounce: 0.2,
            duration: 0.6,
          }}
        />
      )}
    </motion.div>
  );
};

export { NavbarMenu, NavbarMenuItem };
