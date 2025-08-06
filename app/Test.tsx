import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const [isAlarmOn, setIsAlarmOn] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(60); // 기본 1시간
  const [waterCount, setWaterCount] = useState(0);

  const todayKey = new Date().toISOString().split('T')[0];

  // 블루스택전용
  // const requestNotificationPermissions = async () => {
  //   const { status: existingStatus } = await Notifications.getPermissionsAsync();
  //   let finalStatus = existingStatus;

  //   if (existingStatus !== 'granted') {
  //     const { status } = await Notifications.requestPermissionsAsync();
  //     finalStatus = status;
  //   }

  //   if (finalStatus !== 'granted') {
  //     Alert.alert('알림 권한이 거부되었습니다');
  //     return false;
  //   }

  //   return true;
  // };

  const requestNotificationPermissions = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('알림 권한이 거부되었습니다', '설정에서 알림 권한을 허용해주세요.');
        return false;
      }

      return true;
    } else {
      Alert.alert('알림 테스트는 실제 기기에서만 가능합니다.');
      return false;
    }
  };

  useEffect(() => {
    requestNotificationPermissions();
  }, []);


  // 알림 권한 요청
  useEffect(() => {
    Notifications.requestPermissionsAsync();
    loadTodayCount();
  }, []);

  // 오늘 마신 물 횟수 불러오기
  const loadTodayCount = async () => {
    const stored = await AsyncStorage.getItem(todayKey);
    setWaterCount(stored ? parseInt(stored) : 0);
  };

  // 물 마시기 기록
  const addWaterIntake = async () => {
    const newCount = waterCount + 1;
    setWaterCount(newCount);
    await AsyncStorage.setItem(todayKey, newCount.toString());
  };

  // 알림 스케줄링
  const scheduleNotification = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💧 물 마실 시간이에요!',
        body: '건강을 위해 물 한 잔 하세요!',
      },
      trigger: {
        seconds: intervalMinutes * 60,
        type: 'timeInterval',
        repeats: true,
      } as Notifications.TimeIntervalTriggerInput,
    });
  };

  // 알림 켜기/끄기
  const toggleAlarm = async (value: boolean) => {
    setIsAlarmOn(value);
    if (value) {
      await scheduleNotification();
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💧 water alarm app test</Text>
      <Text style={styles.countText}>오늘 마신 물: {waterCount}잔</Text>

      <TouchableOpacity style={styles.button} onPress={addWaterIntake}>
        <Text style={styles.buttonText}>+ 물 마시기</Text>
      </TouchableOpacity>

      <Text style={styles.label}>⏰ 알림 간격 선택 (분)</Text>
      <View style={styles.intervalContainer}>
        {[1, 30, 60, 120].map((min) => (
          <TouchableOpacity
            key={min}
            style={[
              styles.intervalButton,
              intervalMinutes === min && styles.intervalButtonActive,
            ]}
            onPress={() => setIntervalMinutes(min)}
          >
            <Text style={styles.intervalText}>{min}분</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.alarmRow}>
        <Text style={styles.label}>🔔 알림 {isAlarmOn ? '켜짐' : '꺼짐'}</Text>
        <Switch value={isAlarmOn} onValueChange={toggleAlarm} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2FCFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  countText: {
    fontSize: 18,
    marginVertical: 12,
  },
  button: {
    backgroundColor: '#00AEEF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  intervalContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  intervalButton: {
    backgroundColor: '#EEE',
    padding: 10,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  intervalButtonActive: {
    backgroundColor: '#00AEEF',
  },
  intervalText: {
    color: '#000',
  },
  alarmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
});
