import React, { useRef, useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const ITEM_H = 48;
const VISIBLE = 5; // items visible at once; center one is selected

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function makeYears() {
  const current = new Date().getFullYear();
  const years: string[] = [];
  for (let y = current; y >= current - 120; y--) years.push(String(y));
  return years;
}
const YEARS = makeYears();

function makeDays(month: number, year: number) {
  const count = new Date(year, month, 0).getDate(); // last day of month
  return Array.from({ length: count }, (_, i) => String(i + 1).padStart(2, '0'));
}

interface ColumnProps {
  data: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  width: number;
}

function Column({ data, selectedIndex, onSelect, width }: ColumnProps) {
  const colors = useColors();
  const listRef = useRef<FlatList>(null);

  // Scroll to selected item on mount and when selection changes
  useEffect(() => {
    listRef.current?.scrollToOffset({
      offset: selectedIndex * ITEM_H,
      animated: false,
    });
  }, [selectedIndex]);

  const handleMomentumEnd = useCallback((e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    onSelect(Math.max(0, Math.min(index, data.length - 1)));
  }, [data.length, onSelect]);

  const handleScrollEnd = useCallback((e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    onSelect(Math.max(0, Math.min(index, data.length - 1)));
  }, [data.length, onSelect]);

  const renderItem = useCallback(({ item, index }: { item: string; index: number }) => {
    const isSelected = index === selectedIndex;
    return (
      <TouchableOpacity
        onPress={() => {
          onSelect(index);
          listRef.current?.scrollToOffset({ offset: index * ITEM_H, animated: true });
        }}
        style={styles.item}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.itemText,
            { color: isSelected ? colors.foreground : colors.mutedForeground },
            isSelected && styles.itemTextSelected,
          ]}
          numberOfLines={1}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  }, [selectedIndex, colors, onSelect]);

  return (
    <View style={[styles.column, { width }]}>
      {/* top fade spacer */}
      <View style={styles.spacer} pointerEvents="none" />

      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollEndDrag={handleScrollEnd}
        getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        style={{ height: ITEM_H * VISIBLE }}
        initialNumToRender={VISIBLE + 4}
      />

      {/* bottom fade spacer */}
      <View style={styles.spacer} pointerEvents="none" />
    </View>
  );
}

interface DatePickerModalProps {
  visible: boolean;
  value: string; // ISO date "YYYY-MM-DD" or empty
  onConfirm: (iso: string) => void;
  onDismiss: () => void;
}

export function DatePickerModal({ visible, value, onConfirm, onDismiss }: DatePickerModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // Parse initial value
  const parsed = value ? value.split('-') : [];
  const initYear = parsed[0] || String(new Date().getFullYear() - 25);
  const initMonth = parsed[1] ? Number(parsed[1]) : 1;  // 1-12
  const initDay = parsed[2] ? Number(parsed[2]) : 1;

  const [monthIdx, setMonthIdx] = React.useState(initMonth - 1);       // 0-11
  const [yearIdx, setYearIdx] = React.useState(
    Math.max(0, YEARS.indexOf(initYear))
  );
  const [dayIdx, setDayIdx] = React.useState(initDay - 1);              // 0-based

  // Re-sync when modal opens with a new value
  useEffect(() => {
    if (!visible) return;
    const p = value ? value.split('-') : [];
    const y = p[0] || String(new Date().getFullYear() - 25);
    const m = p[1] ? Number(p[1]) : 1;
    const d = p[2] ? Number(p[2]) : 1;
    setMonthIdx(m - 1);
    setYearIdx(Math.max(0, YEARS.indexOf(y)));
    setDayIdx(d - 1);
  }, [visible]);

  const year = Number(YEARS[yearIdx]);
  const month = monthIdx + 1; // 1-12
  const days = makeDays(month, year);

  // Clamp day when month/year changes
  useEffect(() => {
    if (dayIdx >= days.length) setDayIdx(days.length - 1);
  }, [days.length, dayIdx]);

  const handleConfirm = useCallback(() => {
    const mm = String(month).padStart(2, '0');
    const dd = String(Math.min(dayIdx + 1, days.length)).padStart(2, '0');
    const yy = YEARS[yearIdx];
    onConfirm(`${yy}-${mm}-${dd}`);
  }, [month, dayIdx, days.length, yearIdx, onConfirm]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      {/* Backdrop */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onDismiss} />

      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Title row */}
        <View style={[styles.titleRow, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[styles.cancelBtn, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Select Birthday</Text>
          <TouchableOpacity onPress={handleConfirm} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[styles.doneBtn, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Picker columns */}
        <View style={styles.columnsWrap}>
          {/* Selection highlight bar */}
          <View
            style={[
              styles.selectionBar,
              { top: ITEM_H * 2, backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}25` },
            ]}
            pointerEvents="none"
          />

          <Column
            data={MONTHS}
            selectedIndex={monthIdx}
            onSelect={setMonthIdx}
            width={140}
          />
          <Column
            data={days}
            selectedIndex={Math.min(dayIdx, days.length - 1)}
            onSelect={setDayIdx}
            width={56}
          />
          <Column
            data={YEARS}
            selectedIndex={yearIdx}
            onSelect={setYearIdx}
            width={80}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
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
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  cancelBtn: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  doneBtn: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  columnsWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'relative',
  },
  selectionBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: ITEM_H,
    borderRadius: 10,
    borderWidth: 1,
    zIndex: 0,
  },
  column: {
    overflow: 'hidden',
  },
  spacer: {
    height: ITEM_H * 2,
  },
  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  itemText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  itemTextSelected: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
  },
});
