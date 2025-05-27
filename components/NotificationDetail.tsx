import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NotificationDetailProps {
  visible: boolean;
  onClose: () => void;
  notification: {
    title: string;
    body: string;
    description?: string;
    date: Date;
  } | null;
}

export const NotificationDetail: React.FC<NotificationDetailProps> = ({
  visible,
  onClose,
  notification,
}) => {
  if (!notification) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{notification.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#757575" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.body}>
              <Text style={styles.date}>
                {notification.date.toLocaleDateString()} at {notification.date.toLocaleTimeString()}
              </Text>
              
              <Text style={styles.message}>{notification.body}</Text>
              
              {notification.description && notification.description !== notification.body && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>Details:</Text>
                  <Text style={styles.description}>{notification.description}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: 400,
  },
  body: {
    padding: 16,
  },
  date: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#212121',
    lineHeight: 24,
    marginBottom: 16,
  },
  descriptionContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#212121',
    lineHeight: 20,
  },
});