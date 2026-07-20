import React, { useRef, useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const ITEM_H = 48;
const VISIBLE = 5;

const HOURS = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const PERIODS = ['AM', 'PM'];

function Column({
  data,
  selectedIndex,
  onSelect,
  width,
}: {
  data: string[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  width: number;
}) {
  const colors = useColors();
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: selectedIndex * ITEM_H, animated: false });
  }, [selectedIndex]);

  const handleEnd = useCallback(
    (e: any) => {
      const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
      onSelect(Math.max(0, Math.min(idx, data.length - 1)));
    },
    [data.length, onSelect],
  );

  return (
    <View style={[styles.col, { width }]}>
      <View style={styles.spacer} pointerEvents="none" />
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(_, i) => String(i)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={handleEnd}
        onScrollEndDrag={handleEnd}
        getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        style={{ height: ITEM_H * VISIBLE }}
        initialNumToRender={VISIBLE + 4}
        renderItem={({ item, index }) => {
          const sel = index === selectedIndex;
          return (
            <TouchableOpacity
              style={styles.item}
              activeOpacity={0.7}
              onPress={() => {
                onSelect(index);
                listRef.current?.scrollToOffset({ offset: index * ITEM_H, animated: true });
              }}
            >
              <Text
                style={[
                  styles.itemText,
                  { color: sel ? colors.foreground : colors.mutedForeground },
                  sel && styles.itemTextSel,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
      <View style={styles.spacer} pointerEvents="none" />
    </View>
  );
}

/** Convert a Date to picker indices */
function dateToIndices(d: Date) {
  const h24 = d.getHours();
  const period = h24 < 12 ? 0 : 1;
  const h12 = h24 % 12; // 0 for 12:xx
  const hourIdx = h12 === 0 ? 11 : h12 - 1; // HOURS array: [12,1,2,...,11]
  const min = d.getMinutes();
  const minIdx = Math.min(Math.round(min / 5), MINUTES.length - 1);
  return { hourIdx, minIdx, periodIdx: period };
}

/** Apply picker indices back to a Date (preserving the date part) */
function applyIndices(base: Date, hourIdx: number, minIdx: number, periodIdx: number): Date {
  const result = new Date(base);
  // HOURS array: index 0 → "12", index 1 → "1", ...index 11 → "11"
  const hour12 = hourIdx === 0 ? 12 : hourIdx + 1;
  let hour24: number;
  if (periodIdx === 0) {
    // AM
    hour24 = hour12 === 12 ? 0 : hour12;
  } else {
    // PM
    hour24 = hour12 === 12 ? 12 : hour12 + 12;
  }
  result.setHours(hour24, Number(MINUTES[minIdx]), 0, 0);
  return result;
}

interface TimePickerModalProps {
  visible: boolean;
  title?: string;
  value: Date;
  onConfirm: (date: Date) => void;
  onDismiss: () => void;
}

export function TimePickerModal({
  visible,
  title = 'Select Time',
  value,
  onConfirm,
  onDismiss,
}: TimePickerModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const init = dateToIndices(value);
  const [hourIdx, setHourIdx] = useState(init.hourIdx);
  const [minIdx, setMinIdx] = useState(init.minIdx);
  const [periodIdx, setPeriodIdx] = useState(init.periodIdx);

  useEffect(() => {
    if (!visible) return;
    const i = dateToIndices(value);
    setHourIdx(i.hourIdx);
    setMinIdx(i.minIdx);
    setPeriodIdx(i.periodIdx);
  }, [visible]);

  const handleConfirm = useCallback(() => {
    onConfirm(applyIndices(value, hourIdx, minIdx, periodIdx));
  }, [value, hourIdx, minIdx, periodIdx, onConfirm]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <View style={[styles.titleRow, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={onDismiss}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.cancel, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.titleText, { color: colors.foreground }]}>{title}</Text>
          <TouchableOpacity
            onPress={handleConfirm}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.done, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.columnsWrap}>
          <View
            style={[
              styles.selBar,
              { top: ITEM_H * 2, backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}25` },
            ]}
            pointerEvents="none"
          />
          <Column data={HOURS} selectedIndex={hourIdx} onSelect={setHourIdx} width={72} />
          <Text style={[styles.colon, { color: colors.foreground }]}>:</Text>
          <Column data={MINUTES} selectedIndex={minIdx} onSelect={setMinIdx} width={72} />
          <Column data={PERIODS} selectedIndex={periodIdx} onSelect={setPeriodIdx} width={64} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  cancel: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  done: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  columnsWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'relative',
  },
  selBar: {
    position: 'absolute',
    left: 28,
    right: 28,
    height: ITEM_H,
    borderRadius: 10,
    borderWidth: 1,
    zIndex: 0,
  },
  col: { overflow: 'hidden' },
  spacer: { height: ITEM_H * 2 },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  itemText: { fontSize: 20, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  itemTextSel: { fontFamily: 'Inter_600SemiBold', fontSize: 22 },
  colon: { fontSize: 24, fontFamily: 'Inter_700Bold', marginHorizontal: 4, marginBottom: ITEM_H },
});
