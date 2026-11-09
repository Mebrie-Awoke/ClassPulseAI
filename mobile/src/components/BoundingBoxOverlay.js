/**
 * RoomPulse — BoundingBoxOverlay Component.
 *
 * Renders real-time YOLO bounding boxes, class labels, and confidence tags
 * mapped accurately over the live CameraView preview.
 *
 * Supported classes: person, chair, book, laptop, tv
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CLASS_COLORS = {
  person: '#00D2FF',   // Neon Cyan
  chair: '#FFB800',    // Amber Gold
  laptop: '#00E676',   // Neon Emerald
  book: '#B388FF',     // Soft Violet
  tv: '#FF5252',       // Coral Red
  default: '#087E9A',  // RoomPulse Primary
};

export default function BoundingBoxOverlay({
  detections = [],
  imageWidth,
  imageHeight,
  layoutWidth,
  layoutHeight,
}) {
  // Compute aspect-fill scaling and offsets
  const renderedBoxes = useMemo(() => {
    if (!detections || detections.length === 0) return [];
    if (!layoutWidth || !layoutHeight || !imageWidth || !imageHeight) return [];

    const scale = Math.max(layoutWidth / imageWidth, layoutHeight / imageHeight);
    const scaledWidth = imageWidth * scale;
    const scaledHeight = imageHeight * scale;
    const offsetX = (layoutWidth - scaledWidth) / 2;
    const offsetY = (layoutHeight - scaledHeight) / 2;

    return detections.map((det, index) => {
      const [x1, y1, x2, y2] = det.box;
      const left = Math.max(0, x1 * scale + offsetX);
      const top = Math.max(0, y1 * scale + offsetY);
      const width = Math.min(layoutWidth - left, (x2 - x1) * scale);
      const height = Math.min(layoutHeight - top, (y2 - y1) * scale);
      const color = CLASS_COLORS[det.label] || CLASS_COLORS.default;
      const confidencePercent = Math.round((det.confidence || 0) * 100);
      const formattedLabel = det.label
        ? det.label.charAt(0).toUpperCase() + det.label.slice(1)
        : 'Object';

      return {
        id: `${det.label}-${index}`,
        left,
        top,
        width,
        height,
        color,
        formattedLabel,
        confidencePercent,
      };
    });
  }, [detections, imageWidth, imageHeight, layoutWidth, layoutHeight]);

  if (renderedBoxes.length === 0) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {renderedBoxes.map((box) => (
        <View
          key={box.id}
          style={[
            styles.box,
            {
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
              borderColor: box.color,
            },
          ]}
        >
          {/* Label & Confidence Chip */}
          <View style={[styles.labelChip, { backgroundColor: box.color }]}>
            <Text style={styles.labelText}>
              {box.formattedLabel} {box.confidencePercent}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  labelChip: {
    position: 'absolute',
    top: -19,
    left: -2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  labelText: {
    color: '#030712',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

