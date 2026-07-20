import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

interface AvatarProps {
  name: string;
  color: string;
  size?: number;
  uri?: string; // local or remote photo URI; falls back to initials if absent
}

export function Avatar({ name, color, size = 40, uri }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const fontSize = Math.floor(size * 0.35);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.photo,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        contentFit="cover"
        transition={150}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${color}22`,
          borderColor: `${color}44`,
          borderWidth: 1.5,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize, color }]}>{initials || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  photo: {
    // borderRadius set inline to stay circular at any size
  },
});
