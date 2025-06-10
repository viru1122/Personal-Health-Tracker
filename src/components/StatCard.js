import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Tooltip
} from '@mui/material';

const StatCard = ({ title, value, icon, color, progress, subValue, tooltip }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ 
          backgroundColor: `${color}15`,
          borderRadius: '50%',
          p: 1,
          mr: 2,
          display: 'flex'
        }}>
          {React.cloneElement(icon, { sx: { color } })}
        </Box>
        <Tooltip title={tooltip || title} arrow>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Tooltip>
      </Box>
      <Typography variant="h4" component="div" gutterBottom>
        {value}
      </Typography>
      {subValue && (
        <Typography variant="body2" color="text.secondary">
          {subValue}
        </Typography>
      )}
      {progress !== undefined && (
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            mt: 2,
            height: 8,
            borderRadius: 4,
            backgroundColor: `${color}20`,
            '& .MuiLinearProgress-bar': {
              backgroundColor: color,
              borderRadius: 4
            }
          }} 
        />
      )}
    </CardContent>
  </Card>
);

export default StatCard; 