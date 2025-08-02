import { StyleSheet, Text, View } from 'react-native';

interface Props {
  step: number;
  totalSteps: number;
}

export default function ProgressBarCustom({ step, totalSteps }: Props) {
  const progress = (step + 1) / totalSteps;

  return (
    <View style={styles.container}>
      <View style={[styles.fill, { flex: progress }]} />
      <View style={{ flex: 1 - progress }} />
      <Text>0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 8,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  fill: {
    backgroundColor: '#f25',
  },
});
