import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createInitialProjectFile } from '../src/models/factories';
import {
  type ProjectSummary,
  getDefaultProjectStore,
} from '../src/persistence/projectStore';

const TEXT_DARK = '#1A1A1A';
const TEXT_MUTED = '#8A8A8A';
const HOVER_OPACITY = 0.7;

type RowProps = {
  label: string;
  annotation: string;
  onPress: () => void;
};

function ChooserRow({ label, annotation, onPress }: RowProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      <View style={[styles.labelRow, hovered && styles.hovered]}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.annotation}>{annotation}</Text>
      </View>
      <View style={styles.gapAboveRule} />
      <View style={styles.rule} />
    </Pressable>
  );
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ChooseRoute() {
  const router = useRouter();
  const [mode, setMode] = useState<'menu' | 'list'>('menu');
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshList = useCallback(async () => {
    const list = await getDefaultProjectStore().listProjects();
    setProjects(list);
  }, []);

  // Load the list whenever we enter list mode.
  useEffect(() => {
    if (mode === 'list' && projects === null) {
      refreshList().catch((err) => {
        console.error('[choose] failed to list projects', err);
        setProjects([]);
      });
    }
  }, [mode, projects, refreshList]);

  const onOpenExisting = () => {
    setMode('list');
  };

  const onStartNew = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const bundle = createInitialProjectFile({ name: 'Untitled Story' });
      await getDefaultProjectStore().saveProject(bundle);
      router.push(`/project/${bundle.project.id}/steps`);
    } catch (err) {
      console.error('[choose] failed to create project', err);
      setBusy(false);
    }
  };

  const onPickProject = (id: string) => {
    router.push(`/project/${id}/steps`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentBlock}>
        {mode === 'menu' ? (
          <>
            <ChooserRow
              label="Open existing Story"
              annotation="past"
              onPress={onOpenExisting}
            />
            <View style={styles.gapBetweenRows} />
            <ChooserRow
              label="Start New Story"
              annotation="prologue"
              onPress={onStartNew}
            />
          </>
        ) : (
          <ProjectList
            projects={projects}
            onBack={() => setMode('menu')}
            onPick={onPickProject}
          />
        )}
      </View>
    </View>
  );
}

type ProjectListProps = {
  projects: ProjectSummary[] | null;
  onBack: () => void;
  onPick: (id: string) => void;
};

// Placeholder inline list — the spec's full Project List screen
// (Spec_ProjectChooser_Design §navigation) is a future task. This minimal
// version proves persistence is working.
function ProjectList({ projects, onBack, onPick }: ProjectListProps) {
  return (
    <View>
      <ChooserRow label="← Back" annotation="" onPress={onBack} />
      <View style={styles.gapBetweenRows} />
      {projects === null && <Text style={styles.empty}>Loading…</Text>}
      {projects !== null && projects.length === 0 && (
        <Text style={styles.empty}>No saved stories yet.</Text>
      )}
      {projects !== null && projects.length > 0 && (
        <ScrollView style={styles.scrollList}>
          {projects.map((p) => (
            <View key={p.id}>
              <ChooserRow
                label={p.name || 'Untitled Story'}
                annotation={formatRelativeDate(p.updatedAt)}
                onPress={() => onPick(p.id)}
              />
              <View style={styles.gapBetweenRows} />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentBlock: {
    position: 'absolute',
    top: '36.4%',
    left: '5.3%',
    width: '48%',
  },
  row: {},
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingLeft: 23,
  },
  label: {
    fontFamily: 'Barlow_100Thin',
    fontSize: 40,
    color: TEXT_DARK,
    includeFontPadding: false,
  },
  annotation: {
    fontFamily: 'Aleo_700Bold',
    fontSize: 24,
    color: TEXT_DARK,
    includeFontPadding: false,
  },
  gapAboveRule: {
    height: 32,
  },
  rule: {
    height: 1,
    backgroundColor: TEXT_DARK,
    width: '100%',
  },
  gapBetweenRows: {
    height: 50,
  },
  hovered: {
    opacity: HOVER_OPACITY,
  },
  empty: {
    paddingLeft: 23,
    fontFamily: 'Aleo_400Regular',
    fontSize: 20,
    color: TEXT_MUTED,
  },
  scrollList: {
    maxHeight: 360,
  },
});
