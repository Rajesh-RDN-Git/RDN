import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { mediaApi } from '@/lib/api/media';

type UploadedMedia = {
  localUri: string;
  remoteUrl: string;
};

interface Props {
  maxItems?: number;
  onChange?: (urls: string[]) => void;
}

export function MediaUploader({ maxItems = 10, onChange }: Props) {
  const [items, setItems] = useState<UploadedMedia[]>([]);
  const [uploading, setUploading] = useState(false);

  const notify = useCallback(
    (next: UploadedMedia[]) => {
      setItems(next);
      onChange?.(next.map((m) => m.remoteUrl));
    },
    [onChange],
  );

  const pickAndUpload = useCallback(async () => {
    if (items.length >= maxItems) {
      Alert.alert('Limit reached', `Maximum ${maxItems} photos allowed.`);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission denied', 'Photo library access is required to upload images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: maxItems - items.length,
      quality: 0.85,
    });
    if (result.canceled) return;

    setUploading(true);
    const uploaded: UploadedMedia[] = [];
    try {
      for (const asset of result.assets) {
        const fileName = asset.fileName || `photo-${Date.now()}.jpg`;
        const contentType = asset.mimeType || 'image/jpeg';

        const { data: presignResponse } = await mediaApi.getPresignedUrl({ fileName, contentType });
        const inner = presignResponse?.data || presignResponse;
        const uploadUrl: string | undefined = inner?.uploadUrl || inner?.url;
        const publicUrl: string | undefined = inner?.publicUrl || inner?.fileUrl;
        if (!uploadUrl || !publicUrl) {
          throw new Error('Presigned URL response missing uploadUrl/publicUrl');
        }

        const blob = await (await fetch(asset.uri)).blob();
        const put = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': contentType },
          body: blob,
        });
        if (!put.ok) throw new Error(`S3 upload failed: ${put.status}`);

        uploaded.push({ localUri: asset.uri, remoteUrl: publicUrl });
      }
      notify([...items, ...uploaded]);
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message || 'Could not upload photo');
    } finally {
      setUploading(false);
    }
  }, [items, maxItems, notify]);

  const remove = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    notify(next);
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {items.map((item, idx) => (
          <View key={item.remoteUrl} style={styles.thumbWrap}>
            <Image source={{ uri: item.localUri }} style={styles.thumb} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => remove(idx)}>
              <Text style={styles.removeText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        {items.length < maxItems && (
          <TouchableOpacity style={styles.addBtn} onPress={pickAndUpload} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color="#2563eb" />
            ) : (
              <Text style={styles.addText}>+ Add photo</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.hint}>
        {items.length}/{maxItems} uploaded
      </Text>
    </View>
  );
}

const THUMB = 88;

const styles = StyleSheet.create({
  container: { width: '100%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumbWrap: { position: 'relative' },
  thumb: { width: THUMB, height: THUMB, borderRadius: 8, backgroundColor: '#e5e7eb' },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#fff', fontSize: 14, fontWeight: 'bold', lineHeight: 16 },
  addBtn: {
    width: THUMB,
    height: THUMB,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#2563eb',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
  },
  addText: { color: '#2563eb', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  hint: { marginTop: 8, fontSize: 12, color: '#6b7280' },
});
