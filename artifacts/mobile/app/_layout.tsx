import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AppProvider } from '@/context/AppContext';
import { WorkProvider } from '@/context/WorkContext';
import { CalendarProvider } from '@/context/CalendarContext';
import { NotesProvider } from '@/context/NotesContext';
import { BudgetProvider } from '@/context/BudgetContext';
import { PeopleProvider } from '@/context/PeopleContext';
import { SocialProvider } from '@/context/SocialContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Work screens */}
      <Stack.Screen name="work/[id]" options={{ title: 'Task', headerBackTitle: 'Work' }} />
      <Stack.Screen name="work/new" options={{ title: 'New Task', presentation: 'modal', headerShown: false }} />

      {/* Calendar screens */}
      <Stack.Screen name="calendar/[id]" options={{ title: 'Event', headerBackTitle: 'Calendar' }} />
      <Stack.Screen name="calendar/new" options={{ title: 'New Event', presentation: 'modal', headerShown: false }} />

      {/* Notes screens */}
      <Stack.Screen name="notes/[id]" options={{ title: '', headerBackTitle: 'Notes' }} />

      {/* Budget screens */}
      <Stack.Screen name="budget/index" options={{ headerShown: false }} />
      <Stack.Screen name="budget/new" options={{ title: 'New Transaction', presentation: 'modal', headerShown: false }} />

      {/* People screens */}
      <Stack.Screen name="people/index" options={{ headerShown: false }} />
      <Stack.Screen name="people/[id]" options={{ title: 'Contact', headerBackTitle: 'People' }} />
      <Stack.Screen name="people/new" options={{ title: 'New Contact', presentation: 'modal', headerShown: false }} />

      {/* Social screens */}
      <Stack.Screen name="social/index" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AppProvider>
                <WorkProvider>
                  <CalendarProvider>
                    <NotesProvider>
                      <BudgetProvider>
                        <PeopleProvider>
                          <SocialProvider>
                            <RootLayoutNav />
                          </SocialProvider>
                        </PeopleProvider>
                      </BudgetProvider>
                    </NotesProvider>
                  </CalendarProvider>
                </WorkProvider>
              </AppProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
