import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  text: string;
};

export function CardTile({ text }: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const isFlipped = useRef(false);

  const flip = () => {
    const toValue = isFlipped.current ? 0 : 1;
    isFlipped.current = !isFlipped.current;
    Animated.spring(anim, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  };

  const backRotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const frontRotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '0deg'],
  });

  const backOpacity = anim.interpolate({
    inputRange: [0.45, 0.55],
    outputRange: [1, 0],
  });

  const frontOpacity = anim.interpolate({
    inputRange: [0.45, 0.55],
    outputRange: [0, 1],
  });

  return (
    <Pressable onPress={flip} style={styles.wrapper}>
      {/* Back face */}
      <Animated.View
        style={[
          styles.face,
          styles.back,
          { opacity: backOpacity, transform: [{ rotateY: backRotate }] },
        ]}
      >
        <Text style={styles.backSymbol}>✦</Text>
        <Text style={styles.backTitle}>Draw Closer</Text>
        <Text style={styles.backHint}>tap to reveal</Text>
      </Animated.View>

      {/* Front face */}
      <Animated.View
        style={[
          styles.face,
          styles.front,
          { opacity: frontOpacity, transform: [{ rotateY: frontRotate }] },
        ]}
      >
        <Text style={styles.question}>{text}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 240,
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  back: {
    backgroundColor: '#2C2440',
    borderWidth: 1,
    borderColor: 'rgba(221,169,78,0.45)',
    gap: 6,
  },
  backSymbol: {
    fontSize: 22,
    color: '#DDA94E',
    marginBottom: 2,
  },
  backTitle: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 15,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#DDA94E',
  },
  backHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#C58A72',
    marginTop: 2,
  },
  front: {
    backgroundColor: '#EFE6D5',
    padding: 28,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  question: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 19,
    lineHeight: 29,
    color: '#2A211B',
  },
});
