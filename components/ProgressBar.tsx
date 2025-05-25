import { colors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  borderRadius?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 6,
  backgroundColor = '#e6e6e6',
  fillColor = colors.primary,
  borderRadius = 3,
}) => {
  // Ensure progress is between 0 and 1
  const safeProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={[styles.container, { height, backgroundColor, borderRadius }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${safeProgress * 100}%`,
            backgroundColor: fillColor,
            borderRadius,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});

export default ProgressBar;