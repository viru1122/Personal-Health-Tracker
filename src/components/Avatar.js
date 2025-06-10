import React from 'react';
import { Avatar as MUIAvatar } from '@mui/material';
import { Person } from '@mui/icons-material';

const Avatar = ({ src, alt, ...props }) => {
  return (
    <MUIAvatar {...props}>
      {src ? (
        <img 
          src={src} 
          alt={alt || 'User avatar'} 
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.onerror = null;
          }}
        />
      ) : (
        <Person />
      )}
    </MUIAvatar>
  );
};

export default Avatar; 