// components/ui/ProposalActionSheet.tsx
import { Proposal } from '@/types/entities';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ProposalActionSheetProps {
  visible: boolean;
  proposal: Proposal | null;
  onClose: () => void;
  onAccept: (proposal: Proposal) => void;
  onReject: (proposal: Proposal) => void;
  onReport: (proposal: Proposal) => void;
}

export const ProposalActionSheet: React.FC<ProposalActionSheetProps> = ({
  visible,
  proposal,
  onClose,
  onAccept,
  onReject,
  onReport,
}) => {
  if (!proposal) return null;

  const handleAccept = () => {
    onAccept(proposal);
    onClose();
  };

  const handleReject = () => {
    onReject(proposal);
    onClose();
  };

  const handleReport = () => {
    onReport(proposal);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#1a1a2e', '#16213e']}
            style={styles.modal}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Proposal Actions</Text>
              <Text style={styles.candidateName}>
                {proposal.user.name}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={handleAccept}
              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.actionText}>Accept Proposal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={handleReject}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.actionText}>Reject Proposal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.reportButton]}
                onPress={handleReport}
              >
                <MaterialCommunityIcons
                  name="flag"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.actionText}>Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={onClose}
              >
                <MaterialCommunityIcons
                  name="cancel"
                  size={20}
                  color="#9ca3af"
                />
                <Text style={[styles.actionText, styles.cancelText]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
  },
  modal: {
    borderRadius: 16,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  candidateName: {
    fontSize: 16,
    color: '#9ca3af',
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  acceptButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  rejectButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  reportButton: {
    backgroundColor: 'rgba(251, 146, 60, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.4)',
  },
  cancelButton: {
    backgroundColor: 'rgba(75, 85, 99, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.4)',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  cancelText: {
    color: '#9ca3af',
  },
});