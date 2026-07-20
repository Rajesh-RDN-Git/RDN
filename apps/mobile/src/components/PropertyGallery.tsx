import { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/lib/theme';

const light = colors.light;

interface MediaItem {
  url: string;
  type?: string;
}

const BLUR_HASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

/**
 * Swipeable property image gallery with paging dots. Falls back to a neutral
 * placeholder when a listing has no photos. Uses expo-image for caching + blur-up.
 */
export function PropertyGallery({ media }: { media?: MediaItem[] }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const images = (media ?? []).filter((m) => m?.url);

  if (images.length === 0) {
    return (
      <View style={[styles.placeholder, { width, height: width * 0.72 }]}>
        <Text style={styles.placeholderText}>No photos yet</Text>
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={images}
        keyExtractor={(item, i) => `${item.url}-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item.url }}
            style={{ width, height: width * 0.72 }}
            contentFit="cover"
            transition={200}
            placeholder={BLUR_HASH}
          />
        )}
      />
      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: light.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 15, color: light.textTertiary },
  dots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: { backgroundColor: '#fff', width: 18 },
});
